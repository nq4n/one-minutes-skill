'use client';

import type { Video } from '@/types';
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  video: Video;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video.videoUrl]);

  if (!video.videoUrl) {
    return (
      <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Video not available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden">
      <video
        key={video.videoUrl}
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-[50%_20%]"
        controls
        autoPlay
        preload="metadata"
        poster={video.thumbnailUrl}
        loop
      >
        <source src={video.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
