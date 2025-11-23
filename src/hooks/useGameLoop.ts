import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: (deltaTime: number) => void, isActive: boolean) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const savedCallback = useRef<(deltaTime: number) => void>(callback);

  // Update the saved callback whenever it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    // Reset previous time when restarting the loop
    previousTimeRef.current = undefined;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        // Use the ref to access the latest callback without triggering a restart
        savedCallback.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive]); // Only restart the loop if isActive changes
};
