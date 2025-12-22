'use client';

import { useState } from 'react';
import type { Video } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { getAnswer } from '@/app/actions';

interface VideoChatProps {
  video: Video;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function VideoChat({ video }: VideoChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the assistant's response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const stream = await getAnswer(video.title, video.description, input);

      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk.choices[0].delta.content) {
          fullResponse += chunk.choices[0].delta.content;
          setMessages((prev) =>
            prev.map((msg, i) =>
              i === prev.length - 1
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I couldn't get a response. Please try again.",
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[500px] w-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <AvatarIcon>
                    {message.content ? <Bot className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  </AvatarIcon>
                )}
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <AvatarIcon>
                    <User className="h-5 w-5" />
                  </AvatarIcon>
                )}
              </div>
            ))}
             {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-3">
                <AvatarIcon>
                  <Bot className="h-5 w-5" />
                </AvatarIcon>
                <div className="max-w-xs rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the video..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AvatarIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
      {children}
    </div>
  );
}