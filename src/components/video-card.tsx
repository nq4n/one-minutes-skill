'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, MessageCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSavedVideos } from '@/hooks/use-saved-videos';
import type { Video, Contributor } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { getContributorById } from '@/lib/db/client';
import { useEffect, useState } from 'react';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const { isSaved, toggleSaveVideo, isLoading } = useSavedVideos();
  const [contributor, setContributor] = useState<Contributor | null>(null);

  // Avatar fallback handling
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (video.contributor_id) {
      getContributorById(video.contributor_id).then(setContributor);
    } else {
      setContributor(null);
    }
  }, [video.contributor_id]);

  // Reset avatar error when contributor or avatar url changes
  useEffect(() => {
    setAvatarError(false);
  }, [contributor?.id, contributor?.avatarUrl, contributor?.avatar_url]);

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveVideo(video);
  };

  if (isLoading || !video.id) {
    return (
      <div className="w-full overflow-hidden rounded-xl">
        <Skeleton className="h-full min-h-[550px] w-full" />
      </div>
    );
  }

  const saved = isSaved(video.id);

  const formatCount = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Safe avatar src
  const avatarSrcRaw = (contributor?.avatarUrl || contributor?.avatar_url || '').trim();
  const avatarSrc =
    avatarSrcRaw && avatarSrcRaw !== 'null' && avatarSrcRaw !== 'undefined'
      ? avatarSrcRaw
      : '';

  const contributorName = contributor?.name || 'Creator';

  // Reusable avatar renderer (image or placeholder)
  const ContributorAvatar = ({ hoverable }: { hoverable?: boolean }) => {
    const borderHover = hoverable
      ? 'transition-colors group-hover/contributor:border-accent'
      : '';

    if (!avatarSrc || avatarError) {
      return (
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-transparent bg-white/15 text-white',
            borderHover
          )}
          aria-label={contributorName}
          title={contributorName}
        >
          <User className="h-4 w-4" />
        </span>
      );
    }

    return (
      <Image
        src={avatarSrc}
        alt={contributorName}
        width={24}
        height={24}
        className={cn('rounded-full border-2 border-transparent', borderHover)}
        data-ai-hint="person avatar"
        onError={() => setAvatarError(true)}
      />
    );
  };

  return (
    <Card className="group relative w-full overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-2xl">
      <CardContent className="relative flex h-full min-h-[550px] flex-col p-0">
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-3 top-3 z-30 h-10 w-10 rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground"
          onClick={handleSaveClick}
          aria-label={saved ? 'Unsave video' : 'Save video'}
        >
          <Heart className={cn('h-5 w-5', saved && 'fill-accent text-accent')} />
        </Button>

        <Link href={`/video/${video.id}`} className="block h-full w-full">
          <Image
            src={video.thumbnailUrl ? video.thumbnailUrl : '/replace.png'}
            alt={video.title}
            width={400}
            height={700}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            data-ai-hint={video['data-ai-hint']}
          />
        </Link>

        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 z-20 w-full p-4 text-white">
          <Link href={`/video/${video.id}`} className="block">
            <h3 className="font-headline text-lg font-bold">{video.title}</h3>
          </Link>

          <div className="mt-2 flex items-center justify-between gap-2">
            {contributor?.id ? (
              <Link
                href={`/profile/${contributor.id}`}
                className="group/contributor relative z-30 flex-shrink-0"
              >
                <div className="flex items-center gap-2">
                  <ContributorAvatar hoverable />
                  <p className="text-sm font-medium transition-colors group-hover/contributor:text-accent">
                    {contributorName}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ContributorAvatar />
                <span>{contributorName}</span>
              </div>
            )}

            <div className="flex flex-shrink-0 items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{formatCount(video.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{formatCount(video.likes ?? 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{formatCount(video.comments?.length || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
