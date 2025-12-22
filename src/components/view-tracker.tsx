'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ViewTracker({ videoId, onViewIncrement }: { videoId: string; onViewIncrement?: () => void }) {
  useEffect(() => {
    const incrementView = async () => {
      const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });
      if (error) {
        console.error('Error incrementing video views:', error);
      } else {
        // Call the callback if provided and successful
        if (onViewIncrement) {
          onViewIncrement();
        }
      }
    };

    incrementView();
  }, [videoId, onViewIncrement]); // Add onViewIncrement to dependency array

  return null; // This component doesn't render anything visually
}
