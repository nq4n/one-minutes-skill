'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useMemo,
} from 'react';
import type { Video } from '@/types';

interface SavedVideosContextType {
  savedVideos: Video[];
  isSaved: (videoId: string) => boolean;
  toggleSaveVideo: (video: Video) => void;
  isLoading: boolean;
}

const SavedVideosContext = createContext<SavedVideosContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'oneMinuteSkill.savedVideos';

export function SavedVideosProvider({ children }: { children: ReactNode }) {
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        setSavedVideos(JSON.parse(item));
      }
    } catch (error) {
      console.error('Failed to load saved videos from localStorage', error);
      setSavedVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistVideos = (videos: Video[]) => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(videos));
    } catch (error) {
      console.error('Failed to save videos to localStorage', error);
    }
  };

  const toggleSaveVideo = useCallback(
    (video: Video) => {
      setSavedVideos((prevSaved) => {
        const isCurrentlySaved = prevSaved.some((v) => v.id === video.id);
        let newSaved;
        if (isCurrentlySaved) {
          newSaved = prevSaved.filter((v) => v.id !== video.id);
        } else {
          newSaved = [...prevSaved, video];
        }
        persistVideos(newSaved);
        return newSaved;
      });
    },
    []
  );

  const isSaved = useCallback(
    (videoId: string) => {
      return savedVideos.some((v) => v.id === videoId);
    },
    [savedVideos]
  );

  const value = useMemo(
    () => ({
      savedVideos,
      isSaved,
      toggleSaveVideo,
      isLoading,
    }),
    [savedVideos, isSaved, toggleSaveVideo, isLoading]
  );

  return React.createElement(SavedVideosContext.Provider, { value }, children);
}

export function useSavedVideos() {
  const context = useContext(SavedVideosContext);
  if (context === undefined) {
    throw new Error('useSavedVideos must be used within a SavedVideosProvider');
  }
  return context;
}
