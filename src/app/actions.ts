'use server';

import { openrouter } from '@/lib/ai/openrouter';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getTranscript(videoId: string): Promise<string> {
  if (!videoId) {
    throw new Error('videoId is required');
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('videos')
    .select('transcript')
    .eq('id', videoId)
    .maybeSingle();

  if (error) {
    throw new Error('Failed to load transcript');
  }

  return typeof data?.transcript === 'string' ? data.transcript.trim() : '';
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
