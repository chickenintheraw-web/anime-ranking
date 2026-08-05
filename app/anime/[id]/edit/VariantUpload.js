'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../admin-form.module.css';

const QUALITIES = ['1080p', '720p', '480p', '576p'];
const SOURCES = ['BD', 'NCBD', 'WEB', 'NCWEB', 'DVD', 'NCDVD'];

// fetch() has no upload-progress event; XHR does.
function putWithProgress(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        json: async () => JSON.parse(xhr.responseText || '{}'),
      });
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(blob);
  });
}

export default function VariantUpload({ themeId, animeId }) {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState('720p');
  const [source, setSource] = useState('WEB');
  const [phase, setPhase] = useState('idle'); // idle | encoding | uploading | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const router = useRouter();

  const busy = phase === 'encoding' || phase === 'uploading';

  async function handleUpload() {
    if (!file) return;
    setError(null);

    try {
      setPhase('encoding');
      setProgress(0);
      const { compressVideo } = await import('@/lib/videoCompress');
      const blob = await compressVideo(file, quality, setProgress);

      setPhase('uploading');
      setProgress(0);
      const params = new URLSearchParams({
        theme_id: themeId,
        anime_id: animeId,
        quality,
        source,
      });
      const res = await putWithProgress(
        `/api/admin/theme-variants?${params.toString()}`,
        blob,
        setProgress
      );
      if (res.status === 403) throw new Error('Session expired or not an admin - sign in again.');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Upload failed (${res.status})`);

      setFile(null);
      setPhase('idle');
      router.refresh();
    } catch (e) {
      setPhase('error');
      setError(e.message || 'Something went wrong');
    }
  }

  return (
    <div className={styles.addYoutubeForm}>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={busy}
      />
      <select
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
        className={styles.themeSelect}
        disabled={busy}
      >
        {QUALITIES.map((q) => (
          <option key={q} value={q}>
            {q}
          </option>
        ))}
      </select>
      <select
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className={styles.themeSelect}
        disabled={busy}
      >
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || busy}
        className={styles.addYoutubeButton}
      >
        {phase === 'encoding' && `Compressing… ${Math.round(progress * 100)}%`}
        {phase === 'uploading' && `Uploading… ${Math.round(progress * 100)}%`}
        {phase === 'idle' && 'Compress & Upload'}
        {phase === 'error' && 'Retry'}
      </button>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
