'use client';

import type { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User } from 'lucide-react';

interface CommentSectionProps {
  comments: Comment[];
}

export function CommentSection({ comments }: CommentSectionProps) {
  return (
    <div>
      <h2 className="font-headline text-xl font-semibold">
        {comments.length} Comments
      </h2>
      <form className="my-4 flex items-center gap-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://placehold.co/48x48.png" alt="Your avatar" data-ai-hint="person avatar" />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <Input placeholder="Add a comment..." className="flex-1" />
        <Button type="submit">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="mt-6 space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.avatarUrl} alt={comment.user} data-ai-hint="person avatar"/>
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