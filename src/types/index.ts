
import { type LucideIcon } from 'lucide-react';

export interface Comment {
  id: string;
  user: string;
  avatarUrl: string;
  text: string;
  user_id: string; // The user who made the comment
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  thumbnailUrl: string;
  video_url: string;
  videoUrl: string;
  contributor_id: string;
  category_id: string;
  views: number;
  likes: number;
  comments: Comment[]; // Embedded comments
  'data-ai-hint'?: string;
}

export interface Contributor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string;
  avatarUrl: string;
  bio: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
