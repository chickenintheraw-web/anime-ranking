Anime Ranking is a Next.js app for ranking anime opening themes, backed by [Supabase](https://supabase.com).

## Getting Started

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) live in `.env`.

## Database

Schema is managed with the Supabase CLI (`supabase/migrations/`), not the dashboard.

```bash
npx supabase login              # one-time
npx supabase link --project-ref <your-project-ref>
npx supabase db push            # apply migrations/ to the linked project
```

## Video storage

Theme videos (openings/endings) are stored in the `anime-ranking-videos` R2
bucket, served publicly from `https://pub-09be9ff2325342919e86ae0735f464d7.r2.dev`.
Each `theme_variants` row (quality + source, e.g. `720p`/`WEB`) just points
at a URL under that bucket — the app never touches video bytes itself.

To add a file:

```bash
npx wrangler r2 object put anime-ranking-videos/<anime-slug>/<file>.webm \
  --file /path/to/file.webm --remote
```

(`--remote` is required — without it, wrangler uploads to a local simulated
bucket instead of the real one.) Then insert a row into `theme_variants`
pointing at `https://pub-09be9ff2325342919e86ae0735f464d7.r2.dev/<anime-slug>/<file>.webm`.

## Deployment

This app deploys to **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare):

```bash
npm run build:worker   # patch + opennextjs-cloudflare build + patch
npm run deploy          # build:worker + wrangler deploy
npm run preview         # build:worker + wrangler dev
```

Pushes to `main` deploy automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml), using the `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` repo secrets.

Worker config lives in [wrangler.jsonc](wrangler.jsonc).
