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

  const extractAudioFromVideo = async (videoUrl: string) => {
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.crossOrigin = 'anonymous';
    videoElement.preload = 'auto';
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.style.position = 'fixed';
    videoElement.style.left = '-9999px';
    document.body.appendChild(videoElement);

    const stream = await new Promise<MediaStream>((resolve, reject) => {
      const handleError = () => reject(new Error('Unable to load video.'));
      videoElement.addEventListener('error', handleError, { once: true });
      videoElement.addEventListener(
        'loadedmetadata',
        () => {
          const capture =
            (videoElement as HTMLVideoElement & {
              captureStream?: () => MediaStream;
              mozCaptureStream?: () => MediaStream;
            }).captureStream?.() ||
            (videoElement as HTMLVideoElement & {
              mozCaptureStream?: () => MediaStream;
            }).mozCaptureStream?.();

          if (!capture) {
            reject(new Error('Audio capture is not supported in this browser.'));
            return;
          }

          resolve(capture);
        },
        { once: true }
      );
    });

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio track found in this video.');
    }

    const audioStream = new MediaStream(audioTracks);
    const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
    const chunks: Blob[] = [];

    const audioBlob = await new Promise<Blob>((resolve, reject) => {
      const cleanup = () => {
        videoElement.pause();
        videoElement.remove();
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanup();
        reject(new Error('Failed to record audio.'));
      };

      recorder.onstop = () => {
        cleanup();
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };

      videoElement.onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start();
      videoElement
        .play()
        .catch(() => {
          cleanup();
          reject(new Error('Unable to play video for capture.'));
        });
    });

    return new File([audioBlob], `${video.id}-audio.webm`, {
      type: audioBlob.type || 'audio/webm',
    });
  };

  const handleGenerateTranscript = async () => {
    setIsLoading(true);
    setError(null);
    setTranscript('');
    setStatus('Extracting audio from the video...');

    try {
      if (!video.videoUrl) {
        throw new Error('Video URL not available.');
      }

      const audioFile = await extractAudioFromVideo(video.videoUrl);
      setStatus('Transcribing audio with AI...');

      const formData = new FormData();
      formData.append('file', audioFile);
      const result = await getTranscript(formData);
      setTranscript(result || '');
      setStatus(null);
    } catch (e) {
      console.error(e);
      setError('Failed to generate transcript. Please try again.');
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
