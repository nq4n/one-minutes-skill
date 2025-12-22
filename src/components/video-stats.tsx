'use client';

import { useSavedVideos } from '@/hooks/use-saved-videos';
import { cn } from '@/lib/utils';
import type { Video } from '@/types';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

interface VideoStatsProps {
  video: Video;
}

export function VideoStats({ video }: VideoStatsProps) {
  const { isSaved, toggleSaveVideo } = useSavedVideos();
  const saved = isSaved(video.id);

  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Eye className="h-5 w-5" />
        <span>{formatCount(video.views)} views</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageCircle className="h-5 w-5" />
        <span>{formatCount(video.comments.length)} comments</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleSaveVideo(video)}
        className={cn(saved && 'border-accent text-accent hover:bg-accent/10 hover:text-accent')}
      >
        <Heart
          className={cn(
            'mr-2 h-5 w-5',
            saved && 'fill-accent'
          )}
        />
        {formatCount(video.likes.length)}
      </Button>
    </div>
  );
}
