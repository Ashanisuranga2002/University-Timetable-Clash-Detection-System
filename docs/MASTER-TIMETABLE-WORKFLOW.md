# Master Timetable file management

> Historical workflow implementation report. Source paths below reflect the current structure; earlier TypeScript/build checks describe the original implementation. See [the current conversion report](JAVASCRIPT-CONVERSION-REPORT.md) for current commands and verification.

## Scope and changed files

Only Master Timetable functionality was changed in this update:

- `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx`: changed only `UploadTimetableScreen` and removed its unused master-session type import. Upload now opens the master file list. The Subgroup component, its field definitions, shared spreadsheet picker and existing styles remain unchanged.
- `mobile/src/components/Coordinator/MasterTimetableScreens.jsx`: new uploaded-file list, persisted rename dialog, delete confirmation and read-only timetable viewer; pagination, loading and error states.
- `mobile/src/app/(tabs)/master-timetables.jsx`: file-list route.
- `mobile/src/app/(tabs)/master-view.jsx`: viewer route.
- `backend/src/controllers/timetableController.js`: validates names and preserves legacy file-backed sessions before a rename, allowing extension-free names without breaking View or subgroup correction.
- `backend/src/tests/masterTimetable.integration.test.js`: isolated MongoDB/API tests for master CRUD and subgroup regression after rename.
- `docs/MASTER-TIMETABLE-WORKFLOW.md`: this guide.

No dependencies, schema, storage system, API client, subgroup route/controller, validation service, correction screen, justification handling or Save Changes logic were changed. Existing source hashes and the Subgroup component body were compared with the start-of-task snapshot.

## Implemented workflow

Dashboard → Upload Master Timetable → choose CSV/XLSX → Upload → Uploaded Master Timetables → View / Rename / Delete.

Uploading does not navigate to Subgroup upload or correction. Subgroup functionality remains accessible through its existing dashboard entry and navigation.

| CRUD | Action | Existing API |
| --- | --- | --- |
| Create | Upload a valid CSV/XLSX | `POST /api/timetables/upload` |
| Read | List files and view persisted metadata/sessions | `GET /api/timetables`, `GET /api/timetables/:id`, `GET /api/timetables/:id/sessions` |
| Update | Rename; trimmed, nonempty name up to 255 characters, no control characters | `PUT /api/timetables/:id` with `{ "fileName": "Master Timetable October 2026" }` |
| Delete | Confirm deletion; refresh list after success | `DELETE /api/timetables/:id` |

The stored UUID file path is unchanged by rename. Older uploads without stored sessions are parsed using their original file name before the new display name is saved. Their schedule data remains identical and available to the unchanged Subgroup workflow. No new endpoint was needed.

Delete retains the existing backend behavior: deleting a master also deletes its linked subgroup records and validation data. The confirmation explicitly states this. Cancel sends no delete request. Records belonging to another master remain untouched.

## Exact manual test

1. Run `npm run dev` in `backend/`, then `npx expo start` in the project root. Use the configured API URL and an existing coordinator login.
2. Dashboard → Upload Master Timetable. Select `docs/coordinator-fixtures/timetable.csv` and tap **Upload Master Timetable**. Confirm the Uploaded Master Timetables screen opens, shows a success message, and lists the file with upload time and size. Confirm it does not open Subgroups or validation.
3. Tap **View**. Check the IT3060 sessions, Monday/Tuesday times and R1/R2 venues against the CSV. Go back to Uploaded Master Timetables.
4. Tap **Rename**. Clear the input and tap **Save**: expect an error and remain in the dialog. Enter `Master Timetable October 2026`, tap Save, and confirm success. Tap Refresh, leave/reopen the list, and confirm the name persists. View again and confirm session data is unchanged. Also test Cancel: the old name must remain.
5. Tap **Delete**, then Cancel: the item remains. Tap Delete again and confirm Delete: the item disappears and success is shown. Refresh and reopen the list: it stays deleted. Use a disposable master because linked subgroup data is also removed by the existing delete behavior.
6. Try an empty/invalid CSV and verify upload fails without success navigation. Stop the API temporarily and try upload/rename/delete: expect an error, keep the current screen/draft, and retry after restarting. Cancel the document picker and verify no upload occurs.
7. Regression: upload the master fixture again, then use the unchanged Dashboard → Subgroup entry to select it. Upload `docs/coordinator-fixtures/subgroups.csv`; validate and open a capacity error. Try saving without justification and with a lecturer-only edit (capacity still invalid). Then set subgroup B, Tuesday, R2, 09:00–10:00 with a justification. Save, revalidate, and confirm data is clean. Rename the master before or after correction and confirm subgroup data and correction navigation still work.

## Verification

- Frontend TypeScript and Expo lint passed.
- Backend TypeScript/build passed.
- All eight backend tests passed using separate temporary databases, including the unchanged Coordinator integration test and new Master test.
- Master tests cover CSV/XLSX upload, invalid/empty files, invalid names, database persistence, extension-free legacy rename, unchanged subgroup/error records after rename, successful subgroup correction/revalidation, delete persistence and physical file removal.
- Android and iOS bundle exports passed with the new routes.

Run database tests from `backend/` using `RUN_DB_TESTS=1 npm test`. Tests create/drop only their own temporary databases.

Remaining before submission: perform the phone walkthrough above. Native dialogs, keyboard behavior, file picking and tap navigation were not manually exercised in this environment. No known failure remains in the automated checks.
