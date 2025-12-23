'use client';

import { useEffect, useState } from 'react';
import type { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CommentSectionProps {
  videoId: string;
  comments: Comment[];
}

export function CommentSection({ videoId, comments }: CommentSectionProps) {
  const [items, setItems] = useState<Comment[]>(comments);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(comments);
  }, [comments]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !videoId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      const newComment: Comment = {
        id: crypto.randomUUID(),
        user:
          user?.user_metadata?.name ??
          user?.user_metadata?.full_name ??
          user?.email ??
          'Anonymous',
        avatarUrl:
          user?.user_metadata?.avatar_url ??
          user?.user_metadata?.picture ??
          '',
        text,
        user_id: user?.id ?? '',
      };

      const updatedComments = [...items, newComment];
      const { error: updateError } = await supabase
        .from('videos')
        .update({ comments: updatedComments })
        .eq('id', videoId);

      if (updateError) {
        throw updateError;
      }

      setItems(updatedComments);
      setMessage('');
    } catch (submitError) {
      console.error('Failed to submit comment:', submitError);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-headline text-xl font-semibold">
        {items.length} Comments
      </h2>
      <form className="my-4 flex items-center gap-2" onSubmit={handleSubmit}>
        <Avatar className="h-10 w-10">
          <AvatarImage
            src="https://placehold.co/48x48.png"
            alt="Your avatar"
            data-ai-hint="person avatar"
          />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <Input
          placeholder="Add a comment..."
          className="flex-1"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button type="submit" disabled={isSubmitting || !message.trim()}>
          {isSubmitting ? 'Sending...' : <Send className="h-4 w-4" />}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="mt-6 space-y-6">
        {items.map((comment) => (
          <div key={comment.id} className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={comment.avatarUrl}
                alt={comment.user}
                data-ai-hint="person avatar"
              />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{comment.user}</p>
              <p className="text-muted-foreground">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
