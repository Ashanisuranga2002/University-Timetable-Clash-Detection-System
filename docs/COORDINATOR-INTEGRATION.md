# Coordinator module submission

Prepared on 2026-10-12 on `feature/munsith-coordinator-module-review`, based on fetched `origin/main` at `e66bb2c899b4ebeb760a3ff7fa0fe594c242fb42`.
Module source: integration commit `94dedd317a555462b49ca050f89b666cc292c109`. The earlier Coordinator PR (`4ec9a1e`) is already in main; unchanged theme and record-editor files are inherited.

## Scope

Includes Coordinator navigation, dedicated sign-in, session storage, dashboard, timetable and subgroup CRUD, CSV/XLSX upload, validation/clash detection, error correction, tests and two intentional CSV fixtures under `docs/coordinator-fixtures/`.

Preserves all existing Student, Advisor and Admin files. Shared server changes only add a module mount before the existing JSON parser; shared login changes only add a dedicated Coordinator sign-in link. Existing role-selector login behavior and shared API transport remain unchanged.

The new module API is `/api/coordinator/module`. This avoids collisions between its subgroup record IDs and the existing `/api/coordinator/subgroups/:courseCode` Student/Advisor endpoint. The existing `/api/coordinator/preview-timetable` is also retained. Frontend requests and production integration tests use the new namespace.

## Setup

Install dependencies with `npm ci` in backend and mobile. Existing lockfile package versions are preserved. Set `MONGO_URI` through existing backend configuration and provide `JWT_SECRET` (at least 32 random characters for production). No environment files or secrets are included.

Use Admin user management to create an Active Coordinator account with a password. Open the dedicated **Coordinator sign in** link on the shared login screen. Optional `EXPO_PUBLIC_API_URL` is the team API base ending in `/api`; the client appends `/coordinator/module`. This submission retains the original client host/session behavior; subsequent fixes are deferred.

## Deferred submission

Commit `991129a` (shared login/API transport, status component, client test and login documentation) is not included. All seed work, `coordinatorAuth.integration.test.js` and `COORDINATOR-ACCOUNT-FIX.md` are deferred. The original staged files and stash are retained in the original worktree. No seed is run.

## Verification and limits

See the accompanying local review report for this preparation's actual test results. Database integration tests require explicit `RUN_DB_TESTS=1` with an isolated MongoDB URI and a test JWT secret. They are not evidence of a passing database workflow when skipped. Native upload and device interaction still require runtime verification. Historical workflow documentation describes intended behavior, not new test results.

Full-project lint/typechecking may expose existing team errors; those files are outside this submission. The namespace isolation test uses controller stubs to verify routing/JSON parsing and unauthenticated module protection, without accessing a database.
