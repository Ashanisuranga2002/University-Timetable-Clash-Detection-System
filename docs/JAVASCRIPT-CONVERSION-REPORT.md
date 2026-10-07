# Full JavaScript conversion and restructuring

The latest request replaces the earlier backend-TypeScript-only constraint. Backend and mobile application source are now JavaScript/JSX. Existing API endpoints, route filenames, UI, validation rules and database configuration were preserved.

## Changes

- Converted 32 backend TypeScript files using the installed Babel TypeScript transform, removing type syntax and type-only imports. The backend now uses native ESM and explicit `.js` module paths.
- Moved 36 existing mobile JavaScript/JSX files into `mobile/src/`, grouped Coordinator/shared components and relocated platform-specific hooks without renaming routes.
- Moved mobile assets, package/lockfile, environment files and configuration into `mobile/`. Updated the `@/` alias, ESLint resolver scope and font asset path.
- Moved backend seed code to `src/seed/seed.js`; moved the runtime `HttpError` class from the old type declarations file into `src/utils/HttpError.js`.
- Removed backend TypeScript, tsx and declaration-only development dependencies. Backend scripts run Node directly. Added `npm run check` for native JavaScript syntax checking.
- Removed both obsolete tsconfig files. Expo starts successfully using `mobile/jsconfig.json` without recreating a tsconfig. Mobile TypeScript remains solely for Expo ESLint's required parser peer; React declarations support React Native/tooling peers.
- Existing locked dependency versions were unchanged in both projects. Both `npm install --offline` commands completed successfully using cached packages.
- Preserved `.env` values, existing uploads, existing database, user backup package file, and root project instructions/license. Stale generated build/cache output was moved outside the project to temporary storage.

## Verification actually performed

| Check | Result |
| --- | --- |
| Backend native syntax (`npm run check`) | Passed |
| Mobile lint (`npm run lint`) | Passed |
| Mobile JavaScript project (`npx tsc --noEmit -p jsconfig.json`) | Passed; `checkJs: false`, not TypeScript semantic coverage |
| Runtime AST comparison against pre-move snapshot | All 68 matched after type erasure, normalizing import/font paths |
| Internal import and route audit | All 139 internal imports/exports resolve to their original moved modules; all 16 route filenames preserved |
| Existing locked package versions | No version changes among retained packages |
| `RUN_DB_TESTS=1 npm test` | All 8 passed, no skips, using isolated disposable databases |
| CRUD/error/correction regression coverage | Master CSV/XLSX upload, read, rename, deletion, legacy file lookup; subgroup upload/CRUD, invalid edits, required justification, failed correction, successful correction, audit, injected save-failure rollback, revalidation and cascade deletion |
| Separate authentication smoke test | Password hashing/login, incorrect password rejection, JWT dashboard access and unauthenticated rejection passed in a disposable database |
| `npm start` from backend | Connected to configured local MongoDB and listened on port 5001 |
| API health over localhost and `172.20.10.4:5001` | Both passed |
| Expo startup from mobile | Metro started on port 8083 and selected `src/app` |
| Android native JS/Hermes export | Passed: 1,615 modules |
| iOS native JS/Hermes export | Passed: 1,512 modules |
| Physical-device login, navigation and interactive Coordinator flows | Not manually exercised; runtime-code preservation, backend tests and native bundles provide automated evidence only |
| Signed Android/iOS binaries | Not built; native bundles exported |

No seed was run against the application database. No secrets were placed in source or documentation. The existing local MongoDB setup was preserved; Atlas was not newly configured. No commits, pushes, resets or discards were performed.

For every source file's new location, see [PROJECT-FILE-ALLOCATION.md](PROJECT-FILE-ALLOCATION.md).
