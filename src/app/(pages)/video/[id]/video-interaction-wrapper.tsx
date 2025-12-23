'use client';

import { useState } from 'react';
import SocialOverlay from './social-overlay';
import ViewTracker from '@/components/view-tracker';

export default function VideoInteractionWrapper({
  video,
  comments,
  creator,
  isBookmarked,
  isAuthenticated,
}: {
  video: any;
  comments: any[];
  creator: any;
  isBookmarked: boolean;
  isAuthenticated: boolean;
}) {
  const [viewsCount, setViewsCount] = useState(video.views);

  const handleViewIncrement = () => {
    setViewsCount(prev => prev + 1);
  };

  return (
    <>
      <SocialOverlay
        video={{ ...video, views: viewsCount }} // Pass updated viewsCount
        comments={comments}
        creator={creator}
        isBookmarked={isBookmarked}
        isAuthenticated={isAuthenticated}
      />
      <ViewTracker videoId={video.id} onViewIncrement={handleViewIncrement} />
    </>
  );
}
