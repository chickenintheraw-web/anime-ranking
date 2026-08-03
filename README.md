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

## Deployment

This app deploys to **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare):

```bash
npm run build:worker   # patch + opennextjs-cloudflare build + patch
npm run deploy          # build:worker + wrangler deploy
npm run preview         # build:worker + wrangler dev
```

Pushes to `main` deploy automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml), using the `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` repo secrets.

Worker config lives in [wrangler.jsonc](wrangler.jsonc).
