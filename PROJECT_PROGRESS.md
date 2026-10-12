# Online Leave Management System — Project Progress

This document tracks stage-by-stage progress. Previous stage summaries are
preserved; new stages append below.

---

## Stage 0 — Existing Project Inspection and Requirements Lock

**Status:** COMPLETED AND VERIFIED (assessment only; no code changes)
**Date:** 2026-10-12

### 1. Existing Codebase Assessment

- **Project directory contents:** only
  `online_leave_management_architecture.md` (74 KB, 1860 lines).
- **Existing frontend:** NONE.
- **Existing backend:** NONE.
- **Existing database/models:** NONE.
- **Existing scripts / package files / env files:** NONE.
- **Git repository:** NOT initialized.
- **Application currently starts:** N/A (no application exists yet).

Conclusion: This is a **greenfield project**. There is no working code to
preserve or reuse. The architecture document is the sole reference and must
be treated as read-only specification.

### 2. Confirmed Environment

| Tool | Version / Status |
|------|------------------|
| OS | Windows (win32) |
| Shell | PowerShell 5.1 |
| Node.js | v22.17.0 (available) |
| npm | 10.9.2 (available) |
| Git | 2.51.0.windows.1 (available) |
| MongoDB (mongod) | NOT installed |
| mongosh | NOT installed |
| MongoDB service | NOT present |
| Port 27017 | CLOSED |
| Docker | NOT installed |
| npm registry connectivity | OK (443 reachable) |

### 3. Feature Gap Checklist (vs. architecture)

Because there is no existing code, every required feature is **MISSING**:

| Feature | Status |
|---------|--------|
| App configuration + DB connection | MISSING |
| User / LeaveApplication / Notification / Calendar / Settings models | MISSING |
| Authentication + RBAC + ownership | MISSING |
| Admin student/teacher account management | MISSING |
| Leave submission + letter generation | MISSING |
| Admin approval/rejection + duplicate protection | MISSING |
| Notifications + dashboards/statistics | MISSING |
| Academic calendar + holiday management | MISSING |
| Leave history + print + PDF | MISSING |
| Security/reliability hardening | MISSING |
| Automated + E2E tests | MISSING |
| Deployment docs + README | MISSING |

### 4. Confirmed Technology Stack

Per architecture (no existing stack to preserve, so architecture stack is
adopted):

- **Frontend:** React + Vite + Tailwind CSS + React Router + icon library
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** HttpOnly session cookie strategy (secure, SameSite), password
  hashing via bcrypt (native, no build issues) — final choice in Stage 3
- **Structure:** monorepo with `client/` and `server/`

### 5. Locked Policy Decisions (confirmed by user 2026-10-12)

1. **Rejection reason:** REQUIRED on rejection (clearer audit trail).
2. **Weekends count as leave days?** **YES** — policy leave days INCLUDE
   weekends (requested policy days == inclusive calendar days).
3. **Holidays count as leave days?** **YES** — holidays are included in
   policy leave days as well.
4. **Applications permitted during holidays/weekends?** YES — allowed, but a
   warning is shown; warnings never change status.
5. **Authoritative timezone:** institution-configurable; default
   `Asia/Kolkata` (IST) via InstitutionSettings.
6. **Email notification:** NOT required for first release — in-app
   notifications are the source of truth.
7. **PDF download:** INCLUDED in first release (server-generated from trusted
   saved data).

Consequence for Stage 5/7: `requestedPolicyDays` equals
`requestedCalendarDays` (end − start + 1). The calendar utility and dashboard
leave-day totals will treat weekends/holidays as counted days, while still
surfacing weekend/holiday warnings.

### 6. Locked Decision — Database Runtime

**MongoDB Atlas (cloud)** selected. Requirements for Stage 1:

- User provides an Atlas connection string via a local `.env` (never
  committed). `.env.example` will contain only a placeholder.
- Backend connects via Mongoose; health endpoint reports DB connection state.
- Reproduction/verification of DB connectivity depends on the Atlas cluster
  being reachable from this machine.

### 7. Stage Plan (high level)

Follow Stages 1–13 in the architecture order. Stage 1 will scaffold the
monorepo, create `client/` (Vite + React + Tailwind + Router) and `server/`
(Express + config + health endpoint + central error handlers), add
`.env.example`, `.gitignore`, and a root README, then verify frontend build,
backend boot, and DB connectivity.

### 8. Files Created in Stage 0

- `PROJECT_PROGRESS.md` (this file) — progress tracking document.

### 9. Files Modified in Stage 0

- None. The architecture document was read only and is never modified.

### 10. Tests Performed

- PASS — Directory inspection (`Get-ChildItem -Force -Recurse`): confirmed
  only the architecture document exists.
- PASS — Runtime inspection: Node v22.17.0, npm 10.9.2, git 2.51.0 detected.
- FAIL/BLOCKED — MongoDB runtime: not installed; port 27017 closed. Blocks DB
  connectivity verification in Stage 1 until a database option is chosen.

### 11. Known Issues / Incomplete Requirements

- MongoDB Atlas connection string not yet provided; required before Stage 1's
  DB-connection acceptance criteria can be verified.
- All policy decisions above are now locked (see Section 5).

### 12. Next Stage

**Stage 1 — Repository Setup, Configuration, and Application Boot.**

---

## Stage 1 — Repository Setup, Configuration, and Application Boot

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Create a stable frontend/backend foundation that runs locally and connects to
the database, with a health endpoint and central error handling.

### 2. What was implemented

- Monorepo with `client/` (React + Vite + Tailwind + React Router) and
  `server/` (Express + Mongoose).
- Backend: environment loading + validation, Mongoose connection, `/api/v1`
  route mounting, `GET /api/v1/health`, helmet, CORS (single allowed origin),
  JSON body parsing with size limit, request logging (dev), central 404 and
  error handlers, graceful shutdown.
- Frontend: Vite dev server with `/api` proxy to the backend, Tailwind CSS v4,
  React Router, a reusable `apiClient` with consistent JSON/error handling, a
  home page that calls the health endpoint (loading / success / error states),
  and a not-found page.
- Root: `.gitignore` (protects `.env` + `atlas-credentials.env`), root npm
  scripts (`install:all`, `dev`, `build`, `start`, `test`), `README.md`,
  `.env.example` files.

### 3. Files created (Stage 1)

Root: `.gitignore`, `package.json`, `README.md`, `.env.example`

Server:
- `server/package.json`
- `server/.env.example` (placeholder), `server/.env` (real creds, gitignored)
- `server/src/config/env.js` — env load + required-var validation
- `server/src/config/database.js` — Mongoose connect/disconnect + status
- `server/src/utils/AppError.js` — operational error class
- `server/src/middleware/errorHandler.js` — 404 + central error handler
- `server/src/routes/health.routes.js`, `server/src/routes/index.js`
- `server/src/app.js` — Express app + middleware + routes
- `server/src/server.js` — DB connect + listen + graceful shutdown

Client:
- `client/package.json`, `client/index.html`, `client/vite.config.js`,
  `client/.env.example`
- `client/src/index.css` (Tailwind), `client/src/main.jsx`, `client/src/App.jsx`
- `client/src/routes/AppRouter.jsx`
- `client/src/services/apiClient.js`
- `client/src/pages/HomePage.jsx`, `client/src/pages/NotFoundPage.jsx`

### 4. Files modified (Stage 1)

- `server/package.json` — switched dev watcher to Node built-in `--watch`,
  removed `nodemon` (and its vulnerable dependency tree).
- `client/package.json` — upgraded `react-router-dom` from `^6.28.1` to
  `^7.18.4` (patches the flagged open-redirect advisory).
- `PROJECT_PROGRESS.md` — this update.

### 5. Architecture followed

Matches §2.3 recommended structure (`client/src/{routes,services,pages,
components}`, `server/src/{config,routes,middleware,utils}`), §4 API prefix
`/api/v1` with the documented success/error JSON shapes, Stage 1 backend tasks
(app/server split, env validation, Mongoose, health endpoint, CORS + security
headers + size limits + central 404/error handlers), and the Stage 1 config
deliverables (`.env.example`, `.gitignore`, README).

### 6. Testing and verification

- **PASS** — Backend dependency install: 0 vulnerabilities (`npm audit`).
- **PASS** — Client dependency install + `npm audit`: 0 vulnerabilities after
  the React Router upgrade.
- **PASS** — Frontend production build (`vite build`): 1593 modules, CSS
  11.91 kB, JS 191 kB, built successfully.
- **PASS** — Frontend dev server: `GET http://localhost:5173/` → HTTP 200,
  title `Online Leave Management System`, `#root` present.
- **PASS** — Backend HTTP layer (app run without DB): `GET /api/v1/health` →
  HTTP 503 with clean JSON (`database: "disconnected"`, no secrets);
  unknown route → HTTP 404 with the documented error shape.
- **PASS** — Config validation: backend exits with a clear message when
  `MONGODB_URI`/`SESSION_SECRET` are missing (verified by code path + the
  observed startup error).
- **PASS** — Full backend boot + MongoDB Atlas connection: after the client IP
  was added to the Atlas IP Access List, the server connected to database
  `online_leave_management` and `GET /api/v1/health` returned HTTP 200 with
  `success:true`, `database:"connected"`.
- **PASS** — Live CORS: allowed origin `http://localhost:5173` → response
  includes `Access-Control-Allow-Origin`; disallowed origin `http://evil.example`
  → no `Access-Control-Allow-Origin` (browser blocks); no-origin request → 200.
- **PASS** — Raw MongoDB driver check: `CONNECTED`, `isWritablePrimary:true`,
  ping to `online_leave_management` OK.

### 7. Issues and limitations

- None blocking. The earlier Atlas IP-allowlist blocker was resolved by adding
  the client IP (`103.103.209.147`) to the cluster's Network Access list.
- Server uses fail-fast startup: if the initial DB connection fails the
  process exits with a clear error instead of serving a degraded health
  endpoint. Acceptable for Stage 1; revisit if a "keep serving while DB is
  down" behavior is desired.
- `npm test` has no test files yet (added in Stage 12).

### 8. Stage completion status

COMPLETED AND VERIFIED. All Stage 1 deliverables are built; frontend, API
layer, live CORS, and live MongoDB Atlas connectivity are all verified.

### 9. Next stage

**Stage 2 — Database Models, Indexes, and Data Rules.** (Not started; awaiting
instruction.)

### 10. How to run or verify

```bash
npm run install:all      # install root + server + client deps
npm run dev              # start API (5000) and UI (5173) together
# or: npm run dev:server / npm run dev:client
```

Then open http://localhost:5173 — the home page shows API/database status.
Health endpoint: http://localhost:5000/api/v1/health

---

## Stage 2 — Database Models, Indexes, and Data Rules

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Establish a reliable, validated data model (schemas, indexes, date-only
convention, ID generation, seed/setup) before building dependent features.

### 2. What was implemented

- Seven Mongoose models: `User`, `LeaveApplication`, `Notification`,
  `AcademicCalendarEvent`, `InstitutionSettings`, `AuditLog`, `Counter`.
- Role-specific user validation, unique login/institutional IDs, account status.
- Leave status enum (`Pending`/`Approved`/`Rejected`) with cross-field rules
  (end ≥ start; rejection requires a reason; a decision requires `decidedBy`).
- Indexes for real query patterns (unique IDs, applicant/status/submittedAt,
  date ranges, notification recipient/read state, calendar ranges, audit).
- Date-only utility (UTC arithmetic, timezone-aware "today"), used by every
  date field; all leave/calendar dates stored as `YYYY-MM-DD` strings.
- Collision-free application ID generator (`PREFIX-YYYY-NNNNNN`) via an atomic
  counter.
- Password hashing utility (bcryptjs) and `passwordHash` excluded from all
  serialization (`select: false` + `toJSON` transform).
- Idempotent seed script: first administrator + optional clearly-marked demo
  accounts (`@demo.local`); refuses to seed in production without a password;
  never runs automatically on startup.

### 3. Files created (Stage 2)

- `server/src/utils/dateOnly.js` — calendar-date parse/compare/enumerate/today.
- `server/src/utils/password.js` — bcryptjs hash/verify.
- `server/src/utils/applicationId.js` — atomic application ID generator.
- `server/src/models/Counter.js`
- `server/src/models/User.js`
- `server/src/models/LeaveApplication.js`
- `server/src/models/Notification.js`
- `server/src/models/AcademicCalendarEvent.js`
- `server/src/models/InstitutionSettings.js`
- `server/src/models/AuditLog.js`
- `server/src/models/index.js` — barrel export.
- `server/src/scripts/seed.js` — first-admin + demo-data provisioning.

### 4. Files modified (Stage 2)

- `server/package.json` — added `bcryptjs`; added `seed` script.
- `server/.env` / `server/.env.example` — added `ADMIN_*` and `SEED_DEMO_DATA`.
- `package.json` (root) — added `seed` script.
- `README.md` — added seeding, data-rules, and collections sections.
- `PROJECT_PROGRESS.md` — this update.

### 5. Architecture followed

Implements §3 (User, LeaveApplication, Notification, AcademicCalendarEvent,
InstitutionSettings, optional AuditLog), §3.8 status lifecycle, and the Stage 2
data-validation list. Confirmed policy is encoded: weekends/holidays count
toward leave days (`requestedPolicyDays == requestedCalendarDays`).

### 6. Testing and verification

- **PASS** — `npm run seed`: created admin `admin@institution.local` +
  InstitutionSettings + demo students/teachers; database
  `online_leave_management` materialized with collections.
- **PASS** — 25/25 automated checks in a verification script:
  - collections created; admin + demo student present;
  - `passwordHash` excluded from `toJSON` and not loaded by default;
  - duplicate email rejected (`11000`); duplicate studentId rejected (`11000`);
  - student without `studentId` rejected; teacher without `designation` rejected;
  - `endDate < startDate` rejected; whitespace-only purpose rejected;
  - `Rejected` without `rejectionReason` rejected;
  - valid leave saved with server-generated ID, defaults to `Pending`;
  - application ID unique across 5 generations;
  - inclusive day count (same day / month / year / leap-Feb), weekend detection,
    enumerate, timezone "today", display formatting.
- **PASS** — `npm audit` (server): 0 vulnerabilities.
- **NOT TESTED** — indexes under production concurrency (covered later by
  integration/E2E tests in Stage 12).

### 7. Issues and limitations

- None blocking. Demo records are clearly marked (`@demo.local`) and only
  created when `SEED_DEMO_DATA=true`.
- The empty `leaveapplications` and `notifications` collections exist but hold
  no records yet (created on first write in later stages).
- Auto-indexing is enabled (development default); production index strategy is
  documented as a Stage 13 concern.

### 8. Stage completion status

COMPLETED AND VERIFIED.

### 9. Next stage

**Stage 3 — Authentication, Sessions, and Role-Based Access Control.** (Not
started; awaiting instruction.)

### 10. How to run or verify

```bash
npm run seed     # provision first admin + demo data (idempotent)
```

Admin login: `admin@institution.local` / `Admin@12345` (username `admin`).
Demo student: `student1@demo.local` / `Demo@12345`. All seeded accounts have
`mustChangePassword = true`.

---

## Stage 3 — Authentication, Sessions, and Role-Based Access Control

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Implement secure sign-in/sign-out, session management, role-based access
control, and the frontend guard/redirect flow so only authenticated, active
users reach the application.

### 2. What was implemented

- Server-side sessions stored in MongoDB (`express-session` + `connect-mongo`,
  `sessions` collection) delivered via an **HttpOnly** cookie (`olm.sid`,
  `SameSite=Lax`, `Secure` in production).
- Credential login by email **or** username with bcrypt verification; generic
  `INVALID_CREDENTIALS` for unknown users / bad passwords; inactive accounts
  are blocked only after the correct password is supplied (so account existence
  is not leaked).
- Session regeneration on login (prevents session fixation) and full session
  destruction on logout; cookies cleared.
- CSRF protection: double-submit token in a readable `csrfToken` cookie that
  must be echoed in the `X-CSRF-Token` header on state-changing requests
  (verified against the token stored in the session). Login is exempt.
- `authenticate` middleware re-loads the user on every request and rejects
  deleted/deactivated accounts immediately. `authorizeRole(...roles)` guard for
  RBAC. `express-rate-limit` login limiter (10 / 15 min) with the standard error
  shape.
- `trust proxy` made configurable (`TRUST_PROXY`, default 1 hop) so proxied
  requests and rate limiting behave correctly.
- Password change endpoint (`POST /auth/change-password`) enforcing a minimum
  length and clearing `mustChangePassword`.
- Frontend: `AuthProvider` (session bootstrap via `/auth/me`), role-aware
  `ProtectedRoute`, login page, forced first-login change-password page,
  role dashboards (`/admin`, `/student`, `/teacher`), root redirect, global
  401 handling, and a small `FullPageSpinner`.

### 3. Files created (Stage 3)

Server:
- `server/src/middleware/csrf.js` — token issue + double-submit verification.
- `server/src/middleware/authenticate.js` — session → user resolution.
- `server/src/middleware/authorizeRole.js` — role guard.
- `server/src/middleware/rateLimiters.js` — generic limiter + login limiter.
- `server/src/services/auth.service.js` — credential validation, last-login,
  password change.
- `server/src/controllers/auth.controller.js` — login / me / logout /
  change-password handlers.
- `server/src/routes/auth.routes.js` — `/api/v1/auth/*` routes.

Client:
- `client/src/features/auth/AuthContext.jsx` — auth provider + `useAuth`.
- `client/src/routes/ProtectedRoute.jsx` — guard + redirects.
- `client/src/routes/roleHome.js` — role → home path / label maps.
- `client/src/components/FullPageSpinner.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/ChangePasswordPage.jsx`
- `client/src/pages/DashboardPage.jsx`

### 4. Files modified (Stage 3)

- `server/src/config/env.js` — session/CSRF/cookie/`trust proxy` settings with
  validation.
- `server/src/app.js` — cookie-parser, session store, CSRF middleware,
  `trust proxy`.
- `server/src/routes/index.js` — mounted `/auth`.
- `server/package.json` — added `express-session`, `connect-mongo`,
  `cookie-parser`, `express-rate-limit`.
- `server/.env` / `server/.env.example` — session + cookie + `TRUST_PROXY`.
- `client/src/services/apiClient.js` — CSRF header injection + 401 broadcaster.
- `client/src/App.jsx` — wrapped the app in `AuthProvider`.
- `client/src/routes/AppRouter.jsx` — public + protected routes.
- `client/src/pages/HomePage.jsx` — **deleted** (replaced by role routing).
- `PROJECT_PROGRESS.md` — this update.

### 5. Architecture followed

Implements §4 (auth endpoints, RBAC, session auth, CSRF, generic auth errors,
rate limiting, forced password change) and the Stage 3 deliverables. Role-based
dashboard redirects match the three roles. `admin` bypasses leave ownership
checks (used from Stage 5 onward).

### 6. Testing and verification

- **PASS** — Backend auth suite: **31 passed, 0 failed** — anonymous `/me` 401
  (and no session/CSRF cookie created for anonymous visitors); wrong
  password / unknown user → 401 `INVALID_CREDENTIALS`; missing fields → 400;
  admin login 200 (no `passwordHash`); session cookie **HttpOnly**, CSRF cookie
  readable; logout without/with wrong CSRF → 403 `CSRF_INVALID`; valid logout
  → 200 then `/me` 401; password change (wrong current / too short / same)
  rejected, success clears `mustChangePassword` and persists the new hash;
  inactive account → 403 `ACCOUNT_INACTIVE`; `authorizeRole` allows/denies
  correctly; rate limiter returns 429 in the documented shape.
- **PASS** — Full-stack integration via the Vite proxy: **8 passed, 0 failed**
  — SPA served, anonymous `/auth/me` 401, login 200 with session + CSRF cookies
  forwarded, authenticated `/auth/me` 200, logout with CSRF header 200, `/me`
  401 afterward.
- **PASS** — Frontend production build (`vite build`): 1599 modules, built
  successfully.
- **PASS** — `npm audit` (server and client): 0 vulnerabilities.
- **NOT TESTED** — browser-level redirect/guard behavior (no headless browser
  in this environment); verified at the HTTP + build + code level.

### 7. Issues and limitations

- Found and fixed during verification: `issueCsrfToken` was creating sessions
  for anonymous users; cookie fallback weakened CSRF; and
  `express-rate-limit` rejected `X-Forwarded-For` under the default
  `trust proxy` (now configurable). All resolved and re-verified.
- Session TTL defaults to 7 days (`SESSION_TTL_HOURS`); a sliding-expiration
  refresh policy is not enabled.
- Password policy is a length check (≥ 8) plus "must differ from current";
  stronger complexity rules can be added if required.

### 8. Stage completion status

COMPLETED AND VERIFIED.

### 9. Next stage

**Stage 4 — User Management and Administrative Functions.** (Not started;
awaiting instruction.)

### 10. How to run or verify

```bash
npm run dev    # starts API (:5000) + client (:5173)
```

Open http://localhost:5173 → redirected to `/login`. Sign in with
`admin` / `Admin@12345` → forced to `/change-password` (seeded accounts have
`mustChangePassword = true`) → after changing, land on `/admin`.
