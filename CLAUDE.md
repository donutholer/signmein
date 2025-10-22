# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SignMeIn is a Next.js 15 attendance tracking application using Supabase for authentication and database management. The system supports two user roles: **students** (who display QR codes) and **staff** (who scan QR codes to check students into sessions).

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Authentication Flow

1. **Google OAuth**: Users sign in via Google OAuth (handled in `src/app/signin/actions.ts`)
2. **Auth Callback**: OAuth callback processes code exchange at `src/app/auth/callback/route.ts`
3. **Role Selection**: New users without a role are redirected to `/onboarding/role` to choose "student" or "staff"
4. **Session Management**: Middleware (`middleware.ts`) checks authentication on all routes and enforces role-based onboarding

### Middleware & Route Protection

The app uses Next.js middleware (`middleware.ts`) calling `utils/supabase/middleware.ts:updateSession()` to:
- Refresh Supabase sessions on every request
- Redirect unauthenticated users to `/signin`
- Force users without a role to `/onboarding/role`
- Allow public access to `/signin`, `/auth/*`, `/error`, `/api/*`, and static assets

### Supabase Client Patterns

Three separate Supabase client utilities exist for different contexts:

- **`utils/supabase/server.ts`**: Server Components and Server Actions (uses `@supabase/ssr` with Next.js cookies)
- **`utils/supabase/client.ts`**: Client Components (uses `createBrowserClient`)
- **`utils/supabase/middleware.ts`**: Middleware-specific client for session refresh

Always import from the correct file based on context.

### QR Code Security System

The QR system uses time-based HMAC signatures to prevent replay attacks:

- **Time Windows**: 15-second windows (`utils/qr.ts:currentWindow()`)
- **Signature Generation**: `signQR(uid, window)` creates HMAC-SHA256 of `uid:window` using `QR_SECRET`
- **Verification**: `verifyQR()` validates signatures for current window ± 1 window (45-second validity)
- **Format**: QR payload is `{userId}:{window}:{signature}`

Students generate QR codes via `scan/actions.ts:issueStudentQR()`. Staff scan and validate via `scan/actions.ts:scanAndCheckIn()`.

### Database Schema (Inferred)

**sessions table**:
- `id`: session identifier
- `staff_user_id`: references auth.users (staff member)
- `name`: optional session name
- `active`: boolean, whether session accepts check-ins

**checkins table**:
- `session_id`: references sessions
- `student_user_id`: references auth.users (student)
- Unique constraint on `(session_id, student_user_id)` prevents duplicate check-ins

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `./src/*`
- `@utils/*` → `./utils/*`
- `@components/*` → `./src/components/*`

Always use these aliases for imports.

### Server Actions

All Server Actions are marked with `"use server"` directive:
- **`signin/actions.ts`**: `signInWithGoogle()` - initiates Google OAuth flow
- **`onboarding/role/actions.ts`**: `chooseRole()` - sets user role in metadata
- **`scan/actions.ts`**:
  - `createSession()` - staff creates attendance session
  - `endSession()` - staff closes attendance session
  - `issueStudentQR()` - student generates time-limited QR code
  - `scanAndCheckIn()` - staff scans student QR and records check-in

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key
- `QR_SECRET`: Secret key for HMAC signing of QR codes (server-side only)
- `NEXT_PUBLIC_SITE_URL`: Site URL for OAuth redirects (optional, falls back to origin header)

### API Routes

- **`/api/goqr/decode`**: Edge function that proxies QR code image uploads to `api.qrserver.com` for decoding. Returns decoded QR text.

## Key Constraints

- Staff can only create/end their own sessions
- Students can only generate QR codes for themselves
- QR codes expire after 45 seconds (current window ± 1)
- Duplicate check-ins for same student/session are prevented (returns `{ok: true, duplicate: true}`)
- Users must have a role set before accessing protected routes
