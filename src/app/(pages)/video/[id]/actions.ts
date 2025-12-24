'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function toggleBookmark(videoId: string) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'LOGIN_REQUIRED', isBookmarked: false }
  }

  const { data: existing, error: existingError } = await supabase
    .from('video_bookmarks')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    throw new Error('Failed to check bookmark status')
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('video_bookmarks')
      .delete()
      .eq('id', existing.id)

    if (error) {
      throw new Error('Failed to remove bookmark')
    }
    revalidatePath(`/video/${videoId}`)
    return { isBookmarked: false }
  }

  const { error } = await supabase
    .from('video_bookmarks')
    .insert({ video_id: videoId, user_id: user.id })

  if (error) {
    throw new Error('Failed to save bookmark')
  }
  revalidatePath(`/video/${videoId}`)
  return { isBookmarked: true }
}
