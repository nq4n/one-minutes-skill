'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function UploadVideoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [externalLinks, setExternalLinks] = useState<string[]>(['']);
  const [uploading, setUploading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user session...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/login'); // Redirect to login if not authenticated
    return null;
  }

  const handleAddLink = () => {
    setExternalLinks([...externalLinks, '']);
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...externalLinks];
    newLinks[index] = value;
    setExternalLinks(newLinks);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = externalLinks.filter((_, i) => i !== index);
    setExternalLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    if (!videoFile || !title) {
      toast({
        title: 'Error',
        description: 'Video file and title are required.',
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    try {
      const contributorResponse = await supabase
        .from('contributors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (contributorResponse.error || !contributorResponse.data) {
        throw new Error('Contributor profile not found.');
      }

      const contributorId = contributorResponse.data.id;

      // 1. Upload video file
      const videoFileName = `${user.id}/${uuidv4()}-${videoFile.name}`;
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoUploadError) {
        throw videoUploadError;
      }

      const videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${videoFileName}`;

      // 2. Upload thumbnail file (if provided)
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbnailFileName = `${user.id}/${uuidv4()}-${thumbnailFile.name}`;
        const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (thumbnailUploadError) {
          throw thumbnailUploadError;
        }
        thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${thumbnailFileName}`;
      }

      // 3. Insert video metadata into the 'videos' table
      const { error: insertError } = await supabase.from('videos').insert({
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        external_links: externalLinks.filter(link => link.trim() !== ''),
        contributor_id: contributorId,
        // category_id: 'some-default-category-id', // TODO: Add category selection
      });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Video uploaded successfully!',
      });
      router.push('/'); // Redirect to home or video page after upload
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error uploading video',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Upload New Video</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <div>
          <Label htmlFor="video-file">Video File *</Label>
          <Input
            id="video-file"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="thumbnail-file">Thumbnail (Optional)</Label>
          <Input
            id="thumbnail-file"
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter video title"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your video..."
            rows={4}
            className="mt-1"
          />
        </div>

        <div>
          <Label>External Links (Optional)</Label>
          {externalLinks.map((link, index) => (
            <div key={index} className="flex space-x-2 mt-2">
              <Input
                type="url"
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                placeholder="https://example.com"
              />
              {externalLinks.length > 1 && (
                <Button type="button" variant="destructive" onClick={() => handleRemoveLink(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddLink} className="mt-2">
            Add Another Link
          </Button>
        </div>

        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Video'}
        </Button>
      </form>
    </main>
  );
}