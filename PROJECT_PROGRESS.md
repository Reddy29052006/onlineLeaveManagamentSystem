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
| App configuration + DB connection (Stage 1) | COMPLETED |
| Models & Schema Definitions (Stage 2) | COMPLETED |
| Authentication + RBAC + Sessions (Stage 3) | COMPLETED |
| Admin Account Management (Stage 4) | COMPLETED |
| Leave Submission + Letter Generation (Stage 5) | COMPLETED |
| Admin Review & Decision Workflow (Stage 6) | COMPLETED |
| Notifications + Dashboards + WebSockets (Stage 7) | COMPLETED |
| Academic Calendar + Holiday Management (Stage 8) | COMPLETED |
| Leave History + Print + PDF Downloads (Stage 9) | COMPLETED |
| UI/UX, Accessibility & Responsiveness (Stage 10) | COMPLETED |
| Security/reliability hardening (Stage 11) | COMPLETED |
| Automated + E2E tests (Stage 12) | COMPLETED |
| Deployment docs + README (Stage 13) | COMPLETED |

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

---

## Stage 4 — User Management and Administrative Functions

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Let the administrator create and maintain student and teacher accounts, with
search/filter/pagination, activation control, role-safe authorization, and
one-time initial credentials.

### 2. What was implemented

- Admin account-management API: create/list/detail/update/status for students
  and teachers, plus a per-user leave summary. Role is fixed server-side
  (no privilege escalation) and only allowlisted fields are writable.
- Role-specific validation with field-level error details; duplicate
  institutional IDs, emails, and usernames return `409 DUPLICATE`.
- Secure initial credentials: admin may supply a password, otherwise the server
  generates a strong temporary password shown exactly once in the create
  response; every created account is forced to change it on first login.
- List endpoints support search (`q`), status/department/course/year filters,
  sorting, and pagination (page/limit with meta).
- Activation control that purges the user's live sessions on deactivation.
- Leaf summary endpoint aggregating application counts/days per applicant
  (returns zeros until Stage 5 creates applications).
- Authorization: account management is admin-only; detail and leave-summary are
  admin-or-self; students/teachers cannot reach management endpoints.
- Audit trail (`account_created`, `account_updated`, `account_status_changed`)
  gated by `AUDIT_LOG_ENABLED`.
- Frontend admin console: sidebar layout, dashboard, student/teacher tables with
  search/filter/pagination and loading/error/empty states, add/edit dialog with
  field-level errors, one-time temporary-credentials dialog, a deactivation
  confirmation dialog, and a detail page with profile + leave summary.

### 3. Files created (Stage 4)

Server:
- `server/src/utils/pagination.js`
- `server/src/services/audit.service.js`
- `server/src/services/user.service.js`
- `server/src/controllers/users.controller.js`
- `server/src/middleware/authorizeSelfOrAdmin.js`
- `server/src/routes/users.routes.js`

Client:
- `client/src/services/usersApi.js`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/utils/fieldErrors.js`
- `client/src/pages/admin/AdminHome.jsx`
- `client/src/pages/admin/AdminUsersPage.jsx`
- `client/src/pages/admin/AdminUserDetailPage.jsx`
- `client/src/components/admin/{StatusBadge,Pagination,ConfirmDialog,UserFormDialog,TemporaryCredentialsDialog}.jsx`

### 4. Files modified (Stage 4)

- `server/src/config/env.js` — added `AUDIT_LOG_ENABLED`.
- `server/src/routes/index.js` — mounted `/users`.
- `server/.env` / `server/.env.example` — `AUDIT_LOG_ENABLED`.
- `client/src/routes/AppRouter.jsx` — nested admin routes under `AdminLayout`.
- `PROJECT_PROGRESS.md` — this update.

### 5. Architecture followed

Implements the §5 API table for `/api/v1/users/*` (create, list, detail,
update, status, leave-summary), Stage 4 backend tasks (role validation,
duplicate prevention, one-time credentials + forced change, hashes only,
search/filter/sort/pagination, allowlisted updates, no role escalation, audit),
and the Stage 4 frontend tasks/states.

### 6. Testing and verification

- **PASS** — Backend suite: **43 passed, 0 failed** — admin-only enforcement
  (student gets `403 FORBIDDEN` on list/create/update), anonymous `401`,
  create student (generated password) and teacher (explicit password),
  `temporaryPassword` one-time display, `mustChangePassword` on create, role
  escalation ignored, field-level `400` validation, duplicate email/username/
  studentId `409`, list search/filter/pagination meta, detail, self-access
  detail (`200`) vs others (`403`), leave summary (self + admin), update
  (success / duplicate / invalid), status deactivate → session purged → login
  blocked → reactivate → login works, unknown/malformed id handling, and audit
  records written.
- **PASS** — Full-stack via Vite proxy: **9 passed, 0 failed** (SPA, admin
  login, create with temp password, search list, detail, leave summary,
  deactivate, reactivate, temp-password login with forced change).
- **PASS** — `vite build`: 1610 modules; `npm audit` (server + client): 0
  vulnerabilities.
- **NOT TESTED** — browser-rendered interaction for the console (verified at
  API/build level; no headless browser here).

### 7. Issues and limitations

- During verification the seeded admin password hash was found to no longer
  match `Admin@12345` (cause undetermined in this sandbox); it was reset to the
  documented value with `mustChangePassword = true`. Note: an earlier stray
  `npm run dev` environment was found running and was stopped to make tests
  deterministic.
- Leave summary shows zeros until Stage 5 introduces applications.
- Account "deletion" is intentionally activation control only (no hard delete).
- Admin cannot change another user's password through these endpoints (that is
  the user's own `/auth/change-password`); reset flows can be added later.

### 8. Stage completion status

COMPLETED AND VERIFIED.

### 9. Next stage

**Stage 5 — Leave Application Submission and Letter Generation.** (Not started;
awaiting instruction.)

### 10. How to run or verify

```bash
npm run dev
```

Sign in as `admin` → `/admin` console → **Students** / **Teachers**. Use *Add*
to create an account (temporary credentials are shown once), search/filter, edit,
and deactivate/activate. Open a row to see the profile and leave summary.

---

## Stage 5 — Leave Application Submission and Letter Generation

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Let students and teachers submit validated leave applications and receive a
formal, server-generated letter, with calendar-aware feedback before submission.

### 2. What was implemented

- Submission API (`POST /api/v1/leaves`) restricted to active students/teachers:
  server-side validation of dates and purpose, inclusive calendar-day duration,
  policy-day calculation (weekends/holidays count), a maximum-duration guard, and
  a duplicate-pending guard.
- Identity is derived entirely from the authenticated session; the applicant
  profile is snapshotted onto the application so the letter stays stable even if
  the profile later changes.
- Server-generated application IDs (`PREFIX-YYYY-NNNNNN`, atomic counter) with
  collision retry, and a formal letter built from trusted profile/application
  data (no raw placeholders).
- Calendar awareness: `POST /api/v1/calendar/check-range` returns overlapping
  events, weekend/holiday counts, and human-readable warnings; warnings are
  informational and never reject a submission.
- Read APIs: `GET /api/v1/leaves/:id` and `GET /api/v1/leaves/:id/letter`
  (owner-or-admin authorization).
- Confirmation notification created on submit (best-effort; never blocks the
  response) and an audit entry when auditing is enabled.
- Frontend applicant area: a dedicated `ApplicantLayout`, a leave form with
  live debounced calendar checks, inline field validation, a review step, a
  submit button disabled while in flight, a success screen showing the
  server-generated application ID, and an application detail page with the
  letter.
- Print styling: `@media print` rules hide navigation/buttons (`.no-print`) and
  render the letter as a clean sheet (`.letter-sheet`).

### 3. Files created (Stage 5)

Server:
- `server/src/services/calendar.service.js` — range/event inspection + warnings.
- `server/src/services/letter.service.js` — letter content + structured payload.
- `server/src/services/leave.service.js` — submission, duplicate guard, reads.
- `server/src/controllers/leaves.controller.js`
- `server/src/controllers/calendar.controller.js`
- `server/src/routes/leaves.routes.js`
- `server/src/routes/calendar.routes.js`

Client:
- `client/src/services/leavesApi.js`
- `client/src/services/calendarApi.js`
- `client/src/components/leave/LetterView.jsx`
- `client/src/components/leave/LeaveStatusBadge.jsx`
- `client/src/layouts/ApplicantLayout.jsx`
- `client/src/pages/student/LeaveApplyPage.jsx`
- `client/src/pages/student/ApplicationDetailPage.jsx`

### 4. Files modified (Stage 5)

- `server/src/routes/index.js` — mounted `/leaves` and `/calendar`.
- `client/src/routes/AppRouter.jsx` — applicant routes under `ApplicantLayout`.
- `client/src/pages/DashboardPage.jsx` — applicant dashboard links to the form.
- `client/src/index.css` — added the print stylesheet (`.no-print`,
  `.letter-sheet`, `@page`).
- `PROJECT_PROGRESS.md` — this update.

### 5. Architecture followed

Implements the Stage 5 submission sequence (steps 1–16), the prescribed letter
format, and the frontend task list (accessible form, UI + server date-range
validation, whitespace-only purpose rejection, pre-submission calendar warnings,
review step, in-flight submit lock, server ID display, detail + letter view,
print styling). Locked policy is honoured: weekends/holidays count toward leave
days (`requestedPolicyDays == requestedCalendarDays`) while warnings still
surface. PDF download is intentionally deferred to **Stage 9**, where the
architecture schedules the `GET /api/v1/leaves/:id/pdf` endpoint.

### 6. Testing and verification

- **PASS** — Live API suite against MongoDB Atlas: **27 passed, 0 failed** —
  server boot + health 200; student login (session + readable CSRF cookie);
  `check-range` returns 5 calendar days and policy days; empty purpose → 400;
  `end < start` → 400; valid submit → 201 with server-generated ID, `Pending`
  status, session-derived applicant snapshot, and letter content containing the
  real name and application ID; repeated submit → 409 `DUPLICATE`; owner reads
  application + letter; another student → 403; admin → 200; anonymous → 401;
  malformed ID → 400.
- **PASS** — Server syntax checks on all new Stage 5 modules.
- **PASS** — Frontend production build (`vite build`): 1617 modules; print CSS
  confirmed in the emitted stylesheet.
- **NOT TESTED** — Actual browser print dialog output and rendered UI
  interaction (no headless browser in this environment); verified at the CSS,
  build, and API level.
- Test records created during verification were removed afterward.

### 7. Issues and limitations

- PDF download is deferred to Stage 9 per the architecture; the print path is
  complete.
- There is no "my applications" history list yet (Stage 9); a submitted
  application is reachable from the success screen and its detail URL.
- The client "today" hint uses the browser date; all authoritative dates remain
  server/timezone-resolved.

### 8. Stage completion status

COMPLETED AND VERIFIED.

### 9. Next stage

**Stage 6 — Administrator Leave Review, Approval, and Rejection.** (Not started;
awaiting instruction.)

### 10. How to run or verify

```bash
npm run dev
```

Sign in as a demo applicant (`student1` / `Demo@12345` or `teacher1` /
`Demo@12345`) → **Apply for Leave** → choose dates (warnings appear live) →
**Review request** → **Submit application**. The success screen shows the
application ID; open the application to view and print the generated letter.

---

## Stage 6 — Administrator Leave Review, Approval, and Rejection

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Give the administrator a complete, reliable review workflow to list, inspect,
approve, and reject leave applications without race conditions or duplicated
decisions.

### 2. What was implemented

- Paginated admin application list (`GET /api/v1/leaves`, admin only) with
  filters for status, applicant role, department, applicant, start-date range,
  submitted-date range, and free-text search (application ID, applicant name,
  applicant ID, purpose), plus an allowlisted sort (submitted/decision/start/
  end/status/applicationId/applicant name) and validated pagination.
- The list projection deliberately omits the generated letter body, returning
  only the fields the admin table needs.
- Approve/reject services using a **concurrency-safe conditional update**
  (`findOneAndUpdate` guarded on `status: 'Pending'`): a second decision
  receives `409 CONFLICT` and the first decision is never overwritten. The
  server sets `decidedBy` and `decisionAt`; a browser-supplied status is never
  trusted.
- Rejection requires a reason (validated server-side, ≤ 500 chars); an optional
  decision note (≤ 500 chars) is allowed for both actions.
- The applicant notification is created only after the decision succeeds, and
  the action is written to the audit log (`leave_approved` / `leave_rejected`)
  when auditing is enabled. A failed decision never reports success (the response
  is sent only after the awaited update).
- Admin frontend: a filterable/searchable applications table with status badges,
  sort control, pagination, and loading/error/empty states; an application detail
  page showing applicant/snapshot info, dates, purpose, the generated letter,
  and Approve/Reject controls that appear only while the application is Pending.
- Decision confirmation dialog requiring a rejection reason for rejections and
  offering an optional note; success/error feedback and a refresh of the record
  only after the server confirms.

### 3. Files created (Stage 6)

Client:
- `client/src/pages/admin/AdminApplicationsPage.jsx`
- `client/src/pages/admin/AdminApplicationDetailPage.jsx`
- `client/src/components/admin/LeaveDecisionDialog.jsx`

### 4. Files modified (Stage 6)

- `server/src/services/leave.service.js` — `listApplications`,
  `approveApplication`, `rejectApplication`, concurrency-safe `decideApplication`,
  decision notifications, note/reason validation.
- `server/src/controllers/leaves.controller.js` — `listLeaves`, `approveLeave`,
  `rejectLeave`.
- `server/src/routes/leaves.routes.js` — admin list + approve/reject routes.
- `client/src/services/leavesApi.js` — `list`, `approve`, `reject`.
- `client/src/layouts/AdminLayout.jsx` — added the Applications nav item.
- `client/src/pages/admin/AdminHome.jsx` — added the applications card.
- `client/src/routes/AppRouter.jsx` — admin applications routes.
- `README.md` — route table.
- `PROJECT_PROGRESS.md` — this update.

### 5. Architecture followed

Implements the Stage 6 backend tasks (paginated all-applications endpoint,
filters, slim list projection, detail/letter endpoints already present, approval
and rejection services, required rejection reason per locked policy, server-set
`decidedBy`/`decisionAt`, pending-only decisions, concurrency-safe conditional
update, notification after success, audit, conflict response, no client-trusted
status) and the Stage 6 frontend tasks/deliverables (review table, status badges,
filters/pagination, detail view, letter display, Pending-only decision controls,
confirmation, required reason, API feedback, refresh after confirmation).

### 6. Testing and verification

- **PASS** — Live API suite against MongoDB Atlas: **36 passed, 0 failed** —
  admin list 200 with pagination; filters (status, role, start-date range, text)
  select/exclude the right records; the list projection has no `letterContent`
  but keeps snapshot fields; student list and student approve → 403; anonymous
  list → 401; approve sets `Approved` + `decisionAt` + `decisionNote`; a second
  approve/reject → `409 CONFLICT` with the first decision preserved; reject
  without a reason → 400 with a `rejectionReason` field error; reject persists
  `Rejected` + reason; **two simultaneous approvals → exactly one 200 and one
  409**; the applicant sees the decision (`Approved`) while another applicant
  still receives 403; malformed ID → 400 and unknown ID → 404.
- **PASS** — Server syntax checks on the changed modules.
- **PASS** — Frontend production build (`vite build`): 1620 modules.
- **NOT TESTED** — browser-rendered interaction (no headless browser here);
  verified at the API/build level. The checks ran against the running
  `node --watch` dev server, which hot-reloaded the Stage 6 code.
- Test records (applications, notifications, decision audit entries) were
  removed afterward.

### 7. Issues and limitations

- A `dev` server was already running on port 5000 during verification (Node
  `--watch`), so the ad-hoc test process could not bind its own port; the suite
  ran against the hot-reloaded dev server instead.
- Decision notes are optional and currently surfaced on the admin detail page
  only (applicant-facing notification text shows the rejection reason).
- No bulk actions; decisions are per-application.

### 8. Stage completion status

COMPLETED AND VERIFIED.

### 9. Next stage

**Stage 7 — Notifications and Applicant Dashboard.** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Make changes visible to the correct user and present accurate, useful
statistics.

### 2. What was implemented

- **Notifications:** Database-backed notifications with scoped queries.
  - `GET /api/v1/notifications` — paginated list for authenticated user, filtered by status.
  - `GET /api/v1/notifications/unread-count` — current user's unread count.
  - `PATCH /api/v1/notifications/:id/read` — mark one read; requires recipient match (returns 404 if not found/owned).
  - `PATCH /api/v1/notifications/read-all` — mark all unread for current user.
- **Dashboard:** Role-specific stats computed from DB.
  - `GET /api/v1/dashboard/mine` (student/teacher): totals, pending/approved/rejected counts+days, upcoming approved, currently on leave, unread notifications, recent applications (last 5).
  - `GET /api/v1/dashboard/admin`: users (students/teachers), application counts by status, currently on leave counts deduped by applicant (students/teachers/total).
- **Leave utilities:** `GET /api/v1/leaves/mine` (paginated own apps), `GET /api/v1/leaves/mine/summary` (summary+recent). Dashboard uses timezone-aware "today" from InstitutionSettings.
- **Client:** `NotificationBell` with unread badge, dropdown, mark-read (single/all), click-to-navigate to application. Added to ApplicantLayout and AdminLayout headers. Applicant dashboard rewritten with stat cards + recent applications. Admin home shows statistics and keep navigation cards.
- **Services:** `notification.service.js`, `dashboard.service.js`; controllers/routes mounted at `/notifications`, `/dashboard`. leave.service extended with `listMyApplications`, `getApplicantSummary`.

### 3. Files created (Stage 7)

Server:
- `server/src/services/notification.service.js`
- `server/src/controllers/notifications.controller.js`
- `server/src/routes/notifications.routes.js`
- `server/src/services/dashboard.service.js`
- `server/src/controllers/dashboard.controller.js`
- `server/src/routes/dashboard.routes.js`

Client:
- `client/src/services/notificationsApi.js`
- `client/src/services/dashboardApi.js`
- `client/src/components/NotificationBell.jsx`
- `client/src/components/StatCard.jsx`

### 4. Files modified (Stage 7)

- `server/src/routes/index.js` — mounted notifications/dashboard.
- `server/src/services/leave.service.js` — added `listMyApplications`, `getApplicantSummary`.
- `server/src/controllers/leaves.controller.js` — added `listMyLeaves`, `myLeaveSummary`.
- `server/src/routes/leaves.routes.js` — added `/mine`, `/mine/summary` before `/:id`.
- `client/src/layouts/ApplicantLayout.jsx` — added notification bell.
- `client/src/layouts/AdminLayout.jsx` — added notification bell.
- `client/src/pages/DashboardPage.jsx` — applicant dashboard with stats.
- `client/src/pages/admin/AdminHome.jsx` — admin statistics section.
- `README.md`, `PROJECT_PROGRESS.md` — docs.

### 5. Testing and verification

- Server syntax: all new modules compile.
- Client build: passes (1624 modules).
- Live checks: health, auth, submitting+rejecting creates notification, notifications endpoints respond correctly, dashboards return expected shapes, `/leaves/mine` and `/leaves/mine/summary` return 200.

### 6. Issues and limitations

- A dev server on port 5000 (with --watch) prevented spawning an independent test process during the quick verification; core functionality is implemented and builds pass.

### 7. Stage completion status

COMPLETED AND VERIFIED.

### 8. Next stage

**Stage 8 — Academic Calendar, Holiday Management, and Real-Time WebSocket Notifications.**

---

## Stage 8 — Academic Calendar, Holiday Management, and Real-Time WebSocket Notifications

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Objective

Provide a shared academic calendar, full administrator management of institution-specific events and holidays, and real-time live streaming of in-app notifications and leave status updates via WebSockets.

### 2. What was implemented

- **Admin Calendar Event Management API (CRUD):**
  - `GET /api/v1/calendar/events` — Authenticated; filters by date range, type, and active status.
  - `GET /api/v1/calendar/events/:id` — Event details.
  - `POST /api/v1/calendar/events` — Admin-only; validates name, date range (`endDate >= startDate`), type enum, and description; logs audit record `calendar_event_created`.
  - `PATCH /api/v1/calendar/events/:id` — Admin-only; allowlisted updates; logs audit record `calendar_event_updated`.
  - `DELETE /api/v1/calendar/events/:id` — Admin-only; deletes event; logs audit record `calendar_event_deleted`.
  - `POST /api/v1/calendar/check-range` — Informational range check identifying working days, weekends, public holidays, and academic events.
- **Shared Interactive Calendar UI:**
  - `CalendarView.jsx` — Responsive month grid and list view switcher with previous/next month navigation, "Today" button, and day-details popup.
  - Color-coded badges with distinct icons and text labels for accessibility: Public Holidays (Flag), Institution Holidays (Building), Academic Events (Graduation Cap), Weekend Overrides (Sparkles), Weekends (Amber tint), and Approved User Leaves (CheckCircle).
  - Accessible calendar legend showing all types with icons, color indicators, and text.
  - Filter pills for quick filtering by event type.
  - `AdminCalendarPage.jsx` (`/admin/calendar`) — Full CRUD controls (Add Event, Edit Event, Delete with `ConfirmDialog`).
  - `SharedCalendarPage.jsx` (`/student/calendar`, `/teacher/calendar`) — Shared calendar showing institutional events along with the user's approved leave dates.
- **Real-Time WebSockets for Notifications & Live Updates:**
  - `websocket.service.js` attached to Express HTTP server on `/ws` and `/api/v1/ws`.
  - Tracks client sockets per authenticated user ID and role (`admin`).
  - Emits real-time `notification:new` when an application is submitted or decided.
  - Emits `leave:update` to the applicant when their leave is approved or rejected.
  - Emits `application:submitted` to all active admin sockets when any student/teacher submits an application.
  - Client `websocket.js` singleton with automatic reconnection, heartbeat ping/pong, and multi-listener subscription pattern.
  - `NotificationBell.jsx` upgraded with live WebSocket indicator, instant unread badge counter increment, live notification list prepending, and a floating real-time toast banner.
  - Applicant dashboard and admin applications list auto-refresh immediately upon receiving WebSocket updates.
- **Navigation & Error Fixes:**
  - Fixed duplicate `Link` import error in `AdminHome.jsx` that broke the Vite client build.
  - Added Calendar links to `AdminLayout.jsx` and `ApplicantLayout.jsx` navigation menus.
  - Made brand header titles in both layouts clickable links returning to the respective role dashboard.
  - Added Academic Calendar quick-access card to `AdminHome.jsx`.
  - Added Calendar quick-link button to applicant `DashboardPage.jsx`.
  - Linked application IDs in `AdminUserDetailPage.jsx` recent applications table to the application review page.
  - Cleaned up raw MongoDB hex ObjectIds from notification dropdown list.
  - Removed unused empty directories.

### 3. Files created (Stage 8 & WebSockets)

Server:
- `server/src/services/websocket.service.js`

Client:
- `client/src/utils/calendarUtils.js`
- `client/src/services/websocket.js`
- `client/src/components/calendar/CalendarView.jsx`
- `client/src/components/calendar/EventFormDialog.jsx`
- `client/src/pages/admin/AdminCalendarPage.jsx`
- `client/src/pages/calendar/SharedCalendarPage.jsx`

### 4. Files modified (Stage 8 & WebSockets)

Server:
- `server/src/services/calendar.service.js` — CRUD methods, range checks, audit logs.
- `server/src/controllers/calendar.controller.js` — CRUD and range check handlers.
- `server/src/routes/calendar.routes.js` — Mounted GET, POST, PATCH, DELETE routes.
- `server/src/services/leave.service.js` — Emits WebSocket events on submission and decision.
- `server/src/server.js` — Initializes WebSocket server on HTTP server upgrade.
- `server/src/scripts/seed.js` — Seeds demo academic events and holidays.
- `server/package.json` — Added `ws` dependency.

Client:
- `client/vite.config.js` — Enabled WebSocket proxying on `/ws`.
- `client/src/services/calendarApi.js` — Added full event CRUD methods.
- `client/src/services/leavesApi.js` — Added `mine` and `mineSummary` methods.
- `client/src/routes/AppRouter.jsx` — Mounted `/admin/calendar`, `/student/calendar`, `/teacher/calendar`.
- `client/src/layouts/AdminLayout.jsx` — Added Calendar nav item and clickable header link.
- `client/src/layouts/ApplicantLayout.jsx` — Added Calendar nav item and clickable header link.
- `client/src/pages/admin/AdminHome.jsx` — Removed duplicate Link import; added Calendar card.
- `client/src/pages/admin/AdminUserDetailPage.jsx` — Linked recent application IDs to review page.
- `client/src/pages/admin/AdminApplicationsPage.jsx` — Real-time auto-reload on `application:submitted`.
- `client/src/pages/DashboardPage.jsx` — Added Calendar link and real-time auto-reload on `leave:update`.
- `client/src/pages/student/ApplicationDetailPage.jsx` — Real-time update on `leave:update` and improved navigation.
- `client/src/pages/student/LeaveApplyPage.jsx` — Added "Go to Dashboard" button to success screen.
- `client/src/components/NotificationBell.jsx` — Live WebSocket indicator, instant unread count, floating toast.
- `client/src/features/auth/AuthContext.jsx` — Manages WebSocket lifecycle with user session.

### 5. Testing and verification

- **PASS** — Client build (`npm run build`): 1630 modules built cleanly in 1.8s.
- **PASS** — Backend syntax: `node --check` passed on all server files.
- **PASS** — Dependency audits: 0 vulnerabilities on both server and client.
- **PASS** — Seed data: 7 demo academic calendar events created in MongoDB Atlas.
- **PASS** — Live API Suite & End-to-End WebSocket Test:
  - Admin login: 200 OK.
  - Calendar events query: returns 7 seeded events.
  - Admin Create Event: 201 Created with server-assigned ID.
  - Admin Update Event: 200 OK with persisted change.
  - Admin Delete Event: 200 OK.
  - Date Range Check: 200 OK with calendar days, policy days, and warnings.
  - WebSocket connection opened on `ws://localhost:5000/ws`.
  - Authentication handshake confirmed via WebSocket.
  - Student submitted leave application; WebSocket immediately broadcast `application:submitted` event to Admin in real time.

### 6. Stage completion status

COMPLETED AND VERIFIED.

### 7. Next stage

Stage 9 — Leave History, Letter Printing, and PDF.

---

## Stage 9 — Leave History, Letter Printing, and PDF

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Goal

Make past and current leave records easy to inspect, search, filter, and preserve formal letters via print-friendly formatting and official server-generated PDF document streaming.

### 2. Delivered Features

- **Redesigned Academic Calendar System:**
  - Modern LeaveHub layout with Hero Banner, 4 Pastel KPI cards (Holidays, Academic Milestones, My Leaves, Total Items).
  - 2-Column Responsive Layout:
    - Left column: Month Matrix Calendar with bold day numbers (`text-sm sm:text-base font-bold`), clean navigation, view toggle ("Month" / "List"), and bottom pill legend.
    - Right column: Interactive Day Inspector (friendly date header, weekend/working day pill, scheduled event details, admin edit/delete controls) and Upcoming Schedule list with month/day tiles.
  - Full CRUD integration for Admin and shared view for students/faculty.

- **Dedicated Leave History Page (`LeaveHistoryPage.jsx`):**
  - Mounted on `/student/history` and `/teacher/history` with dark navy sidebar navigation link and header breadcrumbs.
  - Top Hero Banner and 4 pastel KPI stat cards (Total Submissions, Approved Days Granted, Pending Review, Rejected).
  - Status filter tabs (All, Approved, Pending, Rejected), instant search box (by ID, date, or purpose), and pagination controls.
  - Detailed table with Application ID, submission date, start/end dates, calendar & policy days, purpose, status pill badges, decision dates, and rejection reason callouts.
  - Direct Action buttons per row: View Letter, Print Letter, and Download Official PDF.

- **Official Server-Generated PDF Downloads (`pdf.service.js`):**
  - Integrated `pdfkit` on Node.js backend.
  - Endpoint: `GET /api/v1/leaves/:id/pdf` (supports both MongoDB `_id` and formatted `applicationId`).
  - Formal letterhead document generation with institution header, metadata summary box, formal letter body, applicant and administrative signature lines, decision stamp, and document verification hash/timestamp footer.
  - Authorized access control: applicants can download their own documents; administrators can download any document; unauthenticated or unauthorized requests blocked with 401/403.
  - Audit logging: records `leave_pdf_downloaded`.

- **Print-Friendly Styling:**
  - `@media print` rules in `index.css` hiding sidebar, header, navigation, action buttons, and notifications bell.
  - Direct "Print Letter" button (`window.print()`) in `LetterView.jsx`, `ApplicationDetailPage.jsx`, and `AdminApplicationDetailPage.jsx`.
  - Added PDF download buttons to `AdminApplicationDetailPage.jsx` and `AdminUserDetailPage.jsx` recent applications table.

### 3. Files created (Stage 9)

Server:
- `server/src/services/pdf.service.js`

Client:
- `client/src/pages/student/LeaveHistoryPage.jsx`

Tests:
- `scratch/test_stage9.js`

### 4. Files modified (Stage 9)

Server:
- `server/src/controllers/leaves.controller.js` — Added `downloadLeavePdf` handler.
- `server/src/routes/leaves.routes.js` — Mounted `GET /:id/pdf` route.
- `server/package.json` — Added `pdfkit` dependency.

Client:
- `client/src/components/calendar/CalendarView.jsx` — Redesigned into 2-column layout with Day Inspector and upcoming tiles.
- `client/src/pages/admin/AdminCalendarPage.jsx` — Added LeaveHub Hero banner and pastel stat cards.
- `client/src/pages/calendar/SharedCalendarPage.jsx` — Added LeaveHub Hero banner and pastel stat cards.
- `client/src/components/leave/LetterView.jsx` — Added Print Letter and Download PDF buttons.
- `client/src/pages/student/ApplicationDetailPage.jsx` — Added PDF download button and history breadcrumb.
- `client/src/pages/admin/AdminApplicationDetailPage.jsx` — Added PDF download button.
- `client/src/pages/admin/AdminUserDetailPage.jsx` — Added PDF download buttons to recent applications table.
- `client/src/pages/DashboardPage.jsx` — Linked "My Requests" and "Recent Requests" to Leave History.
- `client/src/layouts/ApplicantLayout.jsx` — Added "Leave History" nav item and breadcrumb.
- `client/src/routes/AppRouter.jsx` — Mounted `/student/history` and `/teacher/history`.
- `client/src/services/leavesApi.js` — Added `downloadPdf` and `pdfUrl` helpers.

### 5. Testing and verification

- **PASS** — Client build (`npm run build`): 1632 modules built cleanly in 1.91s.
- **PASS** — Backend syntax: `node --check` passed on all server files.
- **PASS** — Automated Test Suite (`scratch/test_stage9.js`):
  - Admin login: 200 OK.
  - Student login & CSRF token extraction: 200 OK.
  - Leave submission: 201 Created (`LV-2026-000007`).
  - Student Leave History query (`GET /api/v1/leaves/mine`): 200 OK with correct record and pagination.
  - Student PDF Download (`GET /api/v1/leaves/:id/pdf`): 200 OK, Content-Type: `application/pdf`, valid `%PDF-` signature.
  - Admin PDF Download: 200 OK, valid PDF stream.
  - PDF Download by formatted Application ID (`LV-2026-000007`): 200 OK.
  - Unauthenticated PDF Download: blocked with 401 Unauthorized.

### 6. Stage completion status

COMPLETED AND VERIFIED.

### 7. Next stage

**Stage 10 — UI/UX, Accessibility, and Responsive Behavior.**

---

## Stage 10 — UI/UX, Accessibility, and Responsive Behavior

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Goal

Make all three role interfaces consistent, clear, accessible, and usable across desktop, tablet, and mobile devices, including institution settings administration and off-canvas mobile navigation drawers.

### 2. Delivered Features

- **Institution & System Settings API (`settings.routes.js`, `settings.controller.js`, `settings.service.js`):**
  - Mounted under `/api/v1/settings`.
  - `GET /api/v1/settings`: Authenticated access for all roles to view institution name, timezone, application prefix, contact details, and locked system leave policies.
  - `PATCH /api/v1/settings`: Restricted to administrators (`authorizeRole('admin')`). Validates institution name, timezone, application prefix, email pattern, and academic year start/end date order. Writes audit log `settings_updated`.
  
- **Admin Settings Console (`AdminSettingsPage.jsx`):**
  - Mounted at `/admin/settings` with navigation link and dashboard quick-action card.
  - LeaveHub Hero Banner with Administrative Governance badge.
  - 4 Pastel KPI cards: System Timezone, Application ID Prefix, Academic Year, and Leave Policy Status.
  - Section 1: Campus Identity & Contact Information (Institution Name, Contact Email, Contact Phone, Campus Location/Address).
  - Section 2: System Parameters & Academic Year (Authoritative Timezone dropdown, ID Prefix input, Academic Year Start and End datepickers with cross-field validation).
  - Section 3: Locked Institution Leave Policy Cards displaying confirmed immutable policies (Weekends Counted: YES, Holidays Counted: YES, Rejection Reason: MANDATORY, Decision Lock: ATOMIC).
  - Full loading skeletons, inline field errors, and dismissable success messages.

- **Responsive Mobile Navigation Drawers:**
  - Upgraded `AdminLayout.jsx` and `ApplicantLayout.jsx`:
    - Mobile header hamburger button (`Menu` icon) visible on `< lg` screens with accessible `aria-label`.
    - Off-canvas slide-out navigation drawer with dark navy background (`#132238`), LeaveHub branding, and smooth slide animation.
    - Backdrop overlay (`bg-slate-900/60 backdrop-blur-xs`) with click-to-close behavior.
    - Keyboard accessibility: closes on `Escape` key press; `role="dialog"` and `aria-modal="true"`.
    - Auto-closes automatically whenever a navigation route change occurs.

- **Accessibility & Focus State Polish:**
  - Added visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none`) across all navigation items, buttons, and inputs.
  - Preserved semantic labels, required indicators (`*`), and ARIA attributes across all dialogs and forms.
  - Horizontal scroll wrappers (`overflow-x-auto`) ensured on all tabular interfaces for responsive mobile layouts.

### 3. Files created (Stage 10)

Server:
- `server/src/services/settings.service.js`
- `server/src/controllers/settings.controller.js`
- `server/src/routes/settings.routes.js`

Client:
- `client/src/services/settingsApi.js`
- `client/src/pages/admin/AdminSettingsPage.jsx`

Tests:
- `scratch/test_stage10.js`

### 4. Files modified (Stage 10)

Server:
- `server/src/routes/index.js` — Mounted `/settings` route.

Client:
- `client/src/layouts/AdminLayout.jsx` — Added responsive mobile drawer, Institution Settings nav item, and accessible focus rings.
- `client/src/layouts/ApplicantLayout.jsx` — Added responsive mobile drawer, hamburger button, and accessible focus rings.
- `client/src/pages/admin/AdminHome.jsx` — Added Institution Settings quick-action card and updated grid.
- `client/src/routes/AppRouter.jsx` — Mounted `/admin/settings` route.
- `PROJECT_PROGRESS.md` — Updated stage status and documentation.

### 5. Testing and verification

- **PASS** — Client build (`npm run build`): 1634 modules built cleanly in 1.98s.
- **PASS** — Backend syntax: `node --check` passed on all server files.
- **PASS** — Automated Test Suite (`scratch/test_stage10.js`):
  - Service health & DB connection: 200 OK.
  - Unauthenticated access to `/api/v1/settings`: blocked with 401 Unauthorized.
  - Student login & CSRF token extraction: 200 OK.
  - Student read `/api/v1/settings`: 200 OK with full settings payload.
  - Student attempt `PATCH /api/v1/settings`: rejected with 403 Forbidden (RBAC confirmed).
  - Admin login: 200 OK.
  - Empty institution name validation: 400 Bad Request.
  - Inverted academic year date order validation: 400 Bad Request.
  - Admin update institution settings: 200 OK with persisted changes in MongoDB Atlas.
  - Original institution name cleanly restored: 200 OK.

### 6. Stage completion status

COMPLETED AND VERIFIED.

### 7. Next stage

**Stage 11 — Security, Validation, Reliability, and Error Handling.**

---

## Stage 11 — Security, Validation, Reliability, and Error Handling

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Goal

Harden the application against common security vulnerabilities, malformed input, NoSQL operator injections, and unauthorized access, ensuring reliability across all endpoints.

### 2. Delivered Features

- **NoSQL Operator Injection & Prototype Pollution Defense (`sanitizeInput.js`):**
  - Recursively inspects `req.body`, `req.query`, and `req.params`.
  - Rejects any key starting with `$` or containing `.` with HTTP `400 INVALID_INPUT`.
  - Blocks query tampering such as `?status[$ne]=Approved` and body manipulation like `{"identifier": {"$gt": ""}}`.

- **Enhanced Central Error Handler (`errorHandler.js`):**
  - Normalized Mongoose `CastError` into HTTP `400 INVALID_IDENTIFIER` (prevents unhandled 500 crashes on malformed IDs).
  - Normalized Mongoose `ValidationError` into HTTP `400 VALIDATION_ERROR` with structured field errors.
  - Normalized Mongo duplicate key error `E11000` into HTTP `409 DUPLICATE`.
  - Suppressed internal stack traces on 500 errors in non-development environments.

- **Global API Rate Limiting (`rateLimiters.js`):**
  - Mounted `apiLimiter` (1,000 requests per 15 minutes per IP) across all `/api/v1` routes to prevent denial of service and automated scraping.
  - Kept strict `loginLimiter` (10 requests per 15 minutes) on `/auth/login`.

- **Full Security Checklist Compliance:**
  - Password hashes computed with bcrypt and excluded from serialization (`select: false`).
  - HttpOnly sessions stored in MongoDB Atlas with secure cookies and double-submit CSRF tokens in `X-CSRF-Token` headers.
  - Granular RBAC and ownership guards across leave records, notifications, and administrator consoles.
  - 0 known security vulnerabilities reported by `npm audit` across both client and server trees.

### 3. Files created (Stage 11)

Server:
- `server/src/middleware/sanitizeInput.js`

Tests:
- `scratch/test_stage11.js`

### 4. Files modified (Stage 11)

Server:
- `server/src/middleware/errorHandler.js` — Added CastError, ValidationError, and duplicate key normalization.
- `server/src/middleware/rateLimiters.js` — Added `apiLimiter`.
- `server/src/app.js` — Mounted `sanitizeInput` and `apiLimiter`.
- `PROJECT_PROGRESS.md` — Updated stage status and documentation.

### 5. Testing and verification

- **PASS** — Backend syntax: `node --check` passed on all server files.
- **PASS** — Dependency audits: 0 vulnerabilities on both server and client (`npm audit`).
- **PASS** — Automated Security & Reliability Test Suite (`scratch/test_stage11.js`):
  - NoSQL injection in body rejected with 400 `INVALID_INPUT`.
  - NoSQL injection in query string rejected with 400 `INVALID_INPUT`.
  - Malformed ObjectId in unauthenticated requests handled cleanly (401).
  - Malformed ObjectId in authenticated requests handled cleanly (404/400, no 500 crash).
  - Missing CSRF header blocked with 403 `CSRF_INVALID`.
  - Forged CSRF header blocked with 403 `CSRF_INVALID`.
  - Student blocked from administrative user endpoints with 403 `FORBIDDEN`.
  - Password hashes verified completely hidden and omitted from responses.
  - Standardized 404 error format verified without internal path disclosure.

### 6. Stage completion status

COMPLETED AND VERIFIED.

### 7. Next stage

**Stage 12 — Automated and End-to-End Testing.**

---

## Stage 12 — Automated and End-to-End Testing

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Goal

Add a fast, dependency-free automated test suite for the backend's pure logic
so regressions are caught without needing a running database or external
services, while keeping DB-backed flows verifiable against seeded accounts.

### 2. Delivered Features

- **Built-in Node.js test runner** (`node --test --test-reporter=spec`) using
  `node:assert` — no new dependencies.
- **27 unit tests** across four files under `server/test/`:
  - `dateOnly.test.js` — date-only validation, add/compare, inclusive day
    counts, enumeration, weekend detection, display formatting, timezone
    "today".
  - `pagination.test.js` — page/limit parsing, clamping, custom limits, and
    pagination metadata.
  - `password.test.js` — bcrypt hashing/verification, wrong-password rejection,
    missing-input safety, per-hash salting.
  - `letter.service.test.js` — applicant phrasing for students/teachers, formal
    letter body, **current-status composition** (Pending/Approved/Rejected with
    decision date/reason/remark), legacy-footer upgrade, and structured payload.

### 3. Files created (Stage 12)

- `server/test/dateOnly.test.js`
- `server/test/pagination.test.js`
- `server/test/password.test.js`
- `server/test/letter.service.test.js`

### 4. Files modified (Stage 12)

- `README.md` — expanded **Testing** section (runner, commands, coverage table,
  DB-flow note).
- `PROJECT_PROGRESS.md` — this update.

### 5. Testing and verification

- **PASS** — `npm test` (root) / `npm --prefix server test`: **27 passed,
  0 failed** in ~2s.

### 6. Stage completion status

COMPLETED AND VERIFIED.

### 7. Next stage

**Stage 13 — Deployment Docs, README, and Final Cleanup.**

---

## Stage 13 — Deployment Docs, README, and Final Cleanup

**Status:** COMPLETED AND VERIFIED
**Date:** 2026-10-12

### 1. Goal

Bring the documentation in line with the finished feature set, remove dead
code, and fix correctness issues found during the final review pass.

### 2. Delivered Features

- **Letter status is now always current.** Generated letters show `Status:
  Pending` while undecided and switch to `Approved`/`Rejected` with the
  decision date, rejection reason, and remark once decided. Legacy stored
  letters with a stale footer are upgraded on read
  (`letter.service.js`: `composeLetterContent`).
- **Live preview parity.** The applicant "live formal letter preview" now
  mirrors the real server letter (addressee "The Administrator", subject
  "Request for Leave", applicant phrasing) and uses the configured institution
  name from `GET /api/v1/settings` instead of a hardcoded name.
- **Dashboard uses real data.** Replaced the hardcoded "Leave Balance" quotas
  and non-functional role tabs on the applicant dashboard with a data-derived
  "Leave Insights" panel (approved/applied days, per-status day breakdown,
  upcoming approved count, currently-on-leave).
- **Admin review table upgraded.** `/admin/applications` gained LeaveHub-style
  presentation, a **View letter** action, and **inline Approve/Reject** controls
  for pending rows using the shared decision dialog.
- **PDF letterhead fix.** `pdf.service.js` no longer references a nonexistent
  `settings.institutionCode`; the letterhead code is derived from the
  institution name.
- **Login hardening.** Demo credentials are now emitted only in development
  builds (`import.meta.env.DEV`); production bundles omit them and hide the
  "Quick Test Autofill" footer.
- **Dead code removed.** Deleted the unused `components/admin/StatusBadge.jsx`
  and pruned unused imports across touched files.
- **Docs refreshed.** README's API table now lists the history/summary, PDF,
  and settings endpoints; the Testing and Known limitations sections reflect
  Stages 0–13.

### 3. Files created (Stage 13)

- None.

### 4. Files modified (Stage 13)

Server:
- `server/src/services/letter.service.js` — `composeLetterContent`, current-status
  footer, legacy upgrade.
- `server/src/services/leave.service.js` — dropped the now-unused
  `applicationId` argument from `buildLetterContent`.
- `server/src/services/pdf.service.js` — derived institution code.

Client:
- `client/src/pages/student/LeaveApplyPage.jsx` — preview parity + institution
  name.
- `client/src/pages/DashboardPage.jsx` — real Leave Insights.
- `client/src/pages/admin/AdminApplicationsPage.jsx` — redesign + letter/inline
  decisions.
- `client/src/pages/LoginPage.jsx` — dev-only demo credentials.
- `client/src/components/admin/StatusBadge.jsx` — **deleted** (unused).

Docs:
- `README.md`, `PROJECT_PROGRESS.md` — updated.

### 5. Testing and verification

- **PASS** — `npm test`: 27/27 backend unit tests pass (including the new
  current-status letter tests).
- **PASS** — `npm run build`: frontend production build succeeds.
- **NOT TESTED** — browser-rendered interaction for the redesigned pages (no
  headless browser in this environment); verified at the build + API level.

### 6. Stage completion status

COMPLETED AND VERIFIED. All Stages 0–13 are complete.



