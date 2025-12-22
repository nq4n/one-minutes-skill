'use client';

import { useMemo, useState } from 'react';
import type { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { getTranscript } from '@/app/actions';

interface VideoTranscriptProps {
  video: Video;
}

export function VideoTranscript({ video }: VideoTranscriptProps) {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const transcriptFileName = useMemo(() => {
    const safeTitle = video.title?.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    return `${safeTitle || 'video'}-transcript.txt`;
  }, [video.title]);

  const handleGenerateTranscript = async () => {
    setIsLoading(true);
    setError(null);
    setTranscript('');
    setStatus('Preparing video for transcription...');

    try {
      if (!video.videoUrl) {
        throw new Error('Video source is not available for transcription.');
      }

      setStatus('Downloading video audio...');
      const response = await fetch(video.videoUrl);

      if (!response.ok) {
        throw new Error('Failed to download the video.');
      }

      const blob = await response.blob();
      const file = new File([blob], `${video.title || 'video'}.mp4`, {
        type: blob.type || 'video/mp4',
      });
      const formData = new FormData();
      formData.append('file', file);

      setStatus('Transcribing audio...');
      const transcription = await getTranscript(formData);
      setTranscript(transcription);
      setStatus(null);
    } catch (e) {
      console.error(e);
      setError('Failed to extract the transcript. Please try again.');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = transcriptFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-[500px] w-full">
      <CardContent className="p-4 h-full flex flex-col">
        {transcript ? (
          <>
            <ScrollArea className="flex-1 pr-4">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {transcript}
              </p>
            </ScrollArea>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleDownloadTranscript}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Transcript
            </Button>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-headline text-lg font-semibold">
              Generate Video Transcript
            </h3>
            <p className="mb-4 text-muted-foreground">
              Extract a transcript directly from the video audio.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={handleGenerateTranscript} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Extract Transcript
                  </>
                )}
              </Button>
            </div>
            {status && !error && (
              <p className="mt-3 text-sm text-muted-foreground">{status}</p>
            )}
            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
