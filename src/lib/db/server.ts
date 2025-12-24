// src/lib/db/server.ts
// Server-only DB helpers (Server Components + Route Handlers)

import { createSupabaseServerClient } from "../supabase/server"
import type { Comment, Contributor, Video } from "@/types"

const GRADIENT_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjcwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjNDk1NDY0IiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iIzI4M2E0YiIgb2Zmc2V0PSIxMDAlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4="

function normalizeComments(comments: unknown): Comment[] {
  let rawComments: unknown = comments

  if (typeof rawComments === "string") {
    try {
      rawComments = JSON.parse(rawComments)
    } catch {
      rawComments = []
    }
  }

  if (!Array.isArray(rawComments)) {
    return []
  }

  return rawComments
    .map((comment, index) => {
      if (!comment || typeof comment !== "object") {
        return null
      }
      const record = comment as Record<string, unknown>
      const text =
        typeof record.text === "string"
          ? record.text
          : typeof record.comment === "string"
            ? record.comment
            : ""

      return {
        id: String(record.id ?? index),
        user: String(record.user ?? record.username ?? "Anonymous"),
        avatarUrl:
          typeof record.avatarUrl === "string"
            ? record.avatarUrl
            : typeof record.avatar_url === "string"
              ? record.avatar_url
              : "",
        text,
        user_id: String(record.user_id ?? ""),
      }
    })
    .filter((comment): comment is Comment => Boolean(comment))
}

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
    comments: normalizeComments(video.comments),
  })) as Video[]
}

export async function getSavedVideos(userId: string): Promise<Video[]> {
  const supabase = await createSupabaseServerClient()

  const { data: saved, error: savedError } = await supabase
    .from("video_bookmarks")
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
    comments: normalizeComments(video.comments),
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
    comments: normalizeComments((data as any).comments),
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
