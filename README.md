# Online Leave Management System

A database-backed web application for an educational institution where
**students** and **teachers** submit leave requests, the server generates a
formal leave letter, and an **administrator** reviews and approves or rejects
each request. Applicants receive in-app notifications and can track their leave
history and the academic calendar.

## Roles

- **Administrator** — manage student/teacher accounts, review and decide leave
  applications, manage holidays and the academic calendar, view institution-wide
  statistics.
- **Student** — apply for leave, view/print generated letters, track status,
  history, notifications, and calendar.
- **Teacher** — same leave workflow as students with teacher-specific profile
  fields.

## Technology stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React, Vite, Tailwind CSS, React Router, lucide-react |
| Backend  | Node.js, Express.js                                 |
| Database | MongoDB (Atlas), Mongoose                           |

## Repository layout

```
online-leave-management/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── routes/         # App router / route guards
│       ├── pages/          # Page components
│       ├── components/     # Reusable UI components
│       └── services/       # API client modules
├── server/                 # Express backend
│   └── src/
│       ├── config/         # env + database connection
│       ├── routes/         # HTTP route definitions
│       ├── middleware/     # auth, validation, error handling
│       └── utils/          # shared helpers
├── PROJECT_PROGRESS.md     # stage-by-stage progress log
└── online_leave_management_architecture.md   # reference specification
```

The full stage-by-stage architecture lives in
`online_leave_management_architecture.md`.

## Prerequisites

- Node.js **18.18+** (developed and verified on Node 22)
- npm 9+
- A MongoDB deployment (MongoDB Atlas or a local MongoDB server)

## Installation

1. Clone/copy the project and install dependencies:

   ```bash
   npm run install:all
   ```

2. Create the backend environment file:

   ```bash
   copy server\.env.example server\.env      # Windows
   # cp server/.env.example server/.env      # macOS/Linux
   ```

   Then edit `server/.env` and set at least:
   - `MONGODB_URI` — your MongoDB connection string (with credentials)
   - `SESSION_SECRET` — a long random string

3. (Optional) Create `client/.env` from `client/.env.example` to override the
   API base URL. The Vite dev server already proxies `/api` to the backend.

## Running locally

Run both apps together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server   # API on http://localhost:5000
npm run dev:client   # UI  on http://localhost:5173
```

Verify the backend health endpoint:

```
GET http://localhost:5000/api/v1/health
```

## Environment variables

### `server/.env`

| Variable         | Purpose                                             |
|------------------|-----------------------------------------------------|
| `NODE_ENV`       | `development` / `production` / `test`               |
| `PORT`           | API port (default `5000`)                           |
| `CLIENT_ORIGIN`  | Allowed CORS origin (frontend URL)                  |
| `SESSION_SECRET` | Secret for signing sessions/tokens                  |
| `MONGODB_URI`    | MongoDB connection string                           |
| `MONGODB_DB_NAME`| Logical database name (default `online_leave_management`) |

### `client/.env`

| Variable            | Purpose                              |
|---------------------|--------------------------------------|
| `VITE_API_BASE_URL` | API base URL including `/api/v1`     |

## Database seeding and first administrator

MongoDB creates a database on first write, so no manual database creation is
needed. Create the first administrator (and optional demo data) with:

```bash
npm run seed
```

- The script is idempotent — existing accounts are left unchanged.
- The first admin comes from `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_USERNAME` /
  `ADMIN_PASSWORD` in `server/.env`. The admin is created with
  `mustChangePassword: true`.
- In production the seed refuses to run unless `ADMIN_PASSWORD` is set.
- Set `SEED_DEMO_DATA=true` (development only) to also create clearly-marked
  test accounts under the `@demo.local` domain. Do not enable this in
  production.
- The app never seeds or resets data automatically on startup.

## Data rules

- **Dates are calendar dates**, stored as `YYYY-MM-DD` strings. All date
  arithmetic is done in UTC so a day never shifts across timezones. "Today" is
  resolved in the institution timezone (`InstitutionSettings.timezone`, default
  `Asia/Kolkata`).
- **Leave durations:** `requestedCalendarDays` is inclusive (`end - start + 1`).
  Per confirmed policy, weekends and holidays **count** toward leave days, so
  `requestedPolicyDays` equals the calendar duration.
- **Application IDs** are server-generated as `<PREFIX>-<YYYY>-<NNNNNN>` using
  an atomic counter (`PREFIX` defaults to `LV`), which guarantees uniqueness.
- **Statuses:** `Pending` (default), `Approved`, `Rejected`. Only pending
  applications may be decided; a rejection requires a `rejectionReason`.
- **Uniqueness:** `email`, `username`, `studentId`, and `teacherId` are unique
  where present.
- **Sensitive fields:** `passwordHash` is `select: false` and stripped from all
  serialized output.
- **Role fields:** student accounts require `studentId` and a course/department;
  teacher accounts require `teacherId`, `designation`, and `department`.
- **Trusted timestamps** (`submittedAt`, `decisionAt`) and all decision fields
  are set by the server, never by client input.

## Collections

`users`, `leaveapplications`, `notifications`, `academiccalendarevents`,
`institutionsettings`, `auditlogs`, and `counters`.

## API route overview (current)

| Method | Endpoint                       | Access          | Purpose                         |
|--------|--------------------------------|-----------------|---------------------------------|
| GET    | `/api/v1/health`               | Public          | Service/database health         |
| POST   | `/api/v1/auth/login`           | Public          | Sign in (session cookie + CSRF) |
| GET    | `/api/v1/auth/me`              | Authenticated   | Current user                    |
| POST   | `/api/v1/auth/logout`          | Authenticated   | Sign out                        |
| POST   | `/api/v1/auth/change-password` | Authenticated   | Change own password             |
| GET    | `/api/v1/users`                | Admin           | List/filter accounts            |
| POST   | `/api/v1/users`                | Admin           | Create account                  |
| GET    | `/api/v1/users/:id`            | Admin or self   | Account detail                  |
| PATCH  | `/api/v1/users/:id`            | Admin           | Update account                  |
| PATCH  | `/api/v1/users/:id/status`     | Admin           | Activate/deactivate             |
| GET    | `/api/v1/users/:id/leave-summary` | Admin or self | Leave totals                    |
| GET    | `/api/v1/leaves/mine`          | Student/Teacher | Own applications (paginated)    |
| GET    | `/api/v1/leaves/mine/summary`  | Student/Teacher | Own leave totals                |
| POST   | `/api/v1/leaves`               | Student/Teacher | Submit leave application        |
| GET    | `/api/v1/leaves`               | Admin           | List/filter applications        |
| POST   | `/api/v1/leaves/:id/approve`   | Admin           | Approve a pending application   |
| POST   | `/api/v1/leaves/:id/reject`    | Admin           | Reject a pending application    |
| GET    | `/api/v1/leaves/:id`           | Owner or Admin  | Read an application             |
| GET    | `/api/v1/leaves/:id/letter`    | Owner or Admin  | Generated letter data           |
| GET    | `/api/v1/leaves/:id/pdf`       | Owner or Admin  | Download official PDF letter    |
| POST   | `/api/v1/calendar/check-range` | Authenticated   | Range warnings + day counts     |
| GET    | `/api/v1/calendar/events`      | Authenticated   | Calendar events list            |
| GET    | `/api/v1/calendar/events/:id`  | Authenticated   | Calendar event details          |
| POST   | `/api/v1/calendar/events`      | Admin           | Create holiday or event         |
| PATCH  | `/api/v1/calendar/events/:id`  | Admin           | Update holiday or event         |
| DELETE | `/api/v1/calendar/events/:id`  | Admin           | Delete holiday or event         |
| GET    | `/api/v1/notifications`        | Authenticated   | Current user's notifications     |
| GET    | `/api/v1/notifications/unread-count` | Authenticated | Unread count for the bell       |
| PATCH  | `/api/v1/notifications/:id/read` | Authenticated | Mark one notification read      |
| PATCH  | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications read     |
| GET    | `/api/v1/dashboard/mine`       | Student/Teacher | Applicant dashboard stats        |
| GET    | `/api/v1/dashboard/admin`      | Admin           | Admin dashboard stats           |
| WS     | `/ws` (or `/api/v1/ws`)        | Authenticated   | Real-time WebSocket notifications|
| GET    | `/api/v1/settings`             | Authenticated   | Read institution settings       |
| PATCH  | `/api/v1/settings`             | Admin           | Update institution settings     |

## Testing

The backend uses the built-in Node.js test runner (`node:test`) with the
`node:assert` library — no extra test dependencies.

```bash
npm test                              # run the full backend suite
npm --prefix server test              # equivalent, run from the repo root
node --test server/test/dateOnly.test.js   # run a single file
```

Test files live in `server/test/` and cover the pure, DB-independent logic:

| File                          | Covers                                          |
|-------------------------------|-------------------------------------------------|
| `dateOnly.test.js`            | UTC calendar-date helpers (parsing, arithmetic) |
| `pagination.test.js`          | Page/limit parsing and pagination metadata      |
| `password.test.js`            | bcrypt hashing and verification                 |
| `letter.service.test.js`      | Applicant phrasing and letter content/status    |

Flows that require a MongoDB connection (auth, submissions, decisions) are
verified end-to-end against a running database via the seed accounts; they are
intentionally not part of the unit suite so tests run without external services.

## Build

```bash
npm run build       # production build of the frontend
```

## Security notes

- Passwords are stored as hashes only (implemented in Stage 3).
- Secrets live in environment files that are git-ignored; `.env.example`
  contains placeholders only.
- Authorization is enforced on the server, not just in the UI.
- Never commit a real `.env` file.

## Troubleshooting

- **Backend exits with "Missing required environment variable(s)"** — create
  `server/.env` from `server/.env.example` and fill in `MONGODB_URI` and
  `SESSION_SECRET`.
- **Health endpoint returns 503 / database "disconnected"** — check that
  `MONGODB_URI` is correct and that your current IP is allowed in MongoDB Atlas
  (Network Access → IP Access List).
- **CORS error in the browser** — ensure `CLIENT_ORIGIN` matches the frontend
  URL exactly.

## Known limitations

- Stages 0–13 are implemented: configuration, models, auth/RBAC, user
  management, leave submission with generated letters, admin review/approval/
  rejection, notifications, role-specific dashboards with live statistics,
  shared academic calendar with admin CRUD, real-time WebSocket streaming,
  institution settings, the security/settings UI, backend unit tests, and this
  documentation. See `PROJECT_PROGRESS.md` for the stage log.
- Automated tests currently cover pure backend logic only; database-backed
  flows are verified manually against seeded accounts (see **Testing**).
