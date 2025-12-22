'use client';

import { useState } from 'react';
import type { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { getTranscript } from '@/app/actions';

interface VideoTranscriptProps {
  video: Video;
}

export function VideoTranscript({ video }: VideoTranscriptProps) {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTranscript = async () => {
    setIsLoading(true);
    setError(null);
    setTranscript('');
    let fullTranscript = '';

    try {
      const stream = await getTranscript(video.title, video.videoUrl);
      for await (const chunk of stream) {
        if(chunk.choices[0].delta.content) {
          fullTranscript += chunk.choices[0].delta.content;
          setTranscript(fullTranscript);
        }
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate transcript. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[500px] w-full">
      <CardContent className="p-4 h-full flex flex-col">
        {transcript ? (
          <ScrollArea className="flex-1 pr-4">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {transcript}
            </p>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-headline text-lg font-semibold">
              Generate Video Transcript
            </h3>
            <p className="mb-4 text-muted-foreground">
              Click the button to get a text version of the video's audio.
            </p>
            <Button onClick={handleGenerateTranscript} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Transcript'
              )}
            </Button>
            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}