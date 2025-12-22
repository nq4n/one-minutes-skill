'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import type { Video } from '@/types';
import { getAnswer } from '@/app/actions';

interface VideoQuestionAnswerProps {
  videos: Video[];
}

export function VideoQuestionAnswer({ videos }: VideoQuestionAnswerProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    videos[0]?.id || ''
  );
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId || !question) {
      setError('Please select a video and ask a question.');
      return;
    }

    const selectedVideo = videos.find((v) => v.id === selectedVideoId);
    if (!selectedVideo) {
      setError('Selected video not found.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer('');
    let fullAnswer = '';

    try {
      const stream = await getAnswer(
        selectedVideo.title,
        selectedVideo.description,
        question
      );
      for await (const chunk of stream) {
        if(chunk.choices[0].delta.content) {
          fullAnswer += chunk.choices[0].delta.content;
          setAnswer(fullAnswer);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Sorry, I couldn't answer that question right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline">Ask AI About a Skill</CardTitle>
        <CardDescription>
          Select one of the videos and ask a question to learn more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select onValueChange={setSelectedVideoId} value={selectedVideoId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a video..." />
            </SelectTrigger>
            <SelectContent>
              {videos.map((video) => (
                <SelectItem key={video.id} value={video.id}>
                  {video.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="e.g., What's the first step?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <Button
            type="submit"
            disabled={isLoading || !question || !selectedVideoId}
          >
            {isLoading ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Sparkles className="mr-2" />
            )}
            Ask Question
          </Button>
        </form>

        {(isLoading || answer) && (
          <div className="mt-6 rounded-lg border bg-muted/30 p-6">
            <h4 className="font-bold font-headline">Answer:</h4>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {answer}
              {isLoading && !answer && (
                <Loader2 className="mr-4 animate-spin text-primary" />
              )}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-6 text-center text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}