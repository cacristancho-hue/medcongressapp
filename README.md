# MEDCONGRESSAPP

Mobile-first medical congress companion for physicians. The MVP shell lets a user create congresses, upload slide photos, keep a private gallery, and prepare the product surface for OCR/AI summaries and export workflows.

This is not e-commerce, a social network, or a generic SaaS dashboard.

## Stack

- Next.js 16.2.4 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, Storage and SSR
- OpenAI SDK gated by feature flag
- Sonner notifications

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=
MEDCONGRESS_AI_ENABLED=false
```

`MEDCONGRESS_AI_ENABLED` is disabled by default. Set it to `true` only when you explicitly want server-side OCR/AI calls to OpenAI. `OPENAI_API_KEY` must stay server-side and must not be exposed with a `NEXT_PUBLIC_` prefix.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Supabase SQL Order

Run the SQL files in this order from `supabase/`:

1. `schema.sql`
2. `schema_fase2.sql`
3. `schema_fase3.sql`
4. `schema_fase4.sql`
5. `schema_fase5.sql`
6. `schema_fase6_images.sql`
7. `schema_fase7_reference_candidates.sql`

`public.references` remains legacy/deprecated for now. New candidate references should use `public.reference_candidates`.

## Checks

Before handoff or deployment, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Do not rename `src/proxy.ts`; it is the verified Next.js 16 auth proxy.
