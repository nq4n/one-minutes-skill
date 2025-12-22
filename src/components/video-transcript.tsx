'use client';

import { useMemo, useRef, useState } from 'react';
import type { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Loader2, Mic } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface VideoTranscriptProps {
  video: Video;
}

export function VideoTranscript({ video }: VideoTranscriptProps) {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const transcriptFileName = useMemo(() => {
    const safeTitle = video.title?.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    return `${safeTitle || 'video'}-transcript.txt`;
  }, [video.title]);

  const handleGenerateTranscript = async () => {
    setIsLoading(true);
    setError(null);
    setTranscript('');
    setStatus('Listening for speech locally...');

    try {
      if (typeof window === 'undefined') {
        throw new Error('Speech recognition is only available in the browser.');
      }

      const SpeechRecognition =
        window.SpeechRecognition ||
        (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition })
          .webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser.');
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0]?.transcript ?? '';
          } else {
            interimTranscript += result[0]?.transcript ?? '';
          }
        }

        setTranscript((prev) => {
          const base = prev.replace(/\s+/g, ' ').trim();
          const next = `${base} ${finalTranscript}`.trim();
          return interimTranscript ? `${next} ${interimTranscript}`.trim() : next;
        });
      };

      recognition.onerror = () => {
        setError('Speech recognition failed. Please try again.');
        setStatus(null);
        setIsLoading(false);
      };

      recognition.onend = () => {
        setStatus(null);
        setIsLoading(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setError('Failed to generate transcript. Please try again.');
      setStatus(null);
      setIsLoading(false);
    }
  };

  const handleStopTranscript = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus(null);
    setIsLoading(false);
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
              Use your device's speech recognition to generate a transcript
              locally.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={handleGenerateTranscript} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Transcript
                  </>
                )}
              </Button>
              {isLoading && (
                <Button variant="outline" onClick={handleStopTranscript}>
                  Stop
                </Button>
              )}
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
