# Zenn — Product & SaaS Plan

Turning Zenn from a personal wellness tracker into a low-cost productivity SaaS.
Design direction: **keep the zen aesthetic** (`src/styles/zen-dark.css`); retire `modern-theme.css` and the orphaned `Sidebar.tsx`.

---

## 1. Where the code actually is today

**Solid and working**
- Custom JWT auth (`auth-token` cookie), profile onboarding, Edge middleware for headers + rate limiting.
- Focus timer with 5 guided modes, ambient-sound scaffolding, completion beep.
- Encrypted journal (AES-256-GCM), `DailyStats` aggregation, streaks, 12-week activity map.

**Half-built — the important part.** The productivity loop is *already sketched on the client but never persisted*:
- `src/app/focus/page.tsx` lets you add **up to 3 in-session tasks with checkboxes** — but they live in React state and are **thrown away** when the session ends. Only `intention` (a single string) is saved.
- The completion screen already routes to `/journal?write=true&prompt=...` to reflect — but it writes a plain `JournalEntry`, not a linked `JournalReflection`.
- `JournalReflection` model exists in `prisma/schema.prisma`; `createReflectionSchema` + `journalStatsSchema` exist in `src/lib/validations/api.ts`. **No API, no UI.**
- `Sidebar.tsx` points at `/progress`, `/wellness`, `/friends`, `/activity` — **none exist**, and the sidebar isn't even mounted.
- `Profile.notificationTimes[]` is collected and never used.

**Debt that blocks scaling** (details in §7): saved affirmations live in `localStorage` not the DB; rate limiting is in-memory (breaks across serverless instances); build ignores TS/ESLint errors; `NEXTAUTH_SECRET` doubles as the journal encryption key.

**Takeaway:** we are not starting features from zero. We are *persisting and connecting* primitives that already half-exist. That's why the cost is low.

---

## 2. Product thesis

Most productivity apps are loud dashboards that induce guilt. Zenn's wedge is **calm productivity**: the same plan → focus → reflect → review loop, but designed to reduce anxiety rather than manufacture it. Everything below serves that loop; social/gamification features are deferred because they cut against the positioning.

The core loop we're building:

```
   PLAN                FOCUS                 REFLECT              REVIEW
 task/habit   →   focus session on it   →   journal reflection  →  progress page
 (persisted)      (already exists)          (linked, not loose)     (from existing data)
```

---

## 3. Data model changes (Prisma)

All additive; no destructive migrations. New models:

```prisma
model Task {
  id           String    @id @default(cuid())
  userId       String
  title        String
  notes        String?
  status       String    @default("todo")   // todo | doing | done
  priority     Int       @default(0)         // 0 none,1 low,2 med,3 high
  dueDate      DateTime? @db.Date
  completedAt  DateTime?
  estimateMins Int?                          // planned focus time
  spentMins    Int       @default(0)         // rolled up from sessions
  order        Int       @default(0)         // manual sort within a status
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions FocusSession[]

  @@index([userId, status])
  @@index([userId, dueDate])
}

model Habit {
  id         String   @id @default(cuid())
  userId     String
  name       String
  cadence    String   @default("daily")     // daily | weekly
  targetDays Int      @default(1)            // for weekly cadence
  color      String   @default("moss")       // maps to a zen palette token
  archivedAt DateTime?
  createdAt  DateTime @default(now())

  user  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  logs  HabitLog[]

  @@index([userId])
}

model HabitLog {
  id      String   @id @default(cuid())
  habitId String
  userId  String
  date    DateTime @db.Date
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@index([userId, date])
}
```

Edits to existing models:

```prisma
model FocusSession {
  // + taskId String?      and  task Task? @relation(...)
  // + completedTasks Json?   // snapshot of the in-session checklist
}

model User {
  // + plan            String   @default("free")   // free | pro
  // + stripeCustomerId String?
  // + tasks   Task[]
  // + habits  Habit[]
}

model DailyStats {
  // + tasksCompleted Int @default(0)
  // + habitsCompleted Int @default(0)
  // (feed these into getIntensity() in src/app/api/stats/daily/route.ts)
}
```

Migration: `npx prisma migrate dev --name productivity-loop`. Use a **direct** `DATABASE_URL` (not Accelerate) per the repo's known migration issue.

---

## 4. Phased build

### Phase 1 — Close the loop (highest leverage, $0 infra)

**1a. Tasks**
- Model + migration (above).
- API `src/app/api/tasks/route.ts` (GET list, POST create) and `[id]/route.ts` (PATCH status/edit, DELETE). Follow the existing route pattern: `requireAuth(request)` from `src/lib/auth/server.ts`, Zod schema in `src/lib/validations/api.ts`, `error-handler.ts` responses.
- Page `src/app/tasks/page.tsx` in zen styling — a quiet list, not a Kanban wall. Group by todo/doing/done.

**1b. Wire focus → task (the key connection)**
- On the focus page, replace the ephemeral 3-task widget with: "focus on a task" picker sourced from real `Task` rows (keep quick-add inline). Selected task → `taskId` in the `POST /api/focus-session` body.
- In `src/app/api/focus-session/route.ts`, when `taskId` is present, `increment task.spentMins` and store `completedTasks` snapshot. Marking a task done in-session flips its status.

**1c. Persisted reflection**
- Build `POST /api/journal/[id]/reflection` (schema already exists) and, from the session completion screen, create a `JournalReflection` linked to the session's task/journal instead of a loose entry.

**1d. `/progress` page — the review surface**
- Build the page `Sidebar.tsx` already promises. **No new data** — read from `DailyStats` + `FocusSession` + new task/habit counts:
  - focus minutes over 4/12 weeks (line/bar),
  - mood trend from `JournalEntry.mood`,
  - focus-by-hour heatmap → "your best focus window is ~9–11am",
  - tasks completed / habit consistency.
- Charts: hand-roll SVG in the zen style or a tiny lib; **read the `dataviz` skill before building any chart.**

### Phase 2 — Habits & retention plumbing

- Habit + HabitLog models, `src/app/api/habits/*`, a compact habit tracker on `/progress` or its own `/habits`. Feed `habitsCompleted` into the activity map's `getIntensity()`.
- **Move saved affirmations to the DB.** The `Affirmation` model already exists; the dashboard currently uses `localStorage` (`src/app/dashboard/page.tsx`). Add `POST/GET/DELETE /api/affirmations/custom` usage from the client.
- **Reminders** from `Profile.notificationTimes[]`: email via **Resend** (free 3k/mo) triggered by **Vercel Cron** (free), or web push ($0). Start with a daily "your focus window" nudge.
- Drop the ambient audio files into `public/sounds/` — the UI is already done.

### Phase 3 — Make it a SaaS

- **Stripe** subscriptions (Checkout + Billing Portal + webhook at `src/app/api/stripe/webhook/route.ts`), `User.plan`/`stripeCustomerId`.
- Free vs Pro gating. Suggested split: Free = core loop + 4 weeks of history; **Pro** = full history, advanced `/progress` analytics, reminders, AI reflections.
- **Optional AI** with **Claude Haiku** (cheapest model) — Pro-only so cost tracks revenue:
  - weekly "reflection digest" summarizing journal mood + focus patterns,
  - smarter, context-aware affirmations layered over the free local templates.

### Phase 4 — Social / accountability (deferred)

`/friends`, `/activity` (the remaining sidebar stubs): accountability partners, shared streaks, opt-in shared activity map. Build only after the core loop demonstrably retains — it adds real complexity (sharing, privacy of encrypted journals) and pulls against the calm positioning.

---

## 5. Cost model ("even at very low cost")

| Component | Provider | Cost at low scale |
|---|---|---|
| Hosting | Vercel Hobby → Pro | $0 → $20/mo when needed |
| Database | Existing Postgres / Prisma Postgres | $0 free tier |
| Affirmations | Local templates | **$0** |
| Reminders (email) | Resend free tier | $0 up to 3k emails/mo |
| Cron | Vercel Cron | $0 |
| Rate limiting | Upstash Redis free | $0 (10k cmd/day) |
| Payments | Stripe | % per transaction only |
| AI (Pro only) | Claude Haiku | pennies/user/mo, Pro-gated |

Everything through Phase 2 runs at ~**$0 marginal cost**. Paid infra appears only when revenue does.

---

## 6. Suggested sequencing

1. **Milestone 1 (loop):** Task model + API + page, focus↔task wiring, persisted reflection. *This is the product.*
2. **Milestone 2 (review):** `/progress` page from existing data.
3. **Milestone 3 (retention):** habits, DB-backed affirmations, reminders, sounds.
4. **Milestone 4 (revenue):** Stripe + plan gating + AI.
5. **Milestone 5 (growth):** social.

---

## 7. Tech debt to fix along the way

- **Design unification (do first):** standardize on `zen-dark.css`, delete `modern-theme.css` and orphaned `Sidebar.tsx` (or rebuild nav in zen style). New pages must not reintroduce the Tailwind-gradient look.
- **Shared app shell:** dashboard and focus each hand-roll their own `<nav>`. Extract a zen `AppShell`/nav so new pages (`/tasks`, `/progress`, `/habits`) are consistent.
- **Rate limiting → Upstash Redis** before real traffic; in-memory won't hold across serverless instances.
- **Re-enable type checking:** `next.config.ts` sets `ignoreBuildErrors` + `ignoreDuringBuilds`. Delete stale `src/app/journal/page-old.tsx`, fix errors, turn type-checking back on so the build is a real gate.
- **Encryption key strategy:** journal content is keyed off `NEXTAUTH_SECRET`. Before onboarding real users, document that rotating it breaks all journals, and consider a dedicated `JOURNAL_ENCRYPTION_KEY` env var.
- **Tests:** no tests today. Add unit tests for `getIntensity`, streak logic, and encryption round-trip; integration tests for the task/session/stats write paths (the loop's data integrity is the core value).

---

## 8. Open questions for you

- **Positioning:** lean fully into "calm productivity for makers/students," or keep the broader wellness framing?
- **Free/Pro line:** does the history-limit + advanced-analytics split feel right, or gate a whole feature (e.g. habits) instead?
- **AI:** in-scope for v1 monetization, or ship paid tiers on non-AI value first and add AI later?
