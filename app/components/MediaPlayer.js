'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// The IFrame API script must load exactly once globally, no matter how
// many MediaPlayer instances mount (main player + comparison-modal tiles).
let ytApiPromise = null;
function loadYoutubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

// Unifies a native <video> and a YouTube IFrame Player behind one
// imperative ref API (play/pause/setMuted) so callers don't need
// provider-specific branching. YouTube always starts muted regardless of
// the `muted` prop - browsers only allow autoplay-with-sound after a
// genuine user gesture, and an unmuted embed just silently fails to
// autoplay at all otherwise. If the caller wants sound (`muted={false}`),
// we make a best-effort unMute() once the player reports ready.
const MediaPlayer = forwardRef(function MediaPlayer(
  {
    provider = 'r2',
    url,
    youtubeId,
    className,
    autoPlay = false,
    loop = false,
    muted = false,
    controls = false,
    onEnded,
    onPlay,
    onPause,
  },
  ref
) {
  const videoElRef = useRef(null);
  const containerRef = useRef(null);
  const ytPlayerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play() {
      if (provider === 'youtube') ytPlayerRef.current?.playVideo?.();
      else videoElRef.current?.play().catch(() => {});
    },
    pause() {
      if (provider === 'youtube') ytPlayerRef.current?.pauseVideo?.();
      else videoElRef.current?.pause();
    },
    setMuted(next) {
      if (provider === 'youtube') {
        if (next) ytPlayerRef.current?.mute?.();
        else ytPlayerRef.current?.unMute?.();
      } else if (videoElRef.current) {
        videoElRef.current.muted = next;
      }
    },
  }));

  useEffect(() => {
    if (provider !== 'youtube' || !youtubeId || !containerRef.current) return;

    let cancelled = false;
    let player = null;

    loadYoutubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      player = new YT.Player(containerRef.current, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          mute: 1,
          // Always on, not tied to the `controls` prop: the same embed
          // instance persists across the mini-bar <-> theater transition
          // (never remounted), but YouTube's own controls playerVar is
          // fixed at creation time and can't be toggled afterward - so
          // unlike the native <video> branch, there's no way to start
          // uncontrolled and turn controls on only in theater mode.
          controls: 1,
          loop: loop ? 1 : 0,
          playlist: loop ? youtubeId : undefined,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            ytPlayerRef.current = player;
            if (!muted) player.unMute();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) onPlay?.();
            else if (e.data === YT.PlayerState.PAUSED) onPause?.();
            else if (e.data === YT.PlayerState.ENDED) onEnded?.();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy?.();
      ytPlayerRef.current = null;
    };
    // Re-creating the embed on every prop change would restart playback;
    // only the video identity itself should tear down and rebuild it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, youtubeId]);

  if (provider === 'youtube') {
    return (
      <div className={className} style={{ position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  return (
    <video
      ref={videoElRef}
      src={url}
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline
      onEnded={onEnded}
      onPlay={onPlay}
      onPause={onPause}
    />
  );
});

export default MediaPlayer;
