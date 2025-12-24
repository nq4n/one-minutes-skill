// src/app/(pages)/video/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getVideoById, getContributorById } from '@/lib/db/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/video-player'
import VideoInteractionWrapper from './video-interaction-wrapper'
export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const video = await getVideoById(id)
  if (!video) notFound()

  const creator = await getContributorById(video.contributor_id)
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: bookmark } = user
    ? await supabase
        .from('video_bookmarks')
        .select('id')
        .eq('video_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  return (
    <main className="flex-1 py-6">
      <div className="container max-w-5xl">
        <div className="relative rounded-2xl overflow-hidden bg-black border shadow-md">
          <VideoPlayer video={video} />
          <VideoInteractionWrapper
            video={video}
            comments={video.comments}
            creator={creator}
            isBookmarked={Boolean(bookmark)}
          />
        </div>
      </div>
    </main>
  )
}
