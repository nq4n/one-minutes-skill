
// This file contains ONLY server-side database functions.
// It uses the Supabase server client and is intended for use in
// Server Components and Route Handlers. It can safely import `next/headers`.

import { createSupabaseClient } from '../supabase/server';
import type { Contributor, Video } from '@/types';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/cookies';

const GRADIENT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjcwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjNDk1NDY0IiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iIzI4M2E0YiIgb2Zmc2V0PSIxMDAlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=';

export async function getAuthenticatedContributor(cookieStore: ReadonlyRequestCookies): Promise<Contributor | null> {
    const supabase = createSupabaseClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('id', user.id)
        .single();

    return error ? null : data;
}

export async function getVideosByContributor(cookieStore: ReadonlyRequestCookies, contributorId: string): Promise<Video[]> {
    const supabase = createSupabaseClient(cookieStore);

    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('contributor_id', contributorId);

    if (error || !data) {
        return [];
    }

    // If a video is missing a thumbnail, replace it with a placeholder.
    // Also, encode the video URLs before returning them to the client.
    return data.map(video => ({
        ...video,
        thumbnailUrl: video.thumbnail_url || GRADIENT_PLACEHOLDER,
    }));
}

export async function getSavedVideos(cookieStore: ReadonlyRequestCookies, userId: string): Promise<Video[]> {
    const supabase = createSupabaseClient(cookieStore);

    const { data: saved, error: savedError } = await supabase
      .from('saved_videos')
      .select('video_id')
      .eq('user_id', userId)

    if (savedError || !saved) {
        return [];
    }
    
    const videoIds = saved.map(s => s.video_id)

    const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .in('id', videoIds);

    if (videosError || !videos) {
        return [];
    }

    // If a video is missing a thumbnail, replace it with a placeholder.
    // Also, encode the video URLs before returning them to the client.
    return videos.map(video => ({
        ...video,
        thumbnailUrl: video.thumbnail_url || GRADIENT_PLACEHOLDER,
    }));
}

export async function getVideoById(cookieStore: ReadonlyRequestCookies, id: string): Promise<Video | null> {
    const supabase = createSupabaseClient(cookieStore);
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }

    // Encode the video URLs before returning them to the client.
    // If a thumbnail is missing, replace it with a placeholder.
    return {
        ...data,
        thumbnailUrl: data.thumbnail_url || GRADIENT_PLACEHOLDER,
        videoUrl: data.video_url || '',
    };
}

export async function getContributorById(cookieStore: ReadonlyRequestCookies, id: string): Promise<Contributor | null> {
    const supabase = createSupabaseClient(cookieStore);
    const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('id', id)
        .single();
    
    return error ? null : data;
}
