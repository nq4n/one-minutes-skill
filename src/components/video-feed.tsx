'use client';

import { useState } from 'react';
import type { Video, Category } from '@/types';
import { VideoCard } from './video-card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { CategoryIcon } from './category-icon';

interface VideoFeedProps {
  allVideos: Video[];
  categories: Category[];
}

export function VideoFeed({ allVideos, categories }: VideoFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredVideos =
    selectedCategory === 'all'
      ? allVideos
      : allVideos.filter((video) => video.category_id === selectedCategory);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className={cn("rounded-full", selectedCategory === 'all' && 'bg-primary text-primary-foreground hover:bg-primary/90')}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            className={cn("rounded-full", selectedCategory === category.id && 'bg-primary text-primary-foreground hover:bg-primary/90')}
            onClick={() => setSelectedCategory(category.id)}
          >
            <CategoryIcon name={category.icon} className="mr-2 h-4 w-4" />
            {category.name}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
