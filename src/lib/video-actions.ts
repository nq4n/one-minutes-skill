
import { supabase } from '@/lib/supabase/client';
import type { Contributor, Video } from '@/types';

interface UploadVideoParams {
  videoFile: File;
  thumbnailFile: File;
  title: string;
  description: string;
  categoryId: string;
  contributor: Contributor;
  userId?: string;
}

/**
 * Handles the entire video upload process.
 * 1. Uploads the video file to storage.
 * 2. Uploads the thumbnail file to storage.
 * 3. Inserts the video metadata into the database.
 * @returns An object containing the new video data or an error.
 */
export async function uploadVideo({
  videoFile,
  thumbnailFile,
  title,
  description,
  categoryId,
  contributor,
  userId,
}: UploadVideoParams): Promise<{ data: Video | null; error: any }> {
  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;

  if (!resolvedUserId) {
    return { data: null, error: 'User not authenticated for upload.' };
  }

  // Create unique, user-specific file paths
  const videoFilePath = `${resolvedUserId}/${Date.now()}_${videoFile.name}`;
  const thumbnailFilePath = `${resolvedUserId}/${Date.now()}_${thumbnailFile.name}`;

  // 1. Upload video file
  const { data: videoUploadData, error: videoUploadError } = await supabase.storage
    .from('videos')
    .upload(videoFilePath, videoFile);

  if (videoUploadError) {
    console.error('Error uploading video:', videoUploadError);
    return { data: null, error: videoUploadError };
  }

  // 2. Upload thumbnail file
  const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabase.storage
    .from('thumbnails')
    .upload(thumbnailFilePath, thumbnailFile);

  if (thumbnailUploadError) {
    console.error('Error uploading thumbnail:', thumbnailUploadError);
    // Clean up the video file if thumbnail upload fails
    await supabase.storage.from('videos').remove([videoUploadData.path]);
    return { data: null, error: thumbnailUploadError };
  }

  // 3. Get public URLs for the uploaded files
  const { data: { publicUrl: video_url } } = supabase.storage
    .from('videos')
    .getPublicUrl(videoUploadData.path);
    
  const { data: { publicUrl: thumbnail_url } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(thumbnailUploadData.path);

  // 4. Insert video metadata into the 'videos' table
  const { data: newVideo, error: insertError } = await supabase
    .from('videos')
    .insert({
      title,
      description,
      video_url,
      thumbnail_url,
      category_id: categoryId,
      contributor_id: contributor.id, // Associate video with the contributor
      views: 0,
      likes: 0,
      comments: [],
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting video metadata:', insertError);
    // Clean up storage if database insert fails
    await supabase.storage.from('videos').remove([videoUploadData.path]);
    await supabase.storage.from('thumbnails').remove([thumbnailUploadData.path]);
    return { data: null, error: insertError };
  }

  return { data: newVideo, error: null };
}
