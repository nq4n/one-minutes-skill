'use client';

import { useState } from 'react';
import SocialOverlay from './social-overlay';
import ViewTracker from '@/components/view-tracker';

export default function VideoInteractionWrapper({ video, comments, creator }: {
  video: any;
  comments: any[];
  creator: any;
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
      />
      <ViewTracker videoId={video.id} onViewIncrement={handleViewIncrement} />
    </>
  );
}
