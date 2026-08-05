import { getCloudflareContext } from '@opennextjs/cloudflare';
import { revalidatePath } from 'next/cache';
import { getSessionAndAdmin } from '@/lib/admin';

const QUALITIES = ['1080p', '720p', '480p', '576p'];
const SOURCES = ['BD', 'NCBD', 'WEB', 'NCWEB', 'DVD', 'NCDVD'];
const R2_PUBLIC_BASE = 'https://pub-09be9ff2325342919e86ae0735f464d7.r2.dev';

// Route Handler rather than a Server Action: Server Actions cap request
// bodies at 1MB by default and fully buffer FormData before running,
// which is the wrong shape for a 30-60MB video file. Here request.body is
// a raw stream handed straight to the R2 binding, which accepts it
// without buffering the whole file into Worker memory.
export async function PUT(request) {
  const { supabase, isAdmin } = await getSessionAndAdmin();
  if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const themeId = url.searchParams.get('theme_id');
  const animeId = url.searchParams.get('anime_id');
  const quality = url.searchParams.get('quality');
  const source = url.searchParams.get('source');

  if (!themeId || !animeId || !QUALITIES.includes(quality) || !SOURCES.includes(source)) {
    return Response.json(
      { error: 'Missing or invalid theme_id/anime_id/quality/source' },
      { status: 400 }
    );
  }
  if (!request.body) {
    return Response.json({ error: 'Empty request body' }, { status: 400 });
  }

  const key = `${animeId}/${themeId}-${quality}-${source}.mp4`;
  const { env } = await getCloudflareContext({ async: true });

  // R2's put() rejects an arbitrary ReadableStream with no known length
  // ("Provided readable stream must have a known length") - buffering is
  // fine here since the client already compressed the file down to a few
  // tens of MB, well under a Worker's memory ceiling.
  const bytes = await request.arrayBuffer();
  await env.VIDEOS.put(key, bytes, {
    httpMetadata: { contentType: 'video/mp4' },
  });

  const publicUrl = `${R2_PUBLIC_BASE}/${key}`;

  // Same (theme_id, quality, source) is unique - delete-then-insert
  // rather than a plain insert, matching addYoutubeVariant's pattern.
  await supabase
    .from('theme_variants')
    .delete()
    .eq('theme_id', themeId)
    .eq('quality', quality)
    .eq('source', source);

  const { data, error } = await supabase
    .from('theme_variants')
    .insert({ theme_id: themeId, quality, source, url: publicUrl, provider: 'r2' })
    .select('id, quality, source, url, provider')
    .single();

  if (error) {
    await env.VIDEOS.delete(key).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);

  return Response.json({ variant: data }, { status: 200 });
}
