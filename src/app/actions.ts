'use server';

import { openrouter } from '@/lib/ai/openrouter';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import OpenAI from 'openai';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const openaiFallback = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function createTranscription(filePath: string) {
  try {
    return await openrouter.audio.transcriptions.create({
      file: createReadStream(filePath),
      model: 'openai/whisper-1',
      response_format: 'text',
    });
  } catch (error) {
    const status =
      typeof (error as { status?: number }).status === 'number'
        ? (error as { status: number }).status
        : undefined;
    if (status === 405 && openaiFallback) {
      return await openaiFallback.audio.transcriptions.create({
        file: createReadStream(filePath),
        model: 'whisper-1',
        response_format: 'text',
      });
    }
    throw error;
  }
}

async function maybeCreateSignedSupabaseUrl(url: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return url;

  if (!url.startsWith(`${supabaseUrl}/storage/v1/object/`)) {
    return url;
  }

  if (url.includes('/storage/v1/object/sign/')) {
    return url;
  }

  const storagePath = url.replace(`${supabaseUrl}/storage/v1/object/`, '');
  const withoutPublic = storagePath.startsWith('public/')
    ? storagePath.replace('public/', '')
    : storagePath;
  const [bucket, ...pathParts] = withoutPublic.split('/');
  const objectPath = pathParts.join('/');

  if (!bucket || !objectPath) {
    return url;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return url;
  }

  return data.signedUrl;
}

async function downloadToFile(url: string, filePath: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error('Failed to download the video for transcription.');
  }

  const stream = Readable.fromWeb(response.body as ReadableStream);
  await pipeline(stream, createWriteStream(filePath));
}

async function extractAudio(inputPath: string, outputPath: string) {
  if (!ffmpegPath) {
    throw new Error('ffmpeg binary not available.');
  }

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(
      ffmpegPath,
      [
        '-i',
        inputPath,
        '-vn',
        '-acodec',
        'mp3',
        '-ar',
        '44100',
        '-ac',
        '2',
        outputPath,
      ],
      { stdio: 'ignore' }
    );

    ffmpeg.on('error', (error) => reject(error));
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Failed to extract audio from video.'));
      }
    });
  });
}

export async function getTranscript(videoUrl: string): Promise<string> {
  if (!videoUrl) {
    throw new Error('Video URL is required for transcription.');
  }

  const tempId = randomUUID();
  const videoPath = path.join(tmpdir(), `${tempId}.mp4`);
  const audioPath = path.join(tmpdir(), `${tempId}.mp3`);

  try {
    const signedUrl = await maybeCreateSignedSupabaseUrl(videoUrl);
    await downloadToFile(signedUrl, videoPath);
    await extractAudio(videoPath, audioPath);

    const transcription = await createTranscription(audioPath);

    const rawText =
      typeof transcription === 'string'
        ? transcription
        : transcription.text ?? transcription.transcription;
    const transcriptText = String(rawText ?? '').trim();

    if (!transcriptText) {
      throw new Error('Transcription service returned no text.');
    }

    return transcriptText;
  } catch (error) {
    console.error(error);
    const status =
      typeof (error as { status?: number }).status === 'number'
        ? (error as { status: number }).status
        : undefined;
    const friendlyMessage =
      status === 401 || status === 403
        ? 'Transcription service authentication failed.'
        : status === 405
          ? 'Transcription service rejected the request.'
          : 'Failed to extract the transcript.';
    if (error instanceof Error) {
      throw new Error(friendlyMessage, { cause: error });
    }
    throw new Error(friendlyMessage, { cause: error });
  } finally {
    await Promise.all([
      unlink(videoPath).catch(() => undefined),
      unlink(audioPath).catch(() => undefined),
    ]);
  }
}

export async function getOrCreateTranscript(
  videoId: string,
  videoUrl: string
): Promise<string> {
  if (!videoId) {
    throw new Error('Video ID is required for transcription.');
  }
  if (!videoUrl) {
    throw new Error('Video URL is required for transcription.');
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('videos')
    .select('transcript')
    .eq('id', videoId)
    .single();

  if (error) {
    throw new Error('Failed to load transcript for this video.');
  }

  const existingTranscript =
    typeof data?.transcript === 'string' ? data.transcript.trim() : '';
  if (existingTranscript) {
    return existingTranscript;
  }

  const transcriptText = (await getTranscript(videoUrl)).trim();
  if (!transcriptText) {
    throw new Error('Transcription service returned no text.');
  }

  const { error: updateError } = await supabase
    .from('videos')
    .update({ transcript: transcriptText })
    .eq('id', videoId);

  if (updateError) {
    throw new Error('Failed to save transcript for this video.');
  }

  return transcriptText;
}

export async function getAnswer(
  videoTitle: string,
  videoDescription: string,
  question: string
) {
  const stream = await openrouter.chat.completions.create({
    model: 'mistralai/mistral-7b-instruct:free',
    messages: [
      {
        role: 'system',
        content:
          "You are a helpful assistant for the OneMinuteSkill app. Your goal is to answer a user's question about a specific skill video. Use the video's title and description as context to answer the question. Keep your answer concise and directly related to the question and the video content.",
      },
      {
        role: 'user',
        content: `Video Title: "${videoTitle}"
Video Description: "${videoDescription}"
User's Question: "${question}"`,
      },
    ],
    stream: true,
  });

  return stream;
}

export async function getRecommendations(
  userProfile: string,
  videoCategories: string
) {
  const completion = await openrouter.chat.completions.create({
    model: 'mistralai/mistral-7b-instruct:free',
    messages: [
      {
        role: 'system',
        content:
          "You are a video recommendation expert. Given the user profile of saved videos and available categories, return a JSON object with a single key 'recommendations' which is an array of 4 recommended video titles. Do not include any other text or explanation.",
      },
      {
        role: 'user',
        content: `User Profile: ${userProfile}\nVideo Categories: ${videoCategories}`,
      },
    ],
    response_format: { type: 'json_object' },
  });
  const textResponse = completion.choices[0].message.content;
  if (!textResponse) {
    throw new Error('No response from AI');
  }
  try {
    const jsonResponse = JSON.parse(textResponse);
    return jsonResponse.recommendations || [];
  } catch (e) {
    console.error('Failed to parse AI recommendations:', e);
    return [];
  }
}
