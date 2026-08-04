'use client';

import { createContext, useContext, useMemo, useState } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  function play(track) {
    setQueue([track]);
    setIndex(0);
    setIsPlaying(true);
  }

  function enqueue(track) {
    setQueue((q) => [...q, track]);
  }

  function next() {
    setIndex((i) => (i + 1 < queue.length ? i + 1 : i));
    setIsPlaying(true);
  }

  function prev() {
    setIndex((i) => (i > 0 ? i - 1 : i));
    setIsPlaying(true);
  }

  function close() {
    setQueue([]);
    setIndex(-1);
    setIsPlaying(false);
  }

  const value = useMemo(
    () => ({
      queue,
      index,
      current: index >= 0 ? queue[index] : null,
      isPlaying,
      setIsPlaying,
      play,
      enqueue,
      next,
      prev,
      close,
    }),
    [queue, index, isPlaying]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
