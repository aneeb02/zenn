# Zenn

Zenn is a full-stack wellness and productivity app built with Next.js. It combines daily affirmations, focus sessions, encrypted journaling, profile-based personalization, and a GitHub-style activity map that helps users see their consistency over time.

The product direction is simple: help someone show up for deep work, reflection, and self-care without turning the app into a noisy productivity dashboard.

## Features

### Authentication and onboarding

- Email/password registration and login.
- JWT-based session cookie named `auth-token`.
- Protected app routes through Next.js middleware.
- Profile setup after registration.
- User profile stores goals, health conditions, preferred affirmation tone, notification times, and default focus-session length.

### Personalized affirmations

- Daily affirmations are generated from local templates.
- Affirmations are filtered by:
  - selected goals
  - health conditions
  - preferred tone: `gentle`, `encouraging`, or `motivational`
- Includes general wellness affirmations plus more specific sets for focus, productivity, balance, anxiety, ADHD, depression, OCD, PCOS, PMS, and self-compassion.
- Users can save custom affirmations.

### Focus sessions

- Timer-based focus page with preset session types.
- Presets include focus, short session, break, meditation, long session, and custom duration.
- Completed sessions are saved in the database.
- Daily focus minutes are tracked in `DailyStats`.
- Ambient sound UI is scaffolded for rain, ocean, forest, white noise, and campfire. The audio files are not included by default.

### Journal

- Authenticated users can create and view journal entries.
- Journal content is encrypted before storage using AES-256-GCM.
- Entries support title, mood, tags, word count, reading-time estimate, and privacy flag.
- Creating a journal entry updates the daily stats row for that user.
- Journal activity contributes to the progress map.

### Progress map

- Dashboard includes a 12-week GitHub-style activity map.
- Each square represents one calendar day.
- Activity intensity is calculated from affirmations, focus minutes, and journal entries.
- A gold outline marks days where the user completed both a focus session and a journal entry.
- Hovering a square shows a custom tooltip with:
  - date
  - number of focus sessions
  - focus minutes
  - number of journal entries

### Dashboard

- Personalized greeting based on time of day.
- Daily affirmation and rotating quote.
- Current streak.
- Focus minutes for today.
- Wellness score.
- Progress map.
- Quick links into focus sessions, journaling, settings, and logout.

### Security and platform behavior

- Security headers are added through middleware and `vercel.json`.
- Auth endpoints and API endpoints have rate-limit hooks.
- Journal content is encrypted using `NEXTAUTH_SECRET` as the master secret for key derivation.
- Server environment variables are validated with Zod.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL or Prisma Postgres / Prisma Accelerate
- Tailwind CSS 4
- Radix UI primitives
- Zod validation
- JWT authentication
- AES-256-GCM journal encryption
- Vercel deployment

## Project Structure

```txt
wellness-app/
  prisma/
    schema.prisma
    migrations/
  public/
  src/
    app/
      api/
      dashboard/
      focus/
      journal/
      login/
      profile-setup/
      register/
      settings/
    components/
    contexts/
    data/
    generated/prisma/
    lib/
    styles/
    types/
```

Important areas:

- `src/app/api/*`: API routes for auth, profile, affirmations, stats, journal, and focus sessions.
- `src/app/dashboard/page.tsx`: main authenticated dashboard.
- `src/components/ProgressActivityMap.tsx`: 12-week activity map component.
- `src/lib/affirmations/generator.ts`: local affirmation templates and personalization logic.
- `src/lib/security/encryption.ts`: journal encryption helpers.
- `prisma/schema.prisma`: database schema.

## Data Model

Core models:

- `User`: account identity and relations.
- `Profile`: onboarding preferences and personalization settings.
- `Affirmation`: custom user-created affirmations.
- `FocusSession`: completed focus sessions.
- `DailyStats`: per-user daily aggregate stats used by the dashboard.
- `JournalEntry`: encrypted journal entries.
- `JournalReflection`: future-ready model for generated or manual journal reflections.

`DailyStats` currently tracks:

- `affirmationsViewed`
- `sessionMinutes`
- `journalEntriesCount`
- `streakCount`

The progress map is built from `DailyStats` plus a count of `FocusSession` rows for each day.

## Environment Variables

Create a `.env` file in `wellness-app/`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="a-long-random-secret-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

`DATABASE_URL` may also use Prisma Accelerate:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY"
```

Do not put quotes around the API key inside the URL. Use quotes only around the full environment variable value.

For migrations, a direct database URL is usually safer than an Accelerate URL. If Prisma reports connection or schema-engine issues, use the direct database connection string from your database provider or Prisma Console.

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

View the database locally with Prisma Studio:

```bash
npx prisma studio
```

Open:

```txt
http://localhost:5555
```

## Scripts

```bash
npm run dev
```

Runs the Next.js development server with Turbopack.

```bash
npm run build
```

Runs `prisma generate` and builds the Next.js app.

```bash
npm run start
```

Starts a production build locally. Run `npm run build` first.

```bash
npm run lint
```

Runs ESLint. See known issues below before treating this as a clean quality gate.

## Deployment

This project is deployed on Vercel.

The Git repository root is one level above the app:

```txt
zenn/
  wellness-app/
```

In Vercel, the project root directory must be:

```txt
wellness-app
```

Recommended Vercel settings:

```txt
Framework Preset: Next.js
Root Directory: wellness-app
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Production environment variables must include:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NODE_ENV=production`

Apply production migrations with:

```bash
npx prisma migrate deploy
```

Run this from inside `wellness-app/`, not from the parent repository folder.

## Standard Release Flow

1. Pull latest `main`.
2. Install dependencies if `package.json` or `package-lock.json` changed.
3. Run `npm run build`.
4. Run migrations locally if the schema changed.
5. Commit and push to GitHub.
6. Let Vercel build and deploy.
7. Run `npx prisma migrate deploy` against production if there are new migrations.
8. Smoke-test login, dashboard, journal creation, focus-session completion, and the progress map.

## Known Issues and Notes

- `npm run build` currently skips type validation and linting through the Next.js build output.
- `npx tsc --noEmit` is currently blocked by a stale file: `src/app/journal/page-old.tsx`.
- `npm run lint` is noisy because generated Prisma files and old pages are included.
- Ambient sound controls exist, but the actual sound files are not included. Add files under `public/sounds/` if you want the sound options to work.
- The app uses a custom auth flow despite having `next-auth` dependencies installed.
- `NEXTAUTH_SECRET` is also used to derive journal encryption keys. Changing it can make existing encrypted journal content unreadable.


## License

No license has been added yet.
