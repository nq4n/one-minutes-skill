
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoCard } from '@/components/video-card';
import { useSavedVideos } from '@/hooks/use-saved-videos';
import { Heart, Loader2 } from 'lucide-react';
import type { Video } from '@/types';
import { useAuth } from '@/hooks/use-auth';

export default function SavedVideosPage() {
  const { savedVideos, isLoading: isLoadingSaved } = useSavedVideos();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push('/login');
    }
  }, [user, isLoadingAuth, router]);

  const isLoading = isLoadingSaved || isLoadingAuth;

   if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold tracking-tight font-headline mb-6">Saved Videos</h1>

          {savedVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold font-headline">No Saved Videos Yet</h2>
              <p className="mt-2 text-muted-foreground">
                Click the heart icon on any video to save it for later.
              </p>
            </div>
          )}
        </div>
      </main>
  );
}
