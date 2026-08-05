// Client-only: compresses a video file in the browser before upload, so
// admin-added videos stay small without needing a native ffmpeg install.
// Uses ffmpeg.wasm's single-threaded core specifically - the multi
// -threaded core needs SharedArrayBuffer, which needs a
// Cross-Origin-Embedder-Policy header that would break the YouTube iframe
// embeds MediaPlayer.js already relies on elsewhere on this site.
//
// Encodes to H.264/AAC in MP4, not VP9/WebM (the format the existing
// hand-uploaded R2 files use): libvpx-vp9 in this ffmpeg-core build
// reproducibly crashed the whole browser tab mid-encode (verified via
// Playwright, before a single frame completed), while libx264 completed
// cleanly every time. H.264 is at least as broadly supported for
// <video> playback and still compresses far below a raw source file.
let ffmpegPromise = null;

async function getFFmpeg() {
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ffmpeg;
  })();

  return ffmpegPromise;
}

const WIDTH_BY_QUALITY = { '1080p': 1920, '720p': 1280, '480p': 854, '576p': 1024 };

// onProgress receives a 0-1 fraction of encode completion.
export async function compressVideo(file, quality, onProgress) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  const inputName = 'input' + (file.name.match(/\.\w+$/)?.[0] || '.mp4');
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const width = WIDTH_BY_QUALITY[quality] ?? 1280;
  const handleProgress = ({ progress }) => onProgress?.(Math.min(Math.max(progress, 0), 1));
  ffmpeg.on('progress', handleProgress);

  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `scale=${width}:-2`,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '96k',
      'output.mp4',
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile('output.mp4').catch(() => {});
  }
}
