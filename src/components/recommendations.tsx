
'use client';

import { useState, useEffect } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useSavedVideos } from '@/hooks/use-saved-videos';
import { getRecommendations } from '@/app/actions';
import { VideoCard } from './video-card';
import { getCategories, getVideos } from '@/lib/db/client'; // CORRECTED IMPORT
import type { Category, Video } from '@/types';

export function Recommendations() {
  const { savedVideos } = useSavedVideos();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getVideos().then(setAllVideos);
    getCategories().then(setCategories);
  }, []);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    if (savedVideos.length === 0) {
      setError('Save some videos first to get personalized recommendations!');
      setIsLoading(false);
      return;
    }

    try {
      const userProfile = `The user has saved the following videos: ${savedVideos
        .map((v) => v.title)
        .join(', ')}.`;

      const videoCategories = `Available categories: ${categories
        .map((c) => c.name)
        .join(', ')}.`;

      const result = await getRecommendations(userProfile, videoCategories);
      setRecommendations(result);
    } catch (e) {
      console.error(e);
      setError("Sorry, we couldn't generate recommendations at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  const recommendedVideos = allVideos.filter((video) =>
    recommendations.includes(video.title)
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Get Recommendations
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Your Personalized Feed</SheetTitle>
          <SheetDescription>
            Based on your saved videos, here are a few skills we think you'll
            love.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8">
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">
                Generating your recommendations...
              </p>
            </div>
          )}
          {!isLoading && error && (
            <p className="text-destructive text-center">{error}</p>
          )}
          {!isLoading && !error && recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recommendedVideos.length > 0 ? (
                recommendedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              ) : (
                <p className="text-muted-foreground col-span-2 text-center">
                  We couldn't find exact matches for our recommendations. Try
                  regenerating!
                </p>
              )}
            </div>
          )}
           {!isLoading && !error && recommendations.length === 0 && (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-20 text-center">
               <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                 <Wand2 className="h-8 w-8 text-primary" />
               </div>
               <h2 className="text-xl font-semibold font-headline">No Recommendations Yet</h2>
               <p className="mt-2 text-muted-foreground">
                 Click the button below to generate some recommendations.
               </p>
             </div>
           )}
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={handleGetRecommendations}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {recommendations.length > 0 ? 'Regenerate' : 'Get Recommendations'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
