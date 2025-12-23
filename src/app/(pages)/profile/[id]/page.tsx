
import { VideoCard } from '@/components/video-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getVideosByContributor, getContributorById } from '@/lib/db/server';
import { notFound } from 'next/navigation';
import { User } from 'lucide-react';
import { VideoChat } from '@/components/video-chat';
import { Separator } from '@/components/ui/separator';
interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  try {
    const { id } = await params;
    const contributor = await getContributorById(id);
    
    if (!contributor) {
      notFound();
    }

    const contributorVideos = await getVideosByContributor(contributor.id);

    return (
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Avatar className="h-24 w-24 border-4 border-primary">
                {contributor.avatarUrl && <AvatarImage src={contributor.avatarUrl} alt={contributor.name} data-ai-hint="person avatar" />}
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold font-headline">{contributor.name}</h1>
                <p className="mt-2 max-w-xl text-muted-foreground">{contributor.bio}</p>
              </div>
            </div>

            <h2 className="mb-6 border-b pb-2 text-xl font-semibold font-headline">
              {contributor.name}'s Skills
            </h2>
            
            {contributorVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {contributorVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">This contributor hasn't uploaded any videos yet.</p>
            )}

            {contributorVideos.length > 0 && (
              <>
                <Separator className="my-12" />
                <VideoChat video={contributorVideos[0]} />
              </>
            )}

          </div>
        </main>
    );
  } catch (error) {
    console.error("Failed to fetch profile page data:", error);
    notFound();
  }
}
