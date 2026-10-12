# Online Leave Management System

## Complete Stage-by-Stage Architecture and Implementation Blueprint

**Project type:** Full-stack web application for an educational
institution\
**Primary roles:** Administrator, Student, Teacher\
**Suggested stack:** React + Vite + Tailwind CSS, React Router,
Node.js + Express, MongoDB + Mongoose\
**Purpose of this document:** One central implementation plan that
explains the architecture, stages, responsibilities, data flow, files,
validation, security, and completion criteria before and during
development.

------------------------------------------------------------------------

# 1. Project Goal and Core Rules

Build a real, database-backed Online Leave Management System. It must
not be a static dashboard or a frontend-only prototype.

Students and teachers submit leave requests by choosing dates and
entering a purpose. The server generates a formal leave letter from the
applicant's stored profile and application data. The administrator
reviews the application and approves or rejects it. The applicant
receives an in-app notification and can see the updated status in their
dashboard, history, and calendar.

## 1.1 Roles

### Administrator

-   Sign in using an authorized administrator account.
-   Create, view, update, activate, and deactivate student and teacher
    accounts.
-   Assign or generate initial credentials securely.
-   View and filter all leave applications.
-   Open generated letters and approve or reject pending applications.
-   Enter an optional rejection reason.
-   Manage holidays, institution-specific calendar events, and relevant
    institution settings.
-   View institution-wide statistics and individual applicant leave
    history.

### Student

-   Sign in using assigned credentials.
-   View and update only permitted parts of their own profile.
-   Apply for leave using dates and purpose.
-   Preview and print a generated letter; download a PDF if implemented.
-   View only their own applications, notifications, statistics, leave
    history, and relevant calendar information.

### Teacher

-   Use the same main leave workflow as students, with teacher-specific
    profile information such as teacher ID, department, and designation.
-   View only their own applications, notifications, statistics, leave
    history, and relevant calendar information.

## 1.2 Non-negotiable rules

1.  The database is the source of truth. Dashboard counts must never be
    hardcoded.
2.  The server must enforce authentication, roles, ownership,
    validation, and status transitions. Hiding a button in the frontend
    is not security.
3.  An application is created with `Pending` status.
4.  Only an authorized administrator may decide a pending application.
5.  An application must not be approved or rejected twice accidentally.
    A decision operation must be atomic or otherwise protected against
    concurrent duplicate processing.
6.  Applicants must not be able to set their own role, applicant ID,
    decision status, decision date, or rejection reason through a
    crafted API request.
7.  Calendar warnings inform applicants about weekends and holidays; a
    warning does not automatically approve or reject a request.
8.  Date-only leave values must be handled consistently to avoid
    timezone shifts.
9.  A feature is not complete until its frontend, API, database
    behavior, authorization, error states, and tests work together.
10. Existing code must be inspected before implementation. Preserve a
    working stack where practical rather than replacing it without
    reason.

------------------------------------------------------------------------

# 2. System Architecture at a Glance

## 2.1 High-level architecture

``` text
Browser
  |
  | React + Vite + Tailwind CSS
  | React Router, forms, tables, calendar, dashboards
  v
Frontend API client
  |
  | HTTPS / JSON requests
  | session cookie or carefully configured token strategy
  v
Node.js + Express API
  |
  +-- Authentication and session middleware
  +-- Role and ownership authorization
  +-- Request validation and normalization
  +-- Auth, users, leaves, notifications, calendar, settings services
  +-- Letter generation and PDF service
  +-- Central error handler and audit logging
  |
  v
Mongoose data-access layer
  |
  v
MongoDB
  +-- users
  +-- leaveApplications
  +-- notifications
  +-- academicCalendarEvents
  +-- institutionSettings
  +-- optional auditLogs
```

## 2.2 Responsibilities by layer

  ------------------------------------------------------------------------
  Layer                   Responsibilities         Must not do
  ----------------------- ------------------------ -----------------------
  React UI                Render role-specific     Decide permissions or
                          screens, collect inputs, fabricate database
                          display server results   statistics
                          and errors               

  Frontend routing        Route users to           Replace backend
                          appropriate screens and  authorization
                          provide a user-friendly  
                          protected-route          
                          experience               

  API client              Send requests, handle    Store passwords or
                          authentication/session   trust role values
                          expiry, normalize API    supplied by the browser
                          errors                   

  Express routes          Define HTTP endpoints    Contain large amounts
                          and connect              of business logic
                          middleware/controllers   

  Middleware              Authenticate requests,   Assume that frontend
                          enforce role access,     checks are sufficient
                          validate request         
                          boundaries, rate-limit   
                          sensitive operations     

  Services                Implement business rules Trust client-supplied
                          and coordinate database  protected fields
                          operations               

  Mongoose models         Define schemas, field    Replace business
                          rules, references,       authorization checks
                          indexes, and timestamps  

  MongoDB                 Persist accounts,        Be replaced by
                          applications, decisions, hardcoded arrays in
                          notifications, calendar  production
                          events, and settings     

  Tests                   Verify behavior, access  Only test that a page
                          boundaries, failure      renders
                          handling, and workflows  
  ------------------------------------------------------------------------

## 2.3 Recommended application structure

Use a single repository with separate frontend and backend applications
unless an existing repository has a different established structure.

``` text
online-leave-management/
├── README.md
├── .gitignore
├── .env.example
├── package.json                 # Optional root scripts
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── routes/
│       │   ├── AppRouter.jsx
│       │   └── ProtectedRoute.jsx
│       ├── layouts/
│       │   ├── AuthLayout.jsx
│       │   ├── AdminLayout.jsx
│       │   ├── StudentLayout.jsx
│       │   └── TeacherLayout.jsx
│       ├── components/
│       │   ├── common/
│       │   ├── forms/
│       │   ├── tables/
│       │   ├── status/
│       │   ├── notifications/
│       │   └── calendar/
│       ├── features/
│       │   ├── auth/
│       │   ├── admin-dashboard/
│       │   ├── students/
│       │   ├── teachers/
│       │   ├── leave-applications/
│       │   ├── notifications/
│       │   ├── academic-calendar/
│       │   ├── history/
│       │   └── settings/
│       ├── services/
│       │   ├── apiClient.js
│       │   ├── authApi.js
│       │   ├── usersApi.js
│       │   ├── leavesApi.js
│       │   ├── notificationsApi.js
│       │   ├── calendarApi.js
│       │   └── dashboardApi.js
│       ├── hooks/
│       ├── utils/
│       └── styles/
└── server/
    ├── package.json
    └── src/
        ├── server.js
        ├── app.js
        ├── config/
        │   ├── database.js
        │   └── env.js
        ├── models/
        │   ├── User.js
        │   ├── LeaveApplication.js
        │   ├── Notification.js
        │   ├── AcademicCalendarEvent.js
        │   ├── InstitutionSettings.js
        │   └── AuditLog.js              # Recommended
        ├── routes/
        │   ├── auth.routes.js
        │   ├── users.routes.js
        │   ├── leaves.routes.js
        │   ├── notifications.routes.js
        │   ├── calendar.routes.js
        │   ├── dashboard.routes.js
        │   └── settings.routes.js
        ├── controllers/
        ├── services/
        ├── middleware/
        │   ├── authenticate.js
        │   ├── authorizeRole.js
        │   ├── validateRequest.js
        │   ├── errorHandler.js
        │   └── rateLimiters.js
        ├── validators/
        ├── utils/
        │   ├── AppError.js
        │   ├── dateOnly.js
        │   ├── pagination.js
        │   └── letterTemplate.js
        └── tests/
            ├── auth/
            ├── users/
            ├── leaves/
            ├── notifications/
            └── calendar/
```

This is a recommended structure, not a requirement to create every empty
file on day one. Create files when their stage begins. Keep routes,
controllers, services, and models separate so the project remains
maintainable.

------------------------------------------------------------------------

# 3. Core Data Architecture

## 3.1 User collection

One `User` collection can represent all three roles. The `role` field
controls access; profile fields distinguish students and teachers.

Suggested fields: - `_id`: MongoDB identifier. - `name`: required full
name. - `email`: required and normalized; unique if the institution
requires unique email addresses. - `username` or institutional login ID:
unique according to the institution's policy. - `passwordHash`: hashed
password only; never store plaintext passwords. - `role`: enum `admin`,
`student`, or `teacher`. - `accountStatus`: enum `active`, `inactive`,
or another explicitly supported status. - `department`: where
applicable. - Student-specific fields: `studentId`, `course`, `year`,
`section`, and any required class details. - Teacher-specific fields:
`teacherId`, `designation`, and department. - Optional profile fields:
phone number or other institution-approved information. -
`mustChangePassword`: useful for first-time credentials. -
`lastLoginAt`: optional. - `createdAt`, `updatedAt`: timestamps.

Rules: - Never return `passwordHash` in API responses. - Do not allow a
student or teacher to change their own `role` or account status. -
Validate role-specific fields when creating a student or teacher. -
Create the first admin through a controlled seed/setup script or another
documented secure provisioning process; do not expose a public "create
admin" endpoint. - Account deactivation must block new sign-ins and
protected activity according to the selected session policy.

## 3.2 LeaveApplication collection

Suggested fields: - `_id`: internal identifier. - `applicationId`:
human-readable unique ID, generated on the server. - `applicant`:
reference to `User`. - `applicantRoleSnapshot`: student/teacher role at
submission time, if historical reporting requires it. -
`applicantNameSnapshot`: name at submission time, if letters must
preserve the submitted identity. - `applicantIdSnapshot`: institutional
ID at submission time. - `departmentSnapshot`: department at submission
time. - `classOrDesignationSnapshot`: class/course details or teacher
designation. - `purpose`: required trimmed text with a sensible maximum
length. - `startDate`: normalized date-only value. - `endDate`:
normalized date-only value. - `requestedCalendarDays`: inclusive
calendar-day duration. - `requestedPolicyDays`: optional
policy-calculated duration if the institution excludes
weekends/holidays. - `letterContent` or structured letter fields:
generated by the server from trusted profile/application data. -
`status`: enum `Pending`, `Approved`, `Rejected`; default `Pending`. -
`submittedAt`: server-generated timestamp. - `decisionAt`: null until
decided. - `decidedBy`: administrator reference, null until decided. -
`rejectionReason`: optional; required only if the institution chooses to
require one for rejection. - `decisionNote`: optional administrative
note if supported. - `createdAt`, `updatedAt`.

Important rules: - Applicant identity comes from the authenticated
session, not from a client-provided applicant ID. - The server generates
the application ID and letter content. - Only pending applications may
be decided. - Do not silently overwrite a completed decision. Any
exceptional reversal/reopening feature must be explicitly designed,
permissioned, audited, and tested. - Keep a snapshot of relevant
identity fields if historical letters must remain unchanged when a
user's profile changes. - Use indexes for `applicationId`, `applicant`,
`status`, `submittedAt`, and commonly filtered date/status combinations
as justified by actual queries.

## 3.3 Notification collection

Suggested fields: - `_id`. - `recipient`: reference to the one user who
should receive the notification. - `application`: reference to the
related leave application. - `type`: for example
`application_submitted`, `application_approved`, `application_rejected`,
or `decision_note`. - `title`. - `message`. - `readAt`: null when
unread; timestamp when read. - `createdAt`.

Rules: - Notifications are stored in the database, not only in frontend
state. - Only the recipient may read or mark their notification as
read. - The server derives the recipient from the application or
authenticated user; the client cannot choose an arbitrary recipient. -
Use pagination for long notification lists. - A notification should link
to the related application only after the API has verified that the
current user may access it.

## 3.4 AcademicCalendarEvent collection

Suggested fields: - `_id`. - `name`: required event/holiday name. -
`startDate`, `endDate`: date-only values; support single-day and
multi-day events. - `type`: `public_holiday`, `institution_holiday`,
`weekend_override`, `academic_event`, or a controlled set agreed by the
institution. - `description`: optional. - `isActive`: optional if soft
disabling is needed. - `createdBy`, `updatedBy`: administrator
references. - Timestamps.

Rules: - Validate `endDate >= startDate`. - Define how overlapping
events are displayed and which event name is shown if more than one
applies. - Weekends should be calculated by the date utility; do not
require administrators to create every weekend as a holiday record. - A
configurable institution policy may allow or disallow leave on specific
dates. A warning alone must not change application status.

## 3.5 InstitutionSettings collection

Suggested fields: - `institutionName`. - `timezone`: institution's
configured timezone. - `academicYear` or academic-year boundaries. -
`leavePolicy`: whether weekends and holidays count toward policy leave
days, plus any configurable restrictions. - `applicationIdPrefix` and
sequence strategy if a formatted application ID is desired. - Optional
branding/contact information used in letters. - Timestamps and the
administrator who last updated settings.

Rules: - Define safe defaults and validate all settings. - Restrict
settings modification to administrators. - Do not let a settings update
retroactively rewrite old applications or letters unless that behavior
is intentionally specified.

## 3.6 Optional AuditLog collection

Recommended for accountability: - Actor user reference. - Action, such
as account creation, account deactivation, leave approval, leave
rejection, or settings change. - Target record type and identifier. -
Timestamp. - Minimal before/after summary where useful; do not log
passwords, tokens, or unnecessary personal data.

## 3.7 Relationships

``` text
User 1 -------- many LeaveApplications (as applicant)
User 1 -------- many Notifications (as recipient)
User 1 -------- many LeaveApplications (as deciding admin, through decidedBy)
LeaveApplication 1 -------- many Notifications
User (admin) -------- many AcademicCalendarEvents (createdBy/updatedBy)
User (admin) -------- many AuditLogs (actor)
```

## 3.8 Status lifecycle

``` text
Application submitted
        |
        v
     Pending
      /   \
     /     \
Approve   Reject
   |         |
   v         v
Approved   Rejected
```

No transition out of `Approved` or `Rejected` is supported in the
initial version. A later correction/reopening workflow must be a
separately authorized and audited feature.

------------------------------------------------------------------------

# 4. API Design

Use a consistent API prefix such as `/api/v1`. Return JSON with
predictable success and error formats.

Example success shape:

``` json
{
  "success": true,
  "data": {},
  "message": "Request completed"
}
```

Example error shape:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "End date must be on or after start date",
    "details": []
  }
}
```

Do not return stack traces, database internals, password hashes, or
secrets to the browser.

## 4.1 Authentication endpoints

  --------------------------------------------------------------------------------------
  Method            Endpoint                         Access            Purpose
  ----------------- -------------------------------- ----------------- -----------------
  POST              `/api/v1/auth/login`             Public,           Authenticate
                                                     rate-limited      credentials

  POST              `/api/v1/auth/logout`            Authenticated     End the session /
                                                                       invalidate token
                                                                       as designed

  GET               `/api/v1/auth/me`                Authenticated     Return the
                                                                       current user's
                                                                       safe profile and
                                                                       role

  POST              `/api/v1/auth/change-password`   Authenticated     Change password,
                                                                       especially after
                                                                       first login
  --------------------------------------------------------------------------------------

## 4.2 User management endpoints

  -----------------------------------------------------------------------------------------------
  Method            Endpoint                              Access            Purpose
  ----------------- ------------------------------------- ----------------- ---------------------
  POST              `/api/v1/users/students`              Admin             Create student
                                                                            account

  GET               `/api/v1/users/students`              Admin             Search, filter,
                                                                            paginate students

  GET               `/api/v1/users/students/:id`          Admin; self-only  Get student details
                                                          where explicitly  
                                                          allowed           

  PATCH             `/api/v1/users/students/:id`          Admin             Update student
                                                                            details

  PATCH             `/api/v1/users/students/:id/status`   Admin             Activate/deactivate
                                                                            student

  POST              `/api/v1/users/teachers`              Admin             Create teacher
                                                                            account

  GET               `/api/v1/users/teachers`              Admin             Search, filter,
                                                                            paginate teachers

  GET               `/api/v1/users/teachers/:id`          Admin; self-only  Get teacher details
                                                          where explicitly  
                                                          allowed           

  PATCH             `/api/v1/users/teachers/:id`          Admin             Update teacher
                                                                            details

  PATCH             `/api/v1/users/teachers/:id/status`   Admin             Activate/deactivate
                                                                            teacher

  GET               `/api/v1/users/:id/leave-summary`     Admin; self-only  View authorized leave
                                                          where explicitly  statistics
                                                          allowed           
  -----------------------------------------------------------------------------------------------

Avoid a generic user-management endpoint that accidentally allows role
escalation. Validate each role-specific create/update operation.

## 4.3 Leave application endpoints

  --------------------------------------------------------------------------------------------
  Method            Endpoint                        Access            Purpose
  ----------------- ------------------------------- ----------------- ------------------------
  POST              `/api/v1/leaves`                Student/Teacher   Submit leave application

  GET               `/api/v1/leaves/mine`           Student/Teacher   List only the current
                                                                      user's applications

  GET               `/api/v1/leaves/:id`            Owner or Admin    Read an application

  GET               `/api/v1/leaves/:id/letter`     Owner or Admin    Retrieve generated
                                                                      letter data

  GET               `/api/v1/leaves`                Admin             Search/filter/paginate
                                                                      all applications

  POST              `/api/v1/leaves/:id/approve`    Admin             Approve a pending
                                                                      application

  POST              `/api/v1/leaves/:id/reject`     Admin             Reject a pending
                                                                      application with
                                                                      optional/required reason
                                                                      per policy

  GET               `/api/v1/leaves/mine/summary`   Student/Teacher   Own dashboard totals

  GET               `/api/v1/leaves/:id/pdf`        Owner or Admin    Generate/return a PDF if
                                                                      implemented
  --------------------------------------------------------------------------------------------

Suggested filters for the admin list: - `status` - `role` -
`department` - `startDateFrom`, `startDateTo` - `submittedFrom`,
`submittedTo` - `search` - `page`, `limit` - `sortBy`, `sortOrder` from
an allowlist

Rules: - Validate pagination bounds and sort fields. - Never accept
`status`, `decidedBy`, `decisionAt`, `applicant`, or generated letter
content from the applicant on submission. - The server calculates
duration and snapshots profile data. - Use an atomic conditional update,
transaction where appropriate, or equivalent concurrency-safe operation
to ensure only one administrator decision succeeds. - Create the
decision notification only when the decision update succeeds. If the
database deployment supports transactions, use a transaction to keep the
status update and notification consistent. Otherwise use a documented
reliable strategy, such as an outbox/retry pattern, for critical
consistency.

## 4.4 Notification endpoints

  --------------------------------------------------------------------------------------------
  Method            Endpoint                               Access            Purpose
  ----------------- -------------------------------------- ----------------- -----------------
  GET               `/api/v1/notifications`                Authenticated     Current user's
                                                                             notifications,
                                                                             paginated

  GET               `/api/v1/notifications/unread-count`   Authenticated     Unread count for
                                                                             the bell

  PATCH             `/api/v1/notifications/:id/read`       Recipient only    Mark one
                                                                             notification as
                                                                             read

  PATCH             `/api/v1/notifications/read-all`       Authenticated     Mark the current
                                                                             user's
                                                                             notifications as
                                                                             read
  --------------------------------------------------------------------------------------------

## 4.5 Calendar endpoints

  ----------------------------------------------------------------------------------------
  Method            Endpoint                         Access            Purpose
  ----------------- -------------------------------- ----------------- -------------------
  GET               `/api/v1/calendar/events`        Authenticated     Get events for a
                                                                       date range

  POST              `/api/v1/calendar/events`        Admin             Add holiday/event

  PATCH             `/api/v1/calendar/events/:id`    Admin             Edit holiday/event

  DELETE            `/api/v1/calendar/events/:id`    Admin             Delete
                                                                       holiday/event

  POST              `/api/v1/calendar/check-range`   Authenticated     Check
                                                                       weekends/holidays
                                                                       within selected
                                                                       dates
  ----------------------------------------------------------------------------------------

The range-check response should identify each relevant date,
weekend/holiday status, event name when available, and any configured
restriction. The response is informational; submission validation must
run again on the server.

## 4.6 Dashboard and settings endpoints

  ---------------------------------------------------------------------------------------
  Method            Endpoint                         Access            Purpose
  ----------------- -------------------------------- ----------------- ------------------
  GET               `/api/v1/dashboard/admin`        Admin             Institution-wide
                                                                       statistics

  GET               `/api/v1/dashboard/mine`         Student/Teacher   Current user's
                                                                       statistics and
                                                                       recent records

  GET               `/api/v1/settings/institution`   Authenticated     Safe institution
                                                                       settings needed by
                                                                       UI/letters

  PATCH             `/api/v1/settings/institution`   Admin             Update institution
                                                                       settings
  ---------------------------------------------------------------------------------------

Statistics must be computed from database queries or reliable
aggregation pipelines. Document whether "currently on leave" means an
approved application whose date range includes today's institution-local
date. Prevent duplicate counting if approved applications overlap.

------------------------------------------------------------------------

# 5. Stage-by-Stage Implementation Plan

Build the project in the following stages. Each stage has a goal, work
items, key decisions, expected output, and acceptance checks. Complete
and verify a stage before moving to the next one.

------------------------------------------------------------------------

# STAGE 0 --- Existing Project Inspection and Requirements Lock

## Goal

Understand the current project before changing files and convert the
requested features into an implementation checklist.

## Work items

1.  Inspect the complete project directory, including package files,
    environment examples, source files, existing routes, models, and
    scripts.
2.  Identify whether frontend/backend/database code already exists and
    whether the application currently starts.
3.  Record the current technology stack and versions.
4.  Identify existing features, unfinished features, errors, and
    reusable components.
5.  Do not delete, overwrite, or replace existing working code without a
    reason.
6.  Compare existing functionality against this document and mark each
    feature as complete, partial, missing, or broken.
7.  Confirm institutional policy decisions:
    -   Is a rejection reason optional or mandatory?
    -   Do weekends count as leave days?
    -   Do holidays count as leave days?
    -   Are applications permitted during holidays?
    -   Which timezone is authoritative?
    -   Is email notification required, or is in-app notification
        sufficient?
    -   Is PDF download required for the first release?
8.  Write a short implementation plan based on the actual codebase.

## Deliverables

-   Existing-codebase assessment.
-   Feature gap checklist.
-   Confirmed technology stack and policy assumptions.
-   No destructive code changes in this stage.

## Acceptance criteria

-   The project can be described accurately.
-   Existing working features are identified.
-   Unknown policy decisions are documented rather than guessed.
-   A clear stage plan is approved before implementation.

------------------------------------------------------------------------

# STAGE 1 --- Repository Setup, Configuration, and Application Boot

## Goal

Create a stable frontend/backend foundation that runs locally and
connects to the database.

## Frontend tasks

1.  Set up or preserve React and Vite.
2.  Configure Tailwind CSS and global styles.
3.  Configure React Router.
4.  Add a reusable API client with a single base URL and consistent
    JSON/error handling.
5.  Create a minimal application shell and not-found page.
6.  Add environment configuration for the API URL.
7.  Set up linting/formatting if suitable for the existing project.

## Backend tasks

1.  Set up or preserve Node.js and Express.
2.  Separate `app.js` (middleware/routes) from `server.js`
    (startup/listen).
3.  Add environment loading and validation.
4.  Configure MongoDB connection using Mongoose.
5.  Add a health endpoint such as `GET /api/v1/health`.
6.  Configure JSON request parsing, request-size limits, CORS for the
    actual frontend origin, and security headers.
7.  Add a central 404 handler and central error handler.
8.  Add development scripts for frontend and backend.
9.  Ensure the backend fails clearly when required configuration is
    missing.
10. Keep secrets in environment variables, not source control.

## Configuration

Create `.env.example` with placeholder values, for example: - `PORT` -
`MONGODB_URI` - `CLIENT_ORIGIN` - `SESSION_SECRET` or equivalent
authentication secret - `NODE_ENV` - optional PDF or email
configuration, only if used

Do not place real passwords, production connection strings, or secrets
in `.env.example`.

## Deliverables

-   Frontend starts.
-   Backend starts.
-   Database connection is confirmed.
-   Health endpoint responds.
-   `.env.example`, `.gitignore`, and initial README exist.

## Acceptance criteria

-   The UI can load without a runtime crash.
-   The backend can connect to MongoDB.
-   A database outage produces a clear server-side error without leaking
    secrets.
-   CORS allows the intended frontend and rejects unintended origins in
    production configuration.
-   The application has a repeatable local startup process.

------------------------------------------------------------------------

# STAGE 2 --- Database Models, Indexes, and Data Rules

## Goal

Establish a reliable data model before building dependent features.

## Work items

1.  Implement the User model with role-specific profile validation.
2.  Implement the LeaveApplication model and status enum.
3.  Implement the Notification model.
4.  Implement the AcademicCalendarEvent model.
5.  Implement the InstitutionSettings model.
6.  Add AuditLog if included in the first release.
7.  Add timestamps, references, enums, required fields, length
    constraints, and indexes.
8.  Add indexes only for real query patterns, such as unique login IDs,
    application ID, applicant/status, submission date, notification
    recipient/read state, and calendar date ranges.
9.  Define a date-only convention and utility before persisting
    leave/calendar dates.
10. Define how application IDs are generated without collisions. A
    simple timestamp-only ID is not enough unless uniqueness is
    guaranteed.
11. Create a controlled setup/seed script for the first administrator
    and clearly marked development test records.
12. Ensure production startup does not automatically insert demo users
    or reset existing data.

## Data validation

-   Required identity and profile fields.
-   Normalized email/login identifiers.
-   Unique institutional IDs where required.
-   Valid roles and account statuses.
-   `endDate >= startDate`.
-   Non-empty, trimmed purpose with a maximum length.
-   Valid application status.
-   Rejection reason length and policy.
-   Valid event date range.
-   No client-controlled timestamps for trusted events such as
    submission or decision time.

## Deliverables

-   Working Mongoose models.
-   Index definitions.
-   Seed/setup command.
-   Data rules documented in README.

## Acceptance criteria

-   Valid records save correctly.
-   Invalid records fail with understandable errors.
-   Duplicate unique IDs are rejected cleanly.
-   Sensitive fields are excluded from public model serialization/API
    responses.
-   Date-only values remain correct across server/browser timezone
    differences.

------------------------------------------------------------------------

# STAGE 3 --- Authentication, Sessions, and Role-Based Access Control

## Goal

Implement secure login and make each role's access boundaries real on
the server.

## Work items

1.  Implement login using a normalized username/email and password.
2.  Hash passwords using a suitable password-hashing algorithm such as
    Argon2id or bcrypt with a sensible work factor.
3.  Never store or log plaintext passwords.
4.  Choose one authentication approach and configure it consistently:
    -   Prefer secure, HttpOnly cookies with appropriate `Secure` and
        `SameSite` settings for a browser application when the
        deployment architecture supports them; protect state-changing
        requests against CSRF as needed.
    -   If using bearer tokens, document token lifetime,
        refresh/invalidation strategy, and safe browser storage. Avoid
        casually storing long-lived tokens in localStorage.
5.  Implement logout and session/token invalidation according to the
    selected design.
6.  Implement `GET /auth/me`.
7.  Add authentication middleware that verifies the session/token and
    loads the current user.
8.  Add role middleware for `admin`, `student`, and `teacher`.
9.  Add ownership checks for applicant-specific data.
10. Block inactive users from logging in and define what happens to
    existing sessions when an account is deactivated.
11. Rate-limit login attempts and return generic authentication errors
    that do not disclose whether a username exists.
12. Support a first-login password change if administrator-assigned
    temporary credentials are used.
13. Create protected frontend routes for the correct user experience.
14. Redirect authenticated users to the appropriate dashboard based on
    server-confirmed role.
15. Handle expired sessions, unauthorized responses, loading states, and
    logout cleanly.

## Access matrix

  ------------------------------------------------------------------------
  Resource/action    Admin             Student           Teacher
  ------------------ ----------------- ----------------- -----------------
  View               Yes               No                No
  institution-wide                                       
  dashboard                                              

  Manage             Yes               No                No
  student/teacher                                        
  accounts                                               

  View all leave     Yes               No                No
  applications                                           

  Submit own         Not required in   Yes               Yes
  application        initial scope                       
                     unless explicitly                   
                     added                               

  View own           Optional admin    Yes               Yes
  applications       view through                        
                     management                          

  View another       Yes, for          No                No
  applicant's        administration                      
  private                                                
  application                                            

  Decide pending     Yes               No                No
  applications                                           

  Manage academic    Yes               No                No
  calendar                                               

  View relevant      Yes               Yes               Yes
  academic calendar                                      

  Read own           Yes if generated  Yes               Yes
  notifications      for admin,                          
                     otherwise not                       
                     needed                              
  ------------------------------------------------------------------------

## Deliverables

-   Secure login/logout.
-   Current-user endpoint.
-   Role-protected backend routes.
-   Protected frontend navigation.
-   Account deactivation behavior.

## Acceptance criteria

-   Invalid credentials fail safely.
-   An unauthenticated user cannot access protected API data.
-   A student cannot call an admin API directly.
-   A teacher cannot view another teacher's or any student's private
    application.
-   Changing frontend route or manually crafting an API request does not
    bypass authorization.
-   Password hashes never appear in API responses.

------------------------------------------------------------------------

# STAGE 4 --- User and Account Management (Admin)

## Goal

Allow the administrator to create and maintain student and teacher
accounts.

## Backend tasks

1.  Create student account endpoint and service.
2.  Create teacher account endpoint and service.
3.  Validate role-specific fields.
4.  Prevent duplicate institutional IDs and login names.
5.  Generate or assign initial credentials securely. If a temporary
    password is shown once, make that behavior explicit and require a
    password change where appropriate.
6.  Store only password hashes.
7.  Implement list endpoints with search, filters, sorting, and
    pagination.
8.  Implement individual detail endpoints.
9.  Implement update endpoints with allowlisted editable fields.
10. Implement account activate/deactivate endpoints.
11. Add server-side checks so account management cannot modify
    privileged admin roles through student/teacher endpoints.
12. Add audit records for account creation, sensitive changes, and
    deactivation if auditing is enabled.

## Frontend tasks

1.  Build the student list table.
2.  Build the add/edit student form.
3.  Build student detail and leave summary view.
4.  Build the teacher list table.
5.  Build the add/edit teacher form.
6.  Add search, filters, pagination, loading, error, empty, and success
    states.
7.  Add confirmation dialog for deactivation.
8.  Display field-level validation errors from the API.
9.  Do not expose temporary credentials again after their permitted
    one-time display.

## Deliverables

-   Complete admin student management.
-   Complete admin teacher management.
-   Account status control.
-   Individual leave summary links.

## Acceptance criteria

-   Admin can create, find, edit, and deactivate accounts.
-   Duplicate identifiers are handled clearly.
-   Students and teachers cannot access account-management APIs.
-   Inactive accounts cannot authenticate.
-   User tables use real API data and remain usable with large lists
    through pagination.

------------------------------------------------------------------------

# STAGE 5 --- Leave Application Submission and Letter Generation

## Goal

Allow students and teachers to submit valid applications and receive a
formal generated letter.

## Application form

Fields: - Start date. - End date. - Purpose. - Calendar warning/review
area. - Preview and submit controls.

The applicant must not be asked to type the whole formal letter
manually.

## Backend submission sequence

1.  Authenticate the user.
2.  Confirm that the user is an active student or teacher.
3.  Validate start date, end date, purpose, and allowed limits.
4.  Normalize date-only values using the institution's configured
    policy.
5.  Check that end date is not before start date.
6.  Calculate inclusive calendar-day duration:
    `end date - start date + 1 calendar day`.
7.  If policy-based leave days exclude weekends or holidays, calculate
    that separately and label it clearly.
8.  Query relevant calendar events for the selected range.
9.  Apply configured restrictions, if any; do not treat a simple warning
    as rejection.
10. Read applicant identity/profile information from the database.
11. Generate a unique application ID on the server.
12. Generate letter content from trusted profile data, selected dates,
    purpose, institution name, and submission date.
13. Create the application with `Pending` status and server-generated
    `submittedAt`.
14. Create a submission confirmation notification only if the product
    design requires notifications for applicants; otherwise show a
    confirmation in the UI. If notification records are required for
    submissions, store them in the database.
15. Return the saved application, ID, generated letter summary, and any
    calendar warnings.
16. Show a clear confirmation in the frontend.

## Letter format

``` text
To
The Administrator
[Institution Name]

Subject: Request for Leave

Respected Sir/Madam,

I am [Applicant Name], [Student/Teacher ID] from [Department/Class or Designation]. I kindly request leave from [Start Date] to [End Date] due to [Purpose].

I request you to kindly consider and approve my leave application.

Thank you for your consideration.

Yours sincerely,
[Applicant Name]
[Applicant ID]
[Application Date]

Application ID: [Application ID]
Status: Pending
```

All placeholders must be replaced by real values. If a field is not
applicable, render a suitable role-specific phrase rather than showing a
raw placeholder.

After a decision, show: - Current status. - Decision date. - Rejection
reason or decision note, if applicable.

## Frontend tasks

1.  Build the leave form with accessible labels.
2.  Prevent end date earlier than start date in the UI and repeat
    validation on the server.
3.  Reject empty or whitespace-only purpose.
4.  Show date-range calendar warnings before submission.
5.  Provide a preview/review step.
6.  Disable duplicate submit actions while a request is in progress.
7.  Display the server-generated application ID after success.
8.  Add application detail and letter view.
9.  Provide print styling.
10. Add PDF download if included in the selected release.

## Deliverables

-   Student and teacher submission flow.
-   Server-generated application IDs and letter content.
-   Saved Pending applications.
-   Calendar-aware form feedback.
-   Letter preview and print/PDF path.

## Acceptance criteria

-   A submitted application appears in MongoDB and the admin list.
-   Application identity is derived from the logged-in user.
-   Letter data uses real profile and application fields.
-   Invalid date ranges and empty purposes are rejected by the server.
-   The form cannot create duplicate applications merely because a user
    double-clicks submit; use client pending state and appropriate
    server-side protections where needed.

------------------------------------------------------------------------

# STAGE 6 --- Administrator Leave Review, Approval, and Rejection

## Goal

Give the administrator a complete, reliable review workflow.

## Backend tasks

1.  Build a paginated all-applications endpoint.
2.  Support status, role, department, date, applicant, and text search
    filters.
3.  Return only the fields required by the admin table.
4.  Build application detail and letter endpoints.
5.  Implement approval service.
6.  Implement rejection service and validate the rejection reason
    according to policy.
7.  Set `decidedBy` and `decisionAt` on the server.
8.  Only allow a decision while status is `Pending`.
9.  Use a concurrency-safe conditional update so two simultaneous
    requests cannot both decide the same application.
10. Create the notification for the actual applicant only after the
    decision succeeds.
11. Record the action in the audit log if enabled.
12. Return a conflict response if the application is already decided.
13. Never trust a status supplied by the browser.
14. Ensure a database failure does not falsely tell the admin that the
    action succeeded.

## Frontend tasks

1.  Build the admin applications table.
2.  Add status badges.
3.  Add filters, search, date controls, and pagination.
4.  Add application detail drawer/page.
5.  Display the generated letter.
6.  Add Approve and Reject controls only for Pending applications.
7.  Require a confirmation before final decision.
8.  Show an optional/required rejection reason field according to
    policy.
9.  Show success/error messages from the API.
10. Refresh or update list/statistics only after server confirmation.

## Deliverables

-   Complete review table and detail screen.
-   Approval and rejection APIs.
-   Decision notification generation.
-   Duplicate-decision protection.

## Acceptance criteria

-   Admin can approve a Pending application.
-   Admin can reject a Pending application and the reason is persisted
    when provided/required.
-   A second decision attempt returns a conflict and does not overwrite
    the first.
-   Only the correct applicant receives the notification.
-   The applicant sees the decision after refreshing or signing in
    again.
-   Filters and counts are based on real records.

------------------------------------------------------------------------

# STAGE 7 --- Notifications and Applicant Dashboard

## Goal

Make changes visible to the correct user and present accurate, useful
statistics.

## Notification tasks

1.  Create notification records in the backend.
2.  Implement list, unread count, mark-one-read, and mark-all-read
    operations.
3.  Restrict every query and update to the current recipient.
4.  Add a notification bell and unread badge.
5.  Link each notification to the relevant application page.
6.  Show title, application ID, message, timestamp, and read/unread
    state.
7.  Handle empty notifications, loading, and API errors.
8.  Optional: add email notification after the in-app workflow is
    reliable. Do not make email credentials a prerequisite for local
    operation.

## Student/teacher dashboard statistics

Show: - Total applications submitted. - Pending applications. - Approved
applications. - Rejected applications. - Upcoming approved leave. -
Currently active approved leave, when applicable. - Recent application
history. - Unread notification count.

## Admin dashboard statistics

Show: - Total students. - Total teachers. - Total applications. -
Pending applications. - Approved applications. - Rejected
applications. - Students currently on leave. - Teachers currently on
leave.

## Statistics rules

-   Compute values from MongoDB.
-   Define current leave as an approved application whose date range
    includes today's date in the institution timezone, unless
    institution policy defines a different rule.
-   Count applications separately from leave days.
-   Prevent duplicate counting if one person has overlapping approved
    applications.
-   Use server aggregation or well-defined database queries.
-   Keep all cards consistent with the same status definitions.
-   Provide sensible empty states when there are no applications yet.

## Deliverables

-   Working notification center and bell.
-   Applicant dashboard.
-   Admin dashboard with live statistics.

## Acceptance criteria

-   Approving/rejecting a request updates the relevant counts.
-   Notification read state persists after refresh.
-   A user cannot read another user's notification by changing an ID in
    the URL.
-   Dashboard data is not hardcoded.
-   Counts remain correct after new login and page refresh.

------------------------------------------------------------------------

# STAGE 8 --- Academic Calendar and Holiday Management

## Goal

Provide a shared calendar and let administrators manage
institution-specific events.

## Calendar UI

Display: - Working days. - Weekends. - Public holidays. -
Institution-specific holidays. - Configured academic events. - Approved
leave dates relevant to the logged-in user. - A clear legend for each
type.

Use a calendar library appropriate for the React version and desired
month/week/list views. Do not encode important meaning through color
alone; include text or icons for accessibility.

## Admin calendar management

1.  Add an event/holiday.
2.  Edit event details.
3.  Delete an event with confirmation.
4.  Support single-day and multi-day events.
5.  Validate name, type, and date range.
6.  Display upcoming events.
7.  Define behavior for overlapping events.
8.  Record who created/updated events if auditing is enabled.

## Date-range checking

When an applicant selects dates: 1. Request calendar events for the
selected range. 2. Calculate weekends consistently. 3. Display affected
dates and event names. 4. Clearly identify whether each date is a
weekend, holiday, normal working day, or multiple categories. 5. Display
warnings before final submission. 6. Repeat relevant policy validation
on the server during submission. 7. Do not let the browser's
date/timezone conversion shift a selected calendar day.

## Date handling design

-   Treat leave dates and holiday dates as calendar dates, not arbitrary
    instants.
-   Establish a single serialization convention, such as `YYYY-MM-DD`,
    for date-only fields.
-   Use a dedicated utility to parse, compare, enumerate, and format
    date-only values.
-   Use the institution's configured timezone when determining "today"
    and "currently on leave."
-   Avoid converting a date-only value to UTC midnight and then
    formatting it in a different timezone without a clear convention.
-   Test dates around month-end, year-end, leap years, and timezone
    boundaries.

## Deliverables

-   Shared interactive calendar.
-   Admin CRUD for calendar events.
-   Date-range warning service.
-   Correct date handling across client and server.

## Acceptance criteria

-   Multi-day holidays render correctly.
-   Weekend and holiday warnings match the selected dates.
-   Admin can add/edit/delete events.
-   Holiday warnings do not automatically reject applications.
-   The same date is shown consistently after saving and reloading.

------------------------------------------------------------------------

# STAGE 9 --- Leave History, Letter Printing, and PDF

## Goal

Make past and current leave records easy to inspect and preserve formal
letters.

## History page

Display: - Application ID. - Submission date. - Start and end dates. -
Purpose. - Calendar-day duration. - Policy-calculated duration if
applicable. - Status. - Decision date. - Rejection reason, where
applicable. - Action to view/print the letter.

## Functional rules

1.  Students and teachers see only their own records.
2.  Admin can open a person's history through authorized admin screens.
3.  History uses pagination if records become large.
4.  Provide status/date filters if useful.
5.  Keep application count and leave-day totals distinct.
6.  Show pending decisions without inventing a decision date.
7.  Show rejection reasons only where they exist.
8.  Make letter content readable and printable.

## Printing/PDF

-   Implement print CSS so navigation and buttons do not appear in the
    printed letter.
-   If PDF is included, generate it from trusted saved
    application/letter data.
-   Verify the user's authorization before returning a PDF.
-   Include application ID and current status.
-   Include decision date and rejection reason when applicable.
-   Avoid trusting client-generated PDF text as the official letter.

## Deliverables

-   Leave history page.
-   Individual application detail.
-   Print-friendly generated letters.
-   PDF generation if included in the agreed release.

## Acceptance criteria

-   History reflects persisted records after refresh.
-   Applicant access is restricted to their own history.
-   Print output is clean and readable.
-   PDF content matches the authorized application record.

------------------------------------------------------------------------

# STAGE 10 --- UI/UX, Accessibility, and Responsive Behavior

## Goal

Make all three role interfaces consistent, clear, and usable on desktop,
tablet, and mobile.

## Shared design system

-   Consistent typography, spacing, borders, and color tokens.
-   Collapsible sidebar on desktop and suitable mobile navigation.
-   Shared header with current-user menu and notification bell.
-   Reusable statistic cards, tables, forms, dialogs, badges, alerts,
    and empty states.
-   Status badges for Pending, Approved, and Rejected.
-   Consistent date formatting.
-   Loading skeletons or indicators for network operations.
-   Toasts or inline feedback for success and errors.
-   Confirmation dialogs for consequential actions.
-   No unnecessary animation or visual clutter.

## Role-specific navigation

### Admin

-   Dashboard.
-   Students.
-   Teachers.
-   Leave Applications.
-   Academic Calendar.
-   Institution Settings.
-   Notifications if needed.
-   Profile/logout.

### Student

-   Dashboard.
-   Apply for Leave.
-   My Applications / History.
-   Academic Calendar.
-   Notifications.
-   Profile/logout.

### Teacher

-   Dashboard.
-   Apply for Leave.
-   My Applications / History.
-   Academic Calendar.
-   Notifications.
-   Profile/logout.

## Form and table behavior

-   Use accessible labels and clear required-field indicators.
-   Keep validation messages near the relevant fields.
-   Support keyboard navigation and visible focus states.
-   Make tables responsive; use a mobile card/list layout if a wide
    table becomes unusable.
-   Add table empty states and explain how to get started.
-   Ensure buttons show disabled/loading states during requests.
-   Ask for confirmation before approving, rejecting, deleting a
    calendar event, or deactivating an account.
-   Do not show actions that a role cannot use, while still enforcing
    authorization on the server.

## Deliverables

-   Consistent design system.
-   Responsive layouts for all roles.
-   Accessible controls and complete UI states.

## Acceptance criteria

-   Core workflows are usable at desktop, tablet, and mobile widths.
-   No important action is hidden behind inaccessible hover-only
    behavior.
-   Errors and empty states are understandable.
-   Status is communicated through text as well as color.
-   All buttons and links perform the action they advertise.

------------------------------------------------------------------------

# STAGE 11 --- Security, Validation, Reliability, and Error Handling

## Goal

Harden the application against common errors and unauthorized access
before release.

## Security checklist

1.  Hash passwords with a suitable password-hashing algorithm.
2.  Keep secrets in environment variables and rotate exposed secrets.
3.  Enforce authorization on every protected backend route.
4.  Enforce ownership checks on application and notification resources.
5.  Validate and normalize all request data on the server.
6.  Use allowlists for editable fields and sortable query fields.
7.  Configure CORS narrowly for the deployment.
8.  Use secure HTTP headers.
9.  Apply login rate limits and appropriate request limits.
10. Configure cookie security and CSRF protection if cookie-based
    authentication is used.
11. Avoid long-lived bearer tokens in unsafe browser storage.
12. Prevent NoSQL operator injection by validating accepted fields and
    query values.
13. Avoid exposing stack traces, secrets, database URIs, and password
    hashes.
14. Prevent duplicate decisions with concurrency-safe database
    operations.
15. Ensure notification recipient IDs are server-derived.
16. Restrict file generation/download routes by ownership/role.
17. Avoid logging credentials, session cookies, tokens, or unnecessary
    personal data.
18. Consider an audit trail for important administrative actions.
19. Ensure account deactivation affects authentication and sessions
    according to policy.
20. Keep dependencies updated and inspect known vulnerabilities before
    deployment.

## Error handling

Create a consistent mapping for: - `400 Bad Request`: malformed input. -
`401 Unauthorized`: no valid authentication. - `403 Forbidden`:
authenticated but not permitted. - `404 Not Found`: resource does not
exist or is intentionally hidden to prevent disclosure. -
`409 Conflict`: duplicate identifier or already-decided application. -
`422 Unprocessable Entity`: validly shaped request that fails business
validation, if this convention is used consistently. -
`429 Too Many Requests`: rate limit reached. -
`500 Internal Server Error`: unexpected server error.

Choose and document whether validation errors use 400 or 422; be
consistent.

## Reliability rules

-   Do not show success before the server confirms the write.
-   Prevent double submission in the UI.
-   Handle network failures and session expiration.
-   Do not silently swallow failed notification creation.
-   Use transactions where supported for multi-document critical
    operations, or document a reliable recovery strategy.
-   Ensure pagination and filters cannot produce unbounded queries.
-   Make startup fail clearly if required configuration is invalid.

## Deliverables

-   Central validation and error handling.
-   Security middleware.
-   Documented configuration and operational behavior.

## Acceptance criteria

-   Unauthorized and malformed requests are rejected.
-   Errors are understandable without exposing internals.
-   Critical write failures do not produce false success messages.
-   Security-sensitive workflows are covered by automated tests.

------------------------------------------------------------------------

# STAGE 12 --- Testing and End-to-End Verification

## Goal

Prove that the complete workflow works, including negative and
unauthorized cases.

## Test layers

### Unit tests

Test isolated utilities and services: - Date-only parsing/comparison. -
Inclusive calendar-day calculation. - Policy-based leave-day
calculation. - Letter generation. - Input validators. - Status
transition rules. - Statistics calculations.

### API/integration tests

Test routes with a test database or isolated test data: -
Login/logout/current user. - Create and deactivate users. - Submit
leave. - List own applications. - Admin list/filter applications. -
Approve/reject application. - Create and read notifications. - Mark
notification read. - Calendar CRUD and range checking. - Dashboard
aggregation. - Unauthorized access and ownership boundaries.

### Frontend tests

Test key components and interactions: - Protected route behavior. - Form
validation and error display. - Loading/disabled submit behavior. -
Filter/search controls. - Approve/reject confirmation dialogs. -
Notification unread state. - Calendar warnings. - Responsive navigation.

### End-to-end tests

Run the main workflows through the browser against the real application
stack.

## Required end-to-end scenarios

1.  Admin signs in.
2.  Admin creates a student account.
3.  Student signs in and changes temporary password if required.
4.  Student selects dates and enters purpose.
5.  Calendar warning is displayed when weekends/holidays overlap.
6.  Student reviews and submits the request.
7.  The server saves a unique application ID, generated letter, and
    Pending status.
8.  The application appears in the admin dashboard.
9.  Admin opens the letter and approves the application.
10. The application status and decision metadata are saved.
11. The student receives the correct notification.
12. Student dashboard, history, and calendar reflect the approved leave.
13. Repeat with a rejection and verify the reason is displayed.
14. Repeat the workflow for a teacher.
15. Verify that students and teachers cannot access each other's
    records.
16. Verify that a non-admin cannot call approval/rejection endpoints.
17. Verify that a second decision cannot overwrite the first.
18. Verify empty purpose, invalid date order, malformed IDs, and invalid
    query filters.
19. Verify account deactivation blocks access.
20. Verify date ranges around weekends, holidays, leap days, month
    boundaries, and year boundaries.
21. Verify counts after page refresh and a new login.
22. Verify database errors do not create false success messages.

## Deliverables

-   Automated test suites where practical.
-   Manual QA checklist.
-   Bug list and verified fixes.
-   Test instructions in README.

## Acceptance criteria

-   All critical scenarios pass.
-   Negative/unauthorized cases pass.
-   Any unsupported feature is clearly marked as not implemented rather
    than described as complete.

------------------------------------------------------------------------

# STAGE 13 --- Deployment, Documentation, and Handover

## Goal

Make the project reproducible, configurable, and ready to run in a real
environment.

## Deployment tasks

1.  Choose deployment targets for frontend, backend, and MongoDB.
2.  Configure production environment variables through the host's secret
    manager.
3.  Set production frontend origin and CORS allowlist.
4.  Use HTTPS.
5.  Configure production cookie/security settings for the selected
    authentication design.
6.  Configure database access permissions and network restrictions.
7.  Run production build and startup checks.
8.  Add health monitoring and useful server logs without sensitive data.
9.  Define backup and restore procedures for the database.
10. Define how indexes and any future schema/data migrations are
    applied.
11. Create a safe admin-provisioning process.
12. Verify the deployment with test accounts and the full end-to-end
    flow.
13. Remove demo credentials and development-only endpoints from
    production.

## README requirements

Include: - Project purpose and role descriptions. - Architecture diagram
or explanation. - Technology stack. - Prerequisites and supported
runtime versions. - Installation steps for client and server. -
Environment variable setup. - MongoDB setup. - First-admin
provisioning. - Local development commands. - Test commands. -
Production build/deployment outline. - API route overview. - Known
limitations. - Security notes. - Troubleshooting common
startup/database/CORS errors.

## Deliverables

-   Complete source code.
-   `.env.example` without secrets.
-   Database setup and first-admin instructions.
-   README.
-   Automated/manual testing instructions.
-   Deployment and backup notes.

## Acceptance criteria

-   A new developer can follow the README to run the project.
-   No real secret is committed.
-   Admin setup is secure and repeatable.
-   The deployed application passes the main end-to-end workflow.
-   The project documentation accurately distinguishes implemented,
    optional, and future features.

------------------------------------------------------------------------

# 6. Recommended Build Order and Dependencies

Follow this order to reduce rework:

``` text
Stage 0: Inspect existing project
        |
Stage 1: App setup and configuration
        |
Stage 2: Database models and data rules
        |
Stage 3: Authentication and authorization
        |
Stage 4: Admin user management
        |
Stage 5: Leave submission and letter generation
        |
Stage 6: Admin approval/rejection
        |
Stage 7: Notifications and dashboards
        |
Stage 8: Academic calendar
        |
Stage 9: History, printing, and PDF
        |
Stage 10: UI/UX and responsive refinement
        |
Stage 11: Security and reliability hardening
        |
Stage 12: Testing and end-to-end verification
        |
Stage 13: Deployment and documentation
```

Some UI work can be done alongside backend work, but each feature should
be integrated end to end. For example, do not declare "notifications
complete" merely because the notification bell is visible; the database
record, recipient restriction, unread count, read action, and relevant
workflow must all work.

------------------------------------------------------------------------

# 7. Feature-to-Stage Traceability

  Requirement                           Primary stage   Related stages
  ------------------------------------- --------------- ----------------
  Inspect existing codebase             0               1--13
  App configuration and DB connection   1               13
  Models, relationships, indexes        2               5--9
  Authentication and role access        3               4--12
  Student/teacher account CRUD          4               3, 11, 12
  Apply for leave                       5               2, 3, 8, 12
  Generate formal leave letter          5               9, 12
  Admin review/approval/rejection       6               3, 7, 11, 12
  Notifications                         7               6, 11, 12
  Role-specific dashboards/statistics   7               6, 12
  Academic calendar and holidays        8               5, 12
  Leave history and print/PDF           9               5, 6, 12
  Responsive/accessibility work         10              All UI stages
  Security and reliability              11              All stages
  Automated and end-to-end tests        12              All stages
  Deployment and README                 13              1, 11, 12

------------------------------------------------------------------------

# 8. API and UI Implementation Conventions

## API conventions

-   Use `/api/v1`.
-   Use consistent JSON responses.
-   Use appropriate HTTP status codes.
-   Validate all inputs server-side.
-   Use pagination for large collections.
-   Allowlist filters and sort fields.
-   Never return secrets or password hashes.
-   Derive applicant and notification-recipient identity from
    authenticated server context.
-   Document request/response shapes and error codes.

## Frontend conventions

-   Organize code by feature rather than putting the entire application
    in one component.
-   Keep API calls in service modules.
-   Keep reusable visual components in shared folders.
-   Keep role-specific layouts distinct while sharing common components.
-   Use controlled forms with validation.
-   Display loading, success, empty, and error states.
-   Refresh server data after mutations or update local state only from
    confirmed server responses.
-   Never treat frontend route guards as a security boundary.

## Naming and status conventions

-   Use one consistent spelling for `Pending`, `Approved`, and
    `Rejected`.
-   Use one consistent convention for role values: `admin`, `student`,
    `teacher`.
-   Use a single date-only serialization format throughout the
    application.
-   Define duration calculation in one shared backend utility rather
    than duplicating it in multiple controllers.
-   Keep application ID generation on the server.
-   Use the same authorization rules for detail, letter, history, and
    PDF endpoints.

------------------------------------------------------------------------

# 9. Definition of Done

The project is ready for final delivery only when all applicable points
below are verified.

## Functional

-   [ ] Admin can sign in and manage student/teacher accounts.
-   [ ] Students and teachers can sign in securely.
-   [ ] Each role sees the correct dashboard and navigation.
-   [ ] Students and teachers can submit leave requests.
-   [ ] The server generates formal letters from actual stored data.
-   [ ] Applications are saved with unique IDs and Pending status.
-   [ ] Admin can view/filter applications and letters.
-   [ ] Admin can approve/reject only pending applications.
-   [ ] Duplicate decisions are blocked.
-   [ ] The correct applicant receives a persisted notification.
-   [ ] Notification read/unread state works.
-   [ ] Calendar holidays and weekends are displayed and checked.
-   [ ] Leave history and statistics are accurate.
-   [ ] Printing works; PDF works if included in the agreed scope.
-   [ ] Dashboard figures come from the database.
-   [ ] Every visible button, form, table action, filter, and calendar
    operation works.

## Security

-   [ ] Backend role checks protect every restricted route.
-   [ ] Ownership checks prevent cross-user data access.
-   [ ] Passwords are hashed.
-   [ ] Secrets are not committed.
-   [ ] Inactive accounts are blocked according to policy.
-   [ ] Input validation and safe error handling are in place.
-   [ ] Sensitive operations are rate-limited or otherwise protected as
    appropriate.
-   [ ] Protected fields cannot be changed by client-supplied values.

## Quality and delivery

-   [ ] Frontend and backend build/run successfully.
-   [ ] Critical automated tests pass.
-   [ ] End-to-end student workflow passes.
-   [ ] End-to-end teacher workflow passes.
-   [ ] Rejection workflow passes.
-   [ ] Calendar/date boundary tests pass.
-   [ ] README and `.env.example` are complete.
-   [ ] Database setup and admin provisioning are documented.
-   [ ] Known limitations are listed honestly.

------------------------------------------------------------------------

# 10. Instructions for the Developer or Coding Agent

1.  Inspect the project directory first. Do not overwrite existing
    working files without understanding them.
2.  Use this document as the source implementation plan and keep a
    checklist of completed stages.
3.  Complete Stage 0 before coding features.
4.  Work stage by stage; avoid generating the entire system as one
    giant, untested change.
5.  For every feature, implement the model/rules, backend API,
    authorization, frontend UI, loading/error states, and tests.
6.  Use real database records. Clearly label seed data as
    development/test data.
7.  Do not hardcode dashboard statistics or fake successful API
    responses.
8.  Do not mark a feature complete until it has been run and tested.
9.  If a policy decision is unknown, record the assumption and ask for
    confirmation rather than silently inventing a rule.
10. If a dependency or external service needs credentials, document
    setup and keep a working local path where possible.
11. After each stage, report: files changed, features implemented, tests
    run, test results, known issues, and the next stage.
12. Run the application, inspect browser and server errors, fix issues,
    and rerun the relevant tests before final delivery.
13. Keep this architecture document updated if the actual codebase
    requires a justified architectural change.
14. Never expose real credentials, API keys, database URIs, or session
    secrets in source files, logs, screenshots, or documentation.

**Final outcome:** A secure, responsive, database-backed Online Leave
Management System with three role-specific interfaces, generated leave
letters, reliable approval/rejection, notifications, calendar and
holiday management, accurate history/statistics, tests, and setup
documentation.
