'use server'

import { revalidatePath } from 'next/cache'
import { openrouter } from '@/lib/ai/openrouter'
import { createSupabaseServerClient as createSharedSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function getTranscript(videoId: string): Promise<string> {
  if (!videoId) {
    throw new Error('videoId is required')
  }

  const supabase = await createSharedSupabaseServerClient()
  const { data, error } = await supabase
    .from('videos')
    .select('transcript')
    .eq('id', videoId)
    .maybeSingle()

  if (error) {
    throw new Error('Failed to load transcript')
  }

  return typeof data?.transcript === 'string' ? data.transcript.trim() : ''
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
  })

  return stream
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
  })

  const textResponse = completion.choices[0].message.content
  if (!textResponse) throw new Error('No response from AI')

  try {
    const jsonResponse = JSON.parse(textResponse)
    return jsonResponse.recommendations || []
  } catch (e) {
    console.error('Failed to parse AI recommendations:', e)
    return []
  }
}

export async function toggleBookmark(
  videoId: string,
  accessToken: string | null
) {
  try {
    if (!accessToken) {
      return { error: 'LOGIN_REQUIRED', isBookmarked: false }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return { error: 'LOGIN_REQUIRED', isBookmarked: false }
    }

    const { data: existing, error: existingError } = await supabase
      .from('video_bookmarks')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      throw new Error(existingError.message)
    }

    if (existing?.id) {
      const { error } = await supabase
        .from('video_bookmarks')
        .delete()
        .eq('id', existing.id)

      if (error) {
        throw new Error(error.message)
      }
      revalidatePath(`/video/${videoId}`)
      return { isBookmarked: false }
    }

    const { error } = await supabase
      .from('video_bookmarks')
      .insert({ video_id: videoId, user_id: user.id })

    if (error) {
      throw new Error(error.message)
    }
    revalidatePath(`/video/${videoId}`)
    return { isBookmarked: true }
  } catch (e: any) {
    console.error('Error toggling bookmark:', e)
    return { error: 'DATABASE_ERROR', details: e.message }
  }
}
