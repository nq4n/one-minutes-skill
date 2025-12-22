// src/app/(pages)/video/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getVideoById, getContributorById } from '@/lib/db/server'
import { VideoPlayer } from '@/components/video-player'
import SocialOverlay from './social-overlay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommentSection } from '@/components/comment-section'
import { VideoQuestionAnswer } from '@/components/video-q-and-a'
import { VideoTranscript } from '@/components/video-transcript'
import { ViewTracker } from '@/components/view-tracker'
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

          <Tabs defaultValue="comments" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="qna">Q&A</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>
            <TabsContent value="comments">
              <CommentSection comments={video.comments || []} />
            </TabsContent>
            <TabsContent value="qna">
              <VideoQuestionAnswer videos={[video]} />
            </TabsContent>
            <TabsContent value="transcript">
              <VideoTranscript video={video} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
