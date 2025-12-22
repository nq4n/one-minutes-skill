'use client';

import { Button } from '@/components/ui/button';
import { useSavedVideos } from '@/hooks/use-saved-videos';
import { cn } from '@/lib/utils';
import type { Video } from '@/types';
import { Heart } from 'lucide-react';

interface VideoActionsProps {
    video: Video;
}

export function VideoActions({ video }: VideoActionsProps) {
    const { isSaved, toggleSaveVideo, isLoading } = useSavedVideos();

    // We are not implementing the like functionality in this component.
    // We are only providing the UI for it.

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
                <Heart className="mr-2 h-4 w-4" />
                Like
            </Button>
            <Button variant="outline" size="sm" onClick={() => toggleSaveVideo(video.id)} disabled={isLoading}>
                <Heart className={cn("mr-2 h-4 w-4", isSaved(video.id) && "fill-red-500 text-red-500")} />
                {isSaved(video.id) ? 'Saved' : 'Save for later'}
            </Button>
        </div>
    );
}
