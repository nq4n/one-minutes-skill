
import { getVideoById } from '@/lib/db/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface VideoPageProps {
    params: {
        id: string;
    };
}

export default async function VideoPage({ params }: VideoPageProps) {
    const cookieStore = await cookies();
    const video = await getVideoById(cookieStore, params.id);

    if (!video) {
        notFound();
    }

    return (
        <main className="flex-1 py-8">
            <div className="container">
                <h1 className="text-2xl font-bold font-headline">{video.title}</h1>
            </div>
        </main>
    );
}
