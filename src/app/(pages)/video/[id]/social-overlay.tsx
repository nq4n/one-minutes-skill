// src/app/(pages)/video/[id]/social-overlay.tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Heart,
  Bookmark,
  Download,
  MessageCircle,
  FileText,
  Bot,
  ArrowLeft,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VideoChat } from '@/components/video-chat'
import { CommentSection } from '@/components/comment-section'
import { VideoTranscript } from '@/components/video-transcript'
import { supabase } from '@/lib/supabase/client' // Import Supabase client
import { toggleBookmark } from '@/app/actions'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

type Section = 'chat' | 'comments' | 'transcript' | null

export default function SocialOverlay({
  video,
  comments,
  creator,
  isBookmarked: initialIsBookmarked,
}: {
  video: any
  comments: any[]
  creator: any
  isBookmarked: boolean
}) {
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const isAuthenticated = Boolean(user)
  const isBookmarkDisabled = isLoading || isPending
  const [open, setOpen] = useState<Section>(null)
  const [visible, setVisible] = useState(true)
  const [likesCount, setLikesCount] = useState(video.likes) // State for likes
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isPending, startTransition] = useTransition()
  const transcriptVideo = {
    ...video,
    transcript: typeof video.transcript === 'string' ? video.transcript : '',
  }

  const handleDownload = async () => {
    if (!video.videoUrl) return

    try {
      const response = await fetch(video.videoUrl)
      if (!response.ok) {
        throw new Error('Failed to download video.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${video.title || 'video'}.mp4`
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading video:', error)
    }
  }

  // AUTO HIDE CONTROLS WITH FADE
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(t)
  }, [open])

  const handleLike = async () => {
    const { error } = await supabase.rpc('increment_video_likes', {
      video_id: video.id,
    })
    if (!error) {
      setLikesCount(prev => prev + 1)
    } else {
      console.error('Error incrementing likes:', error)
    }
  }

  const handleBookmark = () => {
    if (isLoading) {
      return
    }

    if (!isAuthenticated) {
      toast({
        description: 'Login required to bookmark.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await toggleBookmark(video.id)
        if (result?.error) {
          if (result.error === 'LOGIN_REQUIRED') {
            toast({
              description: 'Login required to bookmark.',
              variant: 'destructive',
            })
          } else {
            toast({
              description: 'Something went wrong.',
              variant: 'destructive',
            })
          }
          setIsBookmarked(false)
          return
        }
        setIsBookmarked(Boolean(result?.isBookmarked))
      } catch (error) {
        console.error('Error toggling bookmark:', error)
        toast({
          description: 'Unable to update bookmark.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      {/* INTERACTION LAYER (SHOW CONTROLS ON MOVE) */}
      <div
        onMouseMove={() => setVisible(true)}
        onClick={() => setVisible(true)}
        className="absolute inset-0 z-20"
      />

      <div className="absolute left-4 top-4 z-40">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:scale-105"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="absolute left-4 top-16 right-20 z-40 text-white">
        <h1 className="text-lg font-semibold leading-tight sm:text-xl">
          {video.title}
        </h1>
        {video.description && (
          <p className="mt-1 text-xs text-white/80 sm:text-sm">
            {video.description}
          </p>
        )}
      </div>

      {/* RIGHT ICON STACK (ANIMATED) */}
      <div
        className={`absolute right-4 bottom-28 z-40 flex flex-col items-center gap-4
        transition-all duration-300 ease-out
        ${
          visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }
        `}
      >
        {/* PROFILE */}
        {creator?.id ? (
          <Link href={`/profile/${creator.id}`} aria-label="View profile">
            <Avatar className="h-12 w-12 border-2 border-white">
              {creator?.avatarUrl && (
                <AvatarImage src={creator.avatarUrl} alt={creator.name} />
              )}
              <AvatarFallback>{creator?.name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-12 w-12 border-2 border-white">
            {creator?.avatarUrl && (
              <AvatarImage src={creator.avatarUrl} alt={creator.name} />
            )}
            <AvatarFallback>{creator?.name?.[0] ?? 'U'}</AvatarFallback>
          </Avatar>
        )}

        {/* LIKE */}
        <Icon onClick={handleLike}>
          <div className="flex flex-col items-center">
            <Heart />
            <span className="text-xs">{likesCount}</span>
          </div>
        </Icon>

        {/* SAVE */}
        <Icon
          onClick={handleBookmark}
          active={isBookmarked}
          disabled={!isAuthenticated || isBookmarkDisabled}
          title={
            isLoading
              ? 'Checking login status'
              : !isAuthenticated
              ? 'Login required to bookmark'
              : isBookmarked
              ? 'Remove bookmark'
              : 'Save bookmark'
          }
        >
          <Bookmark className={isBookmarked ? 'fill-current' : undefined} />
        </Icon>

        {/* DOWNLOAD */}
        <Icon onClick={handleDownload}>
          <Download />
        </Icon>

        {/* VIEWS */}
        <div className="flex flex-col items-center text-white text-xs">
          <span>{video.views}</span>
          <span>Views</span>
        </div>

        {/* AI CHAT */}
        <Icon
          active={open === 'chat'}
          onClick={() => setOpen(open === 'chat' ? null : 'chat')}
        >
          <Bot />
        </Icon>

        {/* COMMENTS */}
        <Icon
          active={open === 'comments'}
          onClick={() => setOpen(open === 'comments' ? null : 'comments')}
        >
          <MessageCircle />
        </Icon>

        {/* TRANSCRIPT */}
        <Icon
          active={open === 'transcript'}
          onClick={() => setOpen(open === 'transcript' ? null : 'transcript')}
        >
          <FileText />
        </Icon>
      </div>

      {/* BOTTOM SHEET (SLIDE UP / DOWN) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 rounded-t-2xl bg-background border-t shadow-2xl
        transition-transform duration-300 ease-out
        ${open ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '45%' }}
      >
        <div className="h-full max-h-full overflow-y-auto p-4">
          {open === 'chat' && <VideoChat video={video} />}
          {open === 'comments' && (
            <CommentSection videoId={video.id} comments={comments} />
          )}
          {open === 'transcript' && <VideoTranscript video={transcriptVideo} />}
        </div>
      </div>
    </>
  )
}

function Icon({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      className={`h-12 w-12 rounded-full flex items-center justify-center
      backdrop-blur transition-all duration-200
      ${
        active
          ? 'bg-white text-black scale-105'
          : 'bg-black/60 text-white hover:scale-105'
      }
      ${disabled ? 'cursor-not-allowed opacity-60 hover:scale-100' : ''}
      `}
    >
      {children}
    </button>
  )
}
