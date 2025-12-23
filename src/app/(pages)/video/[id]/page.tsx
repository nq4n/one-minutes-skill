// src/app/(pages)/video/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getVideoById, getContributorById } from '@/lib/db/server'
import { VideoPlayer } from '@/components/video-player'
import VideoInteractionWrapper from './video-interaction-wrapper'
export default async function VideoPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const video = await getVideoById(id)
  if (!video) notFound()

  const creator = await getContributorById(video.contributor_id)

  return (
    <main className="flex-1 py-6">
      <div className="container max-w-5xl">
        <div className="relative rounded-2xl overflow-hidden bg-black border shadow-md">
          <VideoPlayer video={video} />
          <VideoInteractionWrapper
            video={video}
            comments={video.comments}
            creator={creator}
          />
        </div>
        <div className="mt-4">
          <h1 className="text-xl font-bold">{video.title}</h1>
          {video.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
