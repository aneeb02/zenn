# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout gotcha

The git root is **one level above** this app: `zenn/` (git root) contains `wellness-app/` (the Next.js project). Run all app commands (`npm`, `npx prisma`, …) from inside `wellness-app/`. On Vercel the Root Directory must be set to `wellness-app`.

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # runs `prisma generate` then `next build --turbopack`
npm run lint           # eslint (noisy — see below)
npm start              # serve production build

npx prisma migrate dev --name <desc>   # create + apply migration (dev)
npx prisma migrate deploy              # apply migrations (prod / CI)
npx prisma migrate reset               # DROP all data and re-migrate
npx prisma studio                      # inspect DB at localhost:5555
```

`prisma generate` runs automatically on `postinstall` and in `build`. There are **no tests** in this repo.

## Architecture

Next.js 15 App Router + React 19, TypeScript, Prisma/PostgreSQL, Tailwind v4, shadcn/ui (Radix). Server code lives under `src/lib/`; App Router pages and API routes under `src/app/`.

**Custom auth, not NextAuth.** Despite `next-auth` being installed, authentication is a hand-rolled JWT flow (`jsonwebtoken`) storing a token in an httpOnly cookie named `auth-token`. Login/register/logout/me live in `src/app/api/auth/*`; server-side helpers in `src/lib/auth/` (`server.ts`, `useAuth.tsx`). Do not wire new code into next-auth.

**Middleware is the security layer** (`src/middleware.ts`, Edge runtime). It applies security headers to every response, rate-limits (`authRateLimit` for login/register, `apiRateLimit` for all `/api/*`), and enforces public-vs-protected route access. Rate limiting (`src/lib/security/rate-limit.ts`) is **in-memory**, so it does not hold across serverless instances — treat it as best-effort, not a real limiter in production.

**Env validation is split for Edge compatibility:** `src/lib/config/env.ts` is Edge-safe (used by middleware); `env.server.ts` is Node-only. Both validate with Zod and fail fast in production. `next.config.ts` **ignores TypeScript and ESLint errors during builds** — the build will not catch type errors, so verify types manually.

**Prisma client is generated to a custom path** `src/generated/prisma` (see `output` in `prisma/schema.prisma`) and imported as `@/generated/prisma` (e.g. `src/lib/db/prisma.ts`), **not** `@prisma/client`. These generated files are committed and make `npm run lint` / `tsc --noEmit` noisy.

**Journal encryption is tied to `NEXTAUTH_SECRET`.** Journal `content` is encrypted with AES-256-GCM (`src/lib/security/encryption.ts`); `NEXTAUTH_SECRET` is the master secret for key derivation. **Changing `NEXTAUTH_SECRET` makes all existing encrypted journal entries unreadable.** Journal API: `src/app/api/journal/route.ts` (list/create) and `[id]/route.ts` (get/update/delete).

**Data flow for stats:** creating a focus session or journal entry updates the per-user `DailyStats` row (unique on `[userId, date]`). The dashboard progress map (`src/components/ProgressActivityMap.tsx`) is built from `DailyStats` plus per-day `FocusSession` counts. When touching session/journal creation, keep the `DailyStats` update in sync.

## Conventions for API routes

Route handlers under `src/app/api/*/route.ts` follow: validate input with a Zod schema from `src/lib/validations/`, use the error helpers in `src/lib/utils/error-handler.ts` for responses, and read the current user via `src/lib/auth/server.ts`. Match this pattern in new routes.

## Known rough edges

- `tsc --noEmit` is blocked by a stale `src/app/journal/page-old.tsx`.
- Ambient-sound UI exists on the focus page but audio files are not included; add them under `public/sounds/` to enable.
- For Prisma migrations, prefer a direct Postgres `DATABASE_URL` over a Prisma Accelerate URL (Accelerate can break the schema engine).
