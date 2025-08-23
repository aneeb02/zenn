# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 15.5 wellness application built with TypeScript, Prisma, and shadcn/ui components. The app provides affirmations, focus sessions, secure journaling, and wellness tracking features with a modern, security-focused architecture.

## Tech Stack

- **Framework**: Next.js 15.5 with App Router and Turbopack
- **Language**: TypeScript 5
- **Database**: PostgreSQL with Prisma ORM (supports Prisma Accelerate)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js with JWT tokens in httpOnly cookies
- **Validation**: Zod for runtime validation
- **State Management**: React Context API
- **Animation**: Framer Motion

## Development Commands

### Setup & Installation
```bash
# Install dependencies and generate Prisma client
npm install

# Setup database (fresh start - will reset existing data)
npx prisma migrate reset

# Apply existing migrations (preserves data)
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate
```

### Development
```bash
# Start development server with Turbopack
npm run dev

# Lint the codebase
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Database Management
```bash
# Open Prisma Studio to view/edit database
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Pull database schema from existing database
npx prisma db pull

# Push schema changes without migration (dev only)
npx prisma db push
```

## Architecture Overview

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── api/                 # API routes
│   │   ├── focus-session/   # Focus session endpoints
│   │   └── profile/         # Profile management endpoints
│   ├── dashboard/           # User dashboard pages
│   ├── focus/              # Focus session interface
│   ├── login/              # Authentication pages
│   ├── register/           
│   ├── profile-setup/      # Initial profile configuration
│   └── settings/           # User settings
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   └── profile/           # Profile-related components
├── contexts/              # React Context providers
├── lib/                   # Core utilities and services
│   ├── auth/              # Authentication logic
│   ├── config/            # Environment configuration
│   ├── db/                # Database client setup
│   ├── security/          # Rate limiting, sanitization
│   ├── utils/             # Error handling, helpers
│   └── validations/       # Zod schemas
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware for auth & security
```

### Data Models (Prisma)

**User**: Core user account with authentication
- Relations: Profile (1:1), Affirmations (1:many), FocusSession (1:many), DailyStats (1:many), JournalEntry (1:many)

**Profile**: User wellness preferences and settings
- Fields: goals[], healthConditions[], tone, notificationTimes[], focusSessionLength

**Affirmation**: Personalized wellness affirmations
- Fields: text, category, isCustom, source
- Indexed on: userId, isCustom, createdAt

**FocusSession**: Meditation/focus session records
- Fields: duration, type, ambientSound
- Indexed on: userId, createdAt

**DailyStats**: Daily wellness metrics tracking
- Fields: affirmationsViewed, sessionMinutes, streakCount
- Unique constraint: [userId, date]

**JournalEntry**: Encrypted journal entries for reflection and progress tracking
- Fields: title, content (encrypted), contentIv, mood, tags[], wordCount, readingTime
- Encryption: AES-256-GCM with per-entry salt
- Indexed on: userId + createdAt, userId + mood, userId + tags
- Relations: JournalReflection (1:many)

**JournalReflection**: Reflections on journal entries
- Fields: content, reflectionType (progress, insight, gratitude, lesson)
- Indexed on: journalId, userId + createdAt

### Security Features

1. **Environment Validation**: Runtime validation of all env vars with Zod
2. **Rate Limiting**: 
   - Auth endpoints: 5 requests/15 minutes
   - API endpoints: 60 requests/minute
3. **Security Headers**: XSS, clickjacking, and content-type protection
4. **Input Validation**: All API inputs validated with Zod schemas
5. **Password Security**: bcrypt hashing with salt rounds
6. **JWT Authentication**: Secure httpOnly cookies
7. **Error Handling**: Structured logging without exposing sensitive data
8. **Journal Encryption**: AES-256-GCM encryption for journal content
   - Per-entry salt generation
   - Secure key derivation with PBKDF2
   - Authentication tags for tamper detection

### API Structure

All API routes follow RESTful conventions with standardized error responses:
- Input validation using Zod schemas
- Rate limiting applied via middleware
- Consistent error format with proper HTTP status codes
- Prisma error handling with user-friendly messages

### Edge Runtime Compatibility

The application is optimized for deployment on Vercel with Edge Runtime support:
- Environment validation split for Edge compatibility
- Middleware runs in Edge Runtime
- Supports both PostgreSQL and Prisma Accelerate

## Environment Variables

Required environment variables (create `.env` file):

```env
# Database URL - supports both formats:
# Regular PostgreSQL: postgresql://user:password@host:port/database
# Prisma Accelerate: prisma+postgres://accelerate.prisma-data.net/?api_key=...
DATABASE_URL=

# NextAuth configuration
NEXTAUTH_SECRET=<minimum-32-characters>
NEXTAUTH_URL=http://localhost:3000  # Optional in development

# Environment
NODE_ENV=development
```

## Common Development Tasks

### Adding a New API Route
1. Create route file in `src/app/api/<endpoint>/route.ts`
2. Add validation schema in `src/lib/validations/api.ts`
3. Implement rate limiting if needed in middleware
4. Use error handler from `src/lib/utils/error-handler.ts`

### Working with Journal Feature
```bash
# Test journal encryption
node -e "const { encrypt, decrypt } = require('./src/lib/security/encryption'); console.log(decrypt(encrypt('test')))"

# Journal API endpoints
GET    /api/journal          # List entries (paginated)
POST   /api/journal          # Create new entry
GET    /api/journal/[id]     # Get single entry (decrypted)
PUT    /api/journal/[id]     # Update entry
DELETE /api/journal/[id]     # Delete entry
```

### Modifying Database Schema
1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name <description>`
3. Update relevant TypeScript types if needed
4. Test with `npx prisma studio`

### Adding UI Components
1. Use shadcn/ui CLI: `npx shadcn@latest add <component>`
2. Components are added to `src/components/ui/`
3. Follow existing patterns for custom components

## Deployment Notes

### Vercel Deployment
- Build command: `npm run build` (includes Prisma generation)
- Security headers configured in `vercel.json`
- Edge function configuration for auth endpoints
- Environment variables must be set in Vercel dashboard

### Database Migrations in Production
1. Create database backup first
2. Review migration SQL: `npx prisma migrate deploy --dry-run`
3. Apply during maintenance window: `npx prisma migrate deploy`

## Known Configurations

- **ESLint**: Currently set to ignore errors during builds (see `next.config.ts`)
- **TypeScript**: Build errors ignored in production (consider enabling for type safety)
- **Turbopack**: Enabled for faster development builds
- **Prisma Output**: Custom output path at `src/generated/prisma`

## Testing Strategy

Currently no test files present. Recommended testing approach:
- Unit tests for validation schemas and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows (auth, profile setup, focus sessions)

## Performance Considerations

- Database queries indexed on frequently accessed fields
- Rate limiting prevents abuse
- Prisma connection pooling configured
- Consider adding Redis for production rate limiting
- Response caching can be implemented for static data
