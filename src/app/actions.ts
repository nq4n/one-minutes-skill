'use server';

import { openrouter } from '@/lib/ai/openrouter';

export async function getTranscript(title: string, videoUrl: string) {
  const stream = await openrouter.chat.completions.create({
    model: 'mistralai/mistral-7b-instruct:free',
    messages: [
      {
        role: 'system',
        content:
          "You are an expert video transcriber. You will be given a video title. Your task is to generate an accurate and readable transcript of the video's audio content. For now, since you can't watch the video, create a plausible simulated transcript based on the title.",
      },
      {
        role: 'user',
        content: `Video Title: ${title}`,
      },
    ],
    stream: true,
  });

  return stream;
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
