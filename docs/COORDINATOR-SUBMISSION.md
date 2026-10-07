# Coordinator implementation and submission check

> Historical workflow implementation report. Source paths below reflect the current structure; earlier TypeScript/build checks describe the original implementation. See [the current conversion report](JAVASCRIPT-CONVERSION-REPORT.md) for current commands and verification.

The existing Expo Router routes, visual theme, Express API and MongoDB models are retained. No RAG, AI service or new runtime library was added. The project dependencies were aligned with SDK 57, which the existing Expo module versions already targeted. The previous Expo 44 / React Native 0.72 / SDK 57 combination was incompatible.

## Changed files

- `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx`: timetable details/session editing; subgroup field editing and manual creation; existing upload/read/delete flows; academic-period form usable on Android and iOS; refresh on screen focus.
- `mobile/src/components/Coordinator/CoordinatorRecordEditor.jsx`: reusable form with required fields, loading state, save errors and cancellation.
- `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx`: editable correction fields, justification, backend validation, success navigation and failed-save handling.
- `mobile/src/components/Coordinator/CoordinatorDashboard.jsx`, `mobile/src/components/Coordinator/CoordinatorUI.jsx`: missing formatting helpers, focus refresh and noninteractive informational labels.
- `mobile/src/services/api.js`: correction payload, subgroup program field, timetable sessions and friendly request errors.
- `backend/src/controllers/{errorController,subgroupController,timetableController,fileUploadController}.ts`: correction validation/persistence, partial time-update validation, deletion cleanup, timetable sessions and upload validation.
- `backend/src/models/Timetable.js`, `backend/src/services/{timetableSessionService,validationService}.ts`: stored editable sessions; strict timetable row checking; fixed capacity-error persistence.
- `backend/src/tests/coordinator.integration.test.js`: real HTTP/MongoDB regression coverage, including forced save failure and rollback.
- `package.json`, `package-lock.json`, `tsconfig.json`: compatible dependencies and separate frontend/backend typecheck scope.
- `mobile/src/app/+not-found.jsx`, `mobile/src/components/common/EditScreenInfo.jsx`, `mobile/src/hooks/useClientOnlyValue.web.js`: small pre-existing lint fixes.
- This guide and `docs/coordinator-fixtures/*.csv`.

## Two genuine CRUD flows

| Operation | Timetable | Subgroup |
| --- | --- | --- |
| Create | Upload CSV/XLSX; parsed sessions and metadata persist in MongoDB | Upload CSV/XLSX or Add Subgroup Record |
| Read | Saved Timetables; tap a file to read its sessions | Data Preview, with more records available |
| Update | Edit Timetable Details or Edit Session; changes persist in MongoDB | Tap a record → Edit record; flagged records use Error Queue → Edit / Fix Record |
| Delete | Delete with confirmation; associated subgroup and validation data are removed | Tap a record → Delete → confirm; related error references are removed |

Stored timetable session edits become the API's source of truth; the original uploaded file remains an archival copy. Timetable edits do not silently reassign students. Run validation after ordinary dataset changes.

## Save Changes

The coordinator edits subgroup/day/time/venue/lecturer fields (or picks an available session) and supplies a justification. The backend validates required fields, weekday, time format and ordering, known venues, master-schedule resource conflicts, student clashes, lecturer conflicts and capacity against the proposed dataset. Unchanged data, missing justification and remaining errors are rejected before writes. The screen keeps the draft and displays the error.

Successful correction updates the subgroup records, clears issues that no longer exist, records the justification/audit and saves a fresh validation summary. It returns to the error queue, or opens the next unresolved error with Save & Proceed to Next. Already-resolved records cannot be saved again. Matching-cohort corrections are validated together.

Replica-set MongoDB deployments use transactions. The configured standalone development MongoDB uses compensating rollback, tested by injecting a failure after record updates. Standalone rollback is not crash-atomic and does not provide multi-process transaction isolation; use a replica set for a concurrent production deployment. The existing notification checkbox records a request only; it does not deliver a push notification.

## Device walkthrough

1. Start the configured backend with `npm run dev` from `backend/`. From the project root run `npx expo start`. Confirm the phone can reach the `.env` API URL, then sign in with an existing coordinator account.
2. Dashboard → Upload Timetable. Upload `docs/coordinator-fixtures/timetable.csv`. The app proceeds to subgroup upload.
3. Upload `subgroups.csv`. Confirm two stored students appear. Leave and reopen the screen to confirm persistence.
4. Before running validation, tap a student → Edit record, change their name and save. Reopen to verify. Use Add Subgroup Record to create a separate record, then delete it and confirm it disappears after refresh.
5. Return to Timetable; tap the saved file to read sessions. Edit Session and change a valid time, save, reopen to verify; restore the fixture's times. Edit Timetable Details and verify persistence too.
6. Open its subgroups → Proceed to Validate Data → Run Validation Engine → View Validation Errors. R1 intentionally has capacity 1 but two students.
7. Open an error. Try Save Changes without justification: remain on screen. Enter justification and change only the lecturer: capacity still fails, draft remains and record is unchanged.
8. Change subgroup to B, day to Tuesday, venue to R2, retaining 09:00–10:00; enter a justification and save. Expect success, return to the error queue and cleared capacity issues. Reopen the subgroup to verify the stored correction. To test Save & Proceed to Next, use a dataset with another independent unresolved error.
9. Stop the API and attempt an edit: expect a connection error without success/navigation. Restart and retry.
10. Delete the demo timetable with confirmation. Verify its subgroup rows and validation errors are gone. Check back/cancel buttons and bottom navigation throughout.

## Automated checks and remaining verification

Passed: Expo Doctor (21/21), frontend TypeScript, Expo lint, backend build/typecheck, six validation unit tests, the opt-in HTTP/MongoDB integration test (both CRUD flows, both uploads, invalid edits, justification, unresolved capacity, audit, successful correction, summary refresh, forced-save rollback and cascading deletion), and Android/iOS bundle export.

Run backend integration tests from `backend/` with `RUN_DB_TESTS=1 npm test`. They create and drop their own uniquely named database on the configured MongoDB server; they do not modify the application's database.

Before submission, complete the device walkthrough above on the actual phone/development build. No simulator UI interaction was available in this environment, so keyboard layout, document picker behavior, alert presentation and visual matching to Figma were not manually verified. No Figma file/reference was supplied; the existing theme/layout was preserved. Use an Expo SDK 57-compatible runtime.
