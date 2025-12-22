// This file contains public database functions.
// It uses the browser Supabase client (singleton).
// Safe to use in client components and server components
// for PUBLIC data that does NOT require authentication.

import { supabase } from '@/lib/supabase/client'
import type { Contributor, Video, Category } from '@/types'

const GRADIENT_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjcwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjNDk1NDY0IiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iIzI4M2E0YiIgb2Zmc2V0PSIxMDAlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4='

/* ------------------------------------------------------------------ */
/* VIDEOS */
/* ------------------------------------------------------------------ */

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')

  if (error || !data) {
    console.error('getVideos error:', error)
    return []
  }

  return data.map(video => ({
    ...video,
    thumbnailUrl: video.thumbnail_url || GRADIENT_PLACEHOLDER,
  }))
}

export async function getVideoById(
  id: string
): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data || !data.video_url) {
    console.error('getVideoById error:', error)
    return null
  }

  return {
    ...data,
    thumbnailUrl: data.thumbnail_url || GRADIENT_PLACEHOLDER,
    videoUrl: data.video_url,
  }
}

/* ------------------------------------------------------------------ */
/* CATEGORIES */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')

  if (error || !data) {
    console.error('getCategories error:', error)
    return []
  }

  return data
}

/* ------------------------------------------------------------------ */
/* CONTRIBUTORS (PUBLIC PROFILE) */
/* ------------------------------------------------------------------ */

export async function getContributorById(
  id: string
): Promise<Contributor | null> {
  const { data, error } = await supabase
    .from('contributors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('getContributorById error:', error)
    return null
  }

  return data
}
