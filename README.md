# Strivo

**Strivo** is a study partner matching platform for Indian students — school students, college students, exam aspirants (JEE, NEET, UPSC, CAT, etc.), and placement prep students. Match based on goals, availability, and study style, then study together with accountability tools built in.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Backend:** Next.js API Routes + Server Actions
- **Database:** PostgreSQL (NeonDB) + Prisma ORM
- **Auth:** Clerk (Google OAuth, Phone OTP, Email/Password)
- **Realtime:** Pusher (Phase 4+)
- **AI:** Anthropic Claude API (Phase 6+)
- **Deployment:** Vercel

## Phase 7 — What's Built

- **Live Now** — toggle on home with topic picker; 30-min auto-expiry; visible in match cards
- **Quick Connect** — sidebar pool filtered by topic; instant provisional chat via `/chat/live/[pairId]`
- **Make Permanent Pair** — dialog after live chat to keep or dismiss provisional connection
- **Hackathon board** — Hackathon filter chip on home; post listings; apply opens instant chat
- **Cron** — `/api/cron/expire-live-now` every 5 minutes
- **Deployment polish** — loading/error states, metadata, expanded deploy docs

## Phase 6 — What's Built

- **AI Study Buddy** — modal from header or home sidebar; streaming Claude chat with suggested chips (PM Case, Guesstimate, Study Plan, Explain Concept, Mock Interview)
- **Goal Coach** — 4-week study plan auto-generated after onboarding completes (prepended to AI chat)
- **AI match reasoning** — Claude one-line match explanations cached per candidate
- **Claude ice breakers** — personalized first-message suggestions on empty chats
- **Progress nudges** — cron for users inactive 2+ days (`/api/cron/ai-nudge`)
- **Pair insights** — weekly private AI insights on pair study board (`/api/cron/pair-insights`)
- **Monthly recap** — stats + shareable card at `/profile/recap` (`/api/cron/monthly-recap`)

Set `ANTHROPIC_API_KEY` in `.env.local` for live Claude responses; without it, sensible fallbacks are used.

## Phase 5 — What's Built

- **Pair Study Board** — daily targets (2 columns), check-ins, streak history dot grid
- **Focus Room** — dark full-screen, SVG timer ring, Pusher sync, 25/45/60 min
- **Session scheduling** — Google Meet link generation, in-person with same-city check
- **Complete streak system** — both users must qualify; shields, milestones, badges
- **Session ratings** — 1–5 stars after focus sessions; Good Partner badge logic
- **Cron** — 15-min session reminders

## Phase 4 — What's Built

- **Realtime chat** — `/chat/[pairId]` with Pusher private channels
- Messages persist to DB, paginated load-more, mark-as-read on open
- **Typing indicators** — live via Pusher events
- **Ice breaker** — suggested first message on empty chats
- **Safety banner** — first 3 messages reminder
- **Notifications** — DB + Pusher push, bell unread count, notification center
- **Studying Now** — inline Yes/No on notification items
- Pair streak updates when 4+ messages exchanged (2 each)

## Phase 3 — What's Built

- **Matching engine** — goal (40%) + availability (30%) + partner type (30%) scoring
- **Match feed** on `/home` with dynamic filter chips by goal
- **Match cards** — real users, match %, AI-style reason text, Skip/Connect
- **Connect flow** — pair requests with 24h expiry, accept/decline
- **My Pairs** — connected pairs list with streaks, pair study board shell
- **Public profiles** — `/profile/[userId]` with visibility rules
- **Cron** — `/api/cron/expire-requests` for expired connect requests

## Phase 2 — What's Built

- **3-step onboarding** — name/status, goal/field, study times/partner type
- Progress saved after each step; resume on reopen
- Back button on steps 2 and 3
- **Profile edit** — bio, city, college, stream, subjects, profile photo (UploadThing)
- **Profile page** — stats, study info, badges (earned + locked)
- **Settings** — goal update, city mode, girls only, visibility, all notification toggles
- Student ID verification via UploadThing
- Block list with unblock
- Delete account (Clerk + DB cascade)

## Phase 1 — What's Built

- Complete Prisma schema (all tables for the full app)
- Clerk authentication (login, signup, middleware)
- Protected routes with onboarding redirect logic
- User sync via Clerk webhook + `/api/users/me`
- Zustand session store + design system foundation

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [NeonDB](https://neon.tech) free tier)
- [Clerk](https://clerk.com) account

### 1. Clone and install

```bash
cd strivo
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks |
| `DATABASE_URL` | NeonDB connection string |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys (Phase 6 AI) |
| `CRON_SECRET` | Random string for Vercel cron auth |

**Clerk setup:**
1. Enable Google, Phone, and Email/Password in Clerk → User & Authentication
2. Add webhook endpoint: `https://your-domain/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`

For local webhook testing, use [ngrok](https://ngrok.com) or Clerk's dev webhook forwarding.

### 3. Database setup

```bash
npx prisma db push
```

Local development uses **SQLite** (`prisma/dev.db`) — no PostgreSQL or Neon account required.

For production on Vercel, switch `DATABASE_URL` to your Neon PostgreSQL connection string and change `provider` in `prisma/schema.prisma` back to `postgresql` before deploying.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build Phases

| Phase | Scope |
|---|---|
| **1** ✓ | Prisma schema, DB, Clerk auth, middleware, user/session |
| **2** ✓ | Onboarding flows, profile system, settings persistence |
| **3** ✓ | Matching engine, match cards, pair requests, connected pairs |
| **4** ✓ | Realtime chat, notifications, Pusher integration |
| **5** ✓ | Focus Room, streak system, session scheduling |
| **6** ✓ | AI integrations (Claude API) |
| **7** ✓ | Live Now, Hackathon board, polish, deployment |

## Deploy to Vercel

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example` (including `CRON_SECRET` for scheduled jobs)
4. Set build command: `npm run build`
5. Connect NeonDB and run `npx prisma migrate deploy` against production DB
6. After schema changes (e.g. Phase 7 `PairSource`), run migrations on production before deploying new code
7. Enable Vercel Cron Jobs (uses `vercel.json` paths); crons send `Authorization: Bearer $CRON_SECRET`
8. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://your-app.vercel.app`)
9. Configure Clerk production instance with the same redirect URLs and webhook endpoint
10. Optional: add Pusher and Anthropic keys for full realtime + AI features

## NeonDB Setup

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string
3. Set as `DATABASE_URL` in `.env.local` and Vercel
4. Run migrations: `npx prisma migrate deploy`

## Project Structure

```
/app              — Next.js App Router pages & API routes
/components       — Reusable UI components
/components/ui    — shadcn/ui primitives
/lib              — Prisma client, auth helpers, utilities
/prisma           — Database schema
/hooks            — Custom React hooks
/store            — Zustand stores
/types            — TypeScript definitions
/middleware.ts    — Clerk auth + onboarding guard
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
```
