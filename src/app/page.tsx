
'use client';

import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/video-feed';
import { getVideos, getCategories } from '@/lib/db/client'; // CORRECTED IMPORT
import { Recommendations } from '@/components/recommendations';
import type { Video, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [videosData, categoriesData] = await Promise.all([
          getVideos(),
          getCategories(),
        ]);
        setAllVideos(videosData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
      <main className="flex-1">
        <section className="w-full bg-muted/20 py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Learn Any Skill in Just One Minute
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Discover a world of knowledge, one short video at a time. Get
                personalized recommendations and master new skills faster than
                ever.
              </p>
              <Recommendations />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-16">
          <div className="container">
            {isLoading ? (
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <Skeleton className="h-[550px] w-full" />
                  <Skeleton className="h-[550px] w-full" />
                  <Skeleton className="h-[550px] w-full" />
                  <Skeleton className="h-[550px] w-full" />
               </div>
            ) : (
              <VideoFeed allVideos={allVideos} categories={categories} />
            )}
          </div>
        </section>
      </main>
  );
}
