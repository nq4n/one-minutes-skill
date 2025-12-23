'use server';

import { openrouter } from '@/lib/ai/openrouter';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';

import ffmpegPath from 'ffmpeg-static';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const openai =
  process.env.OPENAI_API_KEY?.trim()
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

/* ----------------------------- Helpers ----------------------------- */

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function asTranscriptText(result: unknown): string {
  // OpenAI SDK returns string for response_format:'text' OR an object in some wrappers
  if (typeof result === 'string') return result.trim();

  if (result && typeof result === 'object') {
    const anyRes = result as any;
    const text = anyRes.text ?? anyRes.transcription ?? anyRes.data?.text;
    if (typeof text === 'string') return text.trim();
  }

  return '';
}

async function maybeCreateSignedSupabaseUrl(url: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return url;

  // Only sign URLs coming from THIS Supabase storage
  if (!url.startsWith(`${supabaseUrl}/storage/v1/object/`)) return url;

  // Already signed
  if (url.includes('/storage/v1/object/sign/')) return url;

  // Convert URL -> bucket + objectPath
  const storagePath = url.replace(`${supabaseUrl}/storage/v1/object/`, '');
  const cleaned = storagePath.startsWith('public/')
    ? storagePath.slice('public/'.length)
    : storagePath;

  const [bucket, ...rest] = cleaned.split('/');
  const objectPath = rest.join('/');

  if (!bucket || !objectPath) return url;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
}

async function downloadToFile(url: string, filePath: string) {
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download video. Status: ${res.status}`);
  }

  const stream = Readable.fromWeb(res.body as ReadableStream);
  await pipeline(stream, createWriteStream(filePath));
}

async function extractMp3(inputMp4: string, outputMp3: string) {
  if (!ffmpegPath) throw new Error('ffmpeg binary not available.');

  await new Promise<void>((resolve, reject) => {
    const p = spawn(
      ffmpegPath,
      [
        '-y',
        '-i',
        inputMp4,
        '-t',
        '75', // safety (your videos are ~60s)
        '-vn',
        '-acodec',
        'mp3',
        '-ar',
        '44100',
        '-ac',
        '2',
        outputMp3,
      ],
      { stdio: 'ignore' }
    );

    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('Failed to extract audio from video (ffmpeg).'));
    });
  });
}

async function transcribeAudio(mp3Path: string): Promise<string> {
  // 1) Prefer OpenAI if key exists (most reliable for audio)
  if (openai) {
    const res = await openai.audio.transcriptions.create({
      file: createReadStream(mp3Path),
      model: 'whisper-1',
      response_format: 'text',
    });

    const text = asTranscriptText(res);
    if (text) return text;
    throw new Error('OpenAI transcription returned empty text.');
  }

  // 2) Try OpenRouter (may be blocked/405 depending on plan/provider)
  try {
    const res = await openrouter.audio.transcriptions.create({
      file: createReadStream(mp3Path),
      model: 'openai/whisper-1',
      response_format: 'text',
    });

    const text = asTranscriptText(res);
    if (text) return text;

    throw new Error('OpenRouter transcription returned empty text.');
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : undefined;

    if (status === 405) {
      throw new Error(
        'OpenRouter transcription is not available on your current setup. Add OPENAI_API_KEY to enable transcription.'
      );
    }

    throw new Error('Transcription request failed.');
  }
}

/* ----------------------------- Actions ----------------------------- */

export async function getTranscript(videoUrl: string): Promise<string> {
  if (!videoUrl || !isHttpUrl(videoUrl)) {
    throw new Error('Valid video URL is required for transcription.');
  }

  const id = randomUUID();
  const videoPath = path.join(tmpdir(), `${id}.mp4`);
  const audioPath = path.join(tmpdir(), `${id}.mp3`);

  try {
    const signedUrl = await maybeCreateSignedSupabaseUrl(videoUrl);
    await downloadToFile(signedUrl, videoPath);
    await extractMp3(videoPath, audioPath);

    const text = (await transcribeAudio(audioPath)).trim();
    if (!text) throw new Error('Transcription returned no text.');

    return text;
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
  if (!videoId) throw new Error('videoId is required.');
  if (!videoUrl) throw new Error('videoUrl is required.');

  const supabase = await createSupabaseServerClient();

  // read existing
  const { data, error } = await supabase
    .from('videos')
    .select('transcript')
    .eq('id', videoId)
    .maybeSingle();

  if (error) throw new Error('Failed to load transcript.');

  const existing =
    typeof data?.transcript === 'string' ? data.transcript.trim() : '';
  if (existing) return existing;

  // generate once
  const generated = (await getTranscript(videoUrl)).trim();
  if (!generated) throw new Error('Transcription returned no text.');

  // save (DB already set in your project)
  const { error: updateError } = await supabase
    .from('videos')
    .update({ transcript: generated })
    .eq('id', videoId);

  if (updateError) {
    // still return generated, but signal save issue
    throw new Error('Transcript generated but failed to save.');
  }

  return generated;
}

/* -------------------- keep other actions as-is -------------------- */

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
  if (!textResponse) throw new Error('No response from AI');

  try {
    const jsonResponse = JSON.parse(textResponse);
    return jsonResponse.recommendations || [];
  } catch (e) {
    console.error('Failed to parse AI recommendations:', e);
    return [];
  }
}
