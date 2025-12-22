// src/lib/db/server.ts
// Server-only DB helpers (Server Components + Route Handlers)

import { createSupabaseServerClient } from "../supabase/server"
import type { Contributor, Video } from "@/types"

const GRADIENT_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjcwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjNDk1NDY0IiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iIzI4M2E0YiIgb2Zmc2V0PSIxMDAlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4="

export async function getAuthenticatedContributor(): Promise<Contributor | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("contributors")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return error ? null : (data as Contributor)
}

export async function getVideosByContributor(contributorId: string): Promise<Video[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("contributor_id", contributorId)

  if (error || !data) return []

  return (data as any[]).map((video) => ({
    ...video,
    thumbnailUrl: video.thumbnail_url || GRADIENT_PLACEHOLDER,
    views: video.views ?? 0,
    likes: video.likes ?? 0,
    comments: video.comments ?? [],
  })) as Video[]
}

export async function getSavedVideos(userId: string): Promise<Video[]> {
  const supabase = await createSupabaseServerClient()

  const { data: saved, error: savedError } = await supabase
    .from("saved_videos")
    .select("video_id")
    .eq("user_id", userId)

  if (savedError || !saved?.length) return []

  const videoIds = saved.map((s: any) => s.video_id)

  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select("*")
    .in("id", videoIds)

  if (videosError || !videos) return []

  return (videos as any[]).map((video) => ({
    ...video,
    thumbnailUrl: video.thumbnail_url || GRADIENT_PLACEHOLDER,
    views: video.views ?? 0,
    likes: video.likes ?? 0,
    comments: video.comments ?? [],
  })) as Video[]
}

export async function getVideoById(id: string): Promise<Video | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.from("videos").select("*").eq("id", id).single()
  if (error || !data) return null

  return {
    ...(data as any),
    thumbnailUrl: (data as any).thumbnail_url || GRADIENT_PLACEHOLDER,
    videoUrl: (data as any).video_url || "",
    views: (data as any).views ?? 0,
    likes: (data as any).likes ?? 0,
    comments: (data as any).comments ?? [],
  } as Video
}

export async function getContributorById(id: string): Promise<Contributor | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contributors")
    .select("*")
    .eq("id", id)
    .single()

  return error ? null : (data as Contributor)
}
