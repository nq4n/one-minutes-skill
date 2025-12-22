'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

type Props = {
  videoId: string;
  onViewIncrement?: () => void;
};

export default function ViewTracker({ videoId, onViewIncrement }: Props) {
  const didRunRef = useRef(false);

  useEffect(() => {
    if (!videoId) return;

    // Extra guard ضد تكرار التنفيذ بسبب rerenders
    if (didRunRef.current) return;
    didRunRef.current = true;

    const key = `viewed_video_${videoId}`;

    // لو انحسبت قبل في نفس التبويب، لا تعيد الحساب
    const alreadyViewed = sessionStorage.getItem(key);
    if (alreadyViewed) return;

    // خزّن مباشرة لتفادي التكرار (حتى لو React شغّل effect مرتين في dev)
    sessionStorage.setItem(key, '1');

    const incrementView = async () => {
      const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });

      if (error) {
        console.error('Error incrementing video views:', error);
        // لو فشل، احذف العلامة عشان يسمح بمحاولة ثانية لاحقًا
        sessionStorage.removeItem(key);
        return;
      }

      onViewIncrement?.();
    };

    incrementView();
  }, [videoId]); // لاحظ: ما حطّينا onViewIncrement هنا لتجنب إعادة التشغيل بسبب تغيّر المرجع

  return null;
}
