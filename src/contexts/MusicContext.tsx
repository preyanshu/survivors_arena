import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface MusicContextType {
  isMusicEnabled: boolean;
  toggleMusic: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const MUSIC_STORAGE_KEY = 'game_music_enabled';

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  // Load persisted state
  const loadPersistedState = (): boolean => {
    if (typeof window === 'undefined') return true; // Default to enabled
    try {
      const stored = localStorage.getItem(MUSIC_STORAGE_KEY);
      return stored === null ? true : stored === 'true'; // Default to enabled if not set
    } catch {
      return true;
    }
  };

  const [isMusicEnabled, setIsMusicEnabled] = useState(loadPersistedState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio('/assets/SLOWER-TEMPO2019-12-11_-_Retro_Platforming_-_David_Fesliyan.mp3');
    audio.loop = true;
    audio.volume = 0.5; // Set volume to 50%
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle music play/pause based on state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isMusicEnabled) {
      // Try to play, but handle autoplay restrictions
      audioRef.current.play().catch((error) => {
        console.log('Audio autoplay prevented:', error);
        // User interaction will be required to start playback
      });
    } else {
      audioRef.current.pause();
    }
  }, [isMusicEnabled]);

  const toggleMusic = () => {
    const newState = !isMusicEnabled;
    setIsMusicEnabled(newState);
    localStorage.setItem(MUSIC_STORAGE_KEY, String(newState));
    
    // If enabling, try to play (user interaction required for autoplay)
    if (newState && audioRef.current) {
      // Reset to beginning if it was paused
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log('Audio play failed:', error);
      });
    } else if (!newState && audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <MusicContext.Provider value={{ isMusicEnabled, toggleMusic }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

