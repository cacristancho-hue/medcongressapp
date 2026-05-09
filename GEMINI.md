# MEDCONGRESSAPP — Agent Instructions

## Product identity

MEDCONGRESSAPP is a mobile-first medical congress companion app for physicians and healthcare professionals.

The product helps users:
- Create a medical congress/event.
- Upload photos of congress slides.
- Organize photos by congress, session and topic.
- Extract text using OCR/AI.
- Generate structured medical summaries.
- Export summaries to PDF/Word.
- Optionally back up photos and outputs to Google Drive or OneDrive.

## Current stack

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Supabase SSR
- Supabase JS
- OpenAI SDK
- ESLint

## Current priority

The current priority is NOT advanced AI, payments, or cloud integrations.

The current priority is to build a stable MVP shell:

1. Authentication.
2. Dashboard.
3. Congress list.
4. Create congress form.
5. Congress detail page.
6. Upload photos interface.
7. Photo gallery.
8. OCR/AI processing status placeholder.
9. Summary placeholder.
10. Export placeholder.
11. Settings/profile.

OCR/AI can be implemented after the product structure, database model, and photo upload flow are stable.

## Critical warnings

Do NOT build a generic e-commerce UI.
Do NOT build a social media app.
Do NOT invent unrelated features.
Do NOT remove working routes.
Do NOT hardcode secrets.
Do NOT expose Supabase service role keys in frontend code.
Do NOT break Supabase authentication.
Do NOT ignore existing Supabase migrations.
Do NOT claim success without running the available checks.

## Design direction

The app must feel like a professional medical productivity tool.

Design principles:
- Mobile-first.
- Premium but simple.
- Medical/congress style.
- Clean blue/white/gray palette.
- Card-based layout.
- Clear navigation.
- Clear empty states.
- Clear loading states.
- Clear error states.
- Clear upload status.
- Bottom navigation on mobile.
- No childish UI.
- No generic SaaS dashboard without medical context.
- No e-commerce visual patterns unless strictly useful.

## Required behavior before editing

Before modifying code:

1. Inspect the full repository structure.
2. Identify framework, routing system, styling system, component structure, Supabase integration, auth flow, storage setup, and database migrations.
3. Read package.json and available scripts.
4. Read README.md if present.
5. Read files inside supabase/.
6. Read key files inside src/.
7. Summarize the current state.
8. List files that will be modified.
9. Propose a safe implementation plan.
10. Wait for user approval if in plan/audit mode.

## Verification

After implementation, run available checks:

- npm run lint
- npx tsc --noEmit
- npm run build

Report honestly:
1. What changed.
2. Files modified.
3. What works.
4. What remains pending.
5. Any errors from lint/typecheck/build.
