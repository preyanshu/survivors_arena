import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface MusicContextType {
  isMusicEnabled: boolean;
  toggleMusic: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  // Music is off by default, no persistence
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasUserInteractedRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio('/assets/SLOWER-TEMPO2019-12-11_-_Retro_Platforming_-_David_Fesliyan.mp3');
    audio.loop = true;
    audio.volume = 0.5; // Set volume to 50%
    audioRef.current = audio;

    // Handle user interaction to start music if enabled
    const handleUserInteraction = () => {
      if (!hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true;
        // If music is enabled, start it now (user has interacted)
        if (isMusicEnabled && audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.log('Audio play failed on user interaction:', error);
          });
        }
      }
    };

    // Listen for any user interaction (only once)
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isMusicEnabled]);

  // Handle music play/pause based on state (only after user interaction)
  useEffect(() => {
    if (!audioRef.current) return;

    if (isMusicEnabled && hasUserInteractedRef.current) {
      // Only try to play if user has already interacted
      audioRef.current.play().catch((error) => {
        console.log('Audio play failed:', error);
      });
    } else if (!isMusicEnabled) {
      audioRef.current.pause();
    }
  }, [isMusicEnabled]);

  const toggleMusic = () => {
    const newState = !isMusicEnabled;
    setIsMusicEnabled(newState);
    
    // Mark that user has interacted (clicking the button counts)
    hasUserInteractedRef.current = true;
    
    // If enabling, try to play (button click is user interaction, so this should work)
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

