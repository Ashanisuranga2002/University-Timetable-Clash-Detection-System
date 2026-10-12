# Coordinator implementation and submission check

> Source-branch workflow reference, adapted to the integrated paths. See COORDINATOR-INTEGRATION.md for current setup and verification results.

The Coordinator implementation is integrated into the latest team architecture. The existing Student, Advisor and Admin routes, models and authentication are preserved. Coordinator uses the team's User records and has its own API namespace and nested screen layout. See [the file allocation](COORDINATOR-FILE-ALLOCATION.md) and [integration report](COORDINATOR-INTEGRATION.md).

## Two genuine CRUD flows

| Operation | Timetable | Subgroup |
| --- | --- | --- |
| Create | Upload CSV/XLSX; parsed sessions and metadata persist in MongoDB | Upload CSV/XLSX or Add Subgroup Record |
| Read | Saved Timetables; tap a file to read its sessions | Data Preview, with more records available |
| Update | Rename from the master list; metadata and session updates are also supported by the API | Tap a record → Edit record; flagged records use Error Queue → Edit / Fix Record |
| Delete | Delete with confirmation; associated subgroup and validation data are removed | Tap a record → Delete → confirm; related error references are removed |

Stored timetable session edits become the API's source of truth; the original uploaded file remains an archival copy. Timetable edits do not silently reassign students. Run validation after ordinary dataset changes.

## Save Changes

The coordinator edits subgroup/day/time/venue/lecturer fields (or picks an available session) and supplies a justification. The backend validates required fields, weekday, time format and ordering, known venues, master-schedule resource conflicts, student clashes, lecturer conflicts and capacity against the proposed dataset. Unchanged data, missing justification and remaining errors are rejected before writes. The screen keeps the draft and displays the error.

Successful correction updates the subgroup records, clears issues that no longer exist, records the justification/audit and saves a fresh validation summary. It returns to the error queue, or opens the next unresolved error with Save & Proceed to Next. Already-resolved records cannot be saved again. Matching-cohort corrections are validated together.

Replica-set MongoDB deployments use transactions. The configured standalone development MongoDB uses compensating rollback, tested by injecting a failure after record updates. Standalone rollback is not crash-atomic and does not provide multi-process transaction isolation; use a replica set for a concurrent production deployment. The existing notification checkbox records a request only; it does not deliver a push notification.

## Device walkthrough

1. Start the configured backend with `npm run dev` from `backend/`. From `mobile/` run `npx expo start`. Confirm the phone can reach the `.env` API URL, then sign in with an existing coordinator account.
2. Dashboard → Upload Timetable. Upload `docs/coordinator-fixtures/timetable.csv`. The app proceeds to Uploaded Master Timetables. Use Dashboard → Upload Subgroup Data next.
3. Upload `subgroups.csv`. Confirm two stored students appear. Leave and reopen the screen to confirm persistence.
4. Before running validation, tap a student → Edit record, change their name and save. Reopen to verify. Use Add Subgroup Record to create a separate record, then delete it and confirm it disappears after refresh.
5. Open Uploaded Master Timetables → View to read sessions. Rename the file, save and reopen to verify persistence.
6. Open its subgroups → Proceed to Validate Data → Run Validation Engine → View Validation Errors. R1 intentionally has capacity 1 but two students.
7. Open an error. Try Save Changes without justification: remain on screen. Enter justification and change only the lecturer: capacity still fails, draft remains and record is unchanged.
8. Change subgroup to B, day to Tuesday, venue to R2, retaining 09:00–10:00; enter a justification and save. Expect success, return to the error queue and cleared capacity issues. Reopen the subgroup to verify the stored correction. To test Save & Proceed to Next, use a dataset with another independent unresolved error.
9. Stop the API and attempt an edit: expect a connection error without success/navigation. Restart and retry.
10. Delete the demo timetable with confirmation. Verify its subgroup rows and validation errors are gone. Check back/cancel buttons and bottom navigation throughout.

## Verification

See [the integration report](COORDINATOR-INTEGRATION.md) for current results and remaining device checks.
