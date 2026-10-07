# Coordinator file allocation

These are the final paths after the full JavaScript restructuring. The Expo app is in `mobile/src/`; the backend runs native JavaScript from `backend/src/server.js`.

## Mobile workload

| Feature | Actual files | Purpose |
| --- | --- | --- |
| Coordinator login and role selection | `mobile/src/app/(tabs)/index.jsx` | Existing login interface and actions |
| Auth state, login/logout | `mobile/src/services/CoordinatorAuth.jsx`, `mobile/src/services/sessionStorage.js` | Context, JWT/session persistence and logout |
| Protected navigation | `mobile/src/app/_layout.jsx`, `mobile/src/app/(tabs)/_layout.jsx` | Existing auth guard and stack routes |
| Coordinator Dashboard | `mobile/src/app/(tabs)/dashboard.jsx`, `mobile/src/components/Coordinator/CoordinatorDashboard.jsx` | Statistics, recent uploads and workflow entry points |
| Master upload (Create) | `mobile/src/app/(tabs)/timetable.jsx`, `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx` (`UploadTimetableScreen`) | Select/upload a timetable |
| Master list (Read) | `mobile/src/app/(tabs)/master-timetables.jsx`, `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` (`UploadedMasterTimetablesScreen`) | Saved file cards and pagination |
| Master view (Read) | `mobile/src/app/(tabs)/master-view.jsx`, `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` (`ViewMasterTimetableScreen`) | Stored file metadata and sessions |
| Master rename (Update) | `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` | Existing rename dialog and persisted API update |
| Master delete (Delete) | `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` | Existing confirmation and API deletion |
| Subgroup upload, read, edit, delete | `mobile/src/app/(tabs)/subgroups.jsx`, `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx` (`UploadSubgroupsScreen`) | Existing subgroup CRUD |
| Edit forms | `mobile/src/components/Coordinator/CoordinatorRecordEditor.jsx` | Existing shared record form |
| Validation | `mobile/src/app/(tabs)/validation.jsx`, `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` (`ValidateDataScreen`) | Run/read validation |
| Error list and invalid record identification | `mobile/src/app/(tabs)/errors.jsx`, `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` (`ValidationErrorsScreen`) | Error filtering and correction entry |
| Correct/Update Data, justification, Save Changes | `mobile/src/app/(tabs)/update.jsx`, `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` (`UpdateDataScreen`) | Existing correction, save failure/success and next-record navigation |
| Coordinator profile/logout | `mobile/src/app/(tabs)/profile.jsx`, `mobile/src/components/Coordinator/CoordinatorProfileScreen.jsx` | Existing profile screen |
| Shared layout, navigation and controls | `mobile/src/components/Coordinator/CoordinatorUI.jsx` | Scaffold, bottom navigation, buttons, panels and badges |
| Existing visual theme | `mobile/src/constants/CoordinatorTheme.js` | Colors, spacing and dimensions |
| Central API requests | `mobile/src/services/api.js` | Every existing Coordinator API method; reads `EXPO_PUBLIC_API_URL` |
| Mobile environment/import configuration | `.env` (ignored), `.env.example`, `jsconfig.json`, `app.json` | API base URL, aliases and Expo configuration |

## Backend workload

| Responsibility | Actual files |
| --- | --- |
| Startup and API port/host | `backend/src/server.js` |
| API mounting and CORS | `backend/src/app.js` |
| MongoDB environment connection | `backend/src/config/database.js` |
| Login controller/route/model | `backend/src/controllers/authController.js`, `backend/src/routes/authRoutes.js`, `backend/src/models/User.js` |
| JWT and Coordinator authorization | `backend/src/middleware/authMiddleware.js` |
| Dashboard statistics | `backend/src/controllers/dashboardController.js`, `backend/src/routes/dashboardRoutes.js` |
| Master CRUD/view/rename | `backend/src/controllers/timetableController.js`, `backend/src/routes/timetableRoutes.js`, `backend/src/models/Timetable.js` |
| Master and subgroup upload handlers | `backend/src/controllers/fileUploadController.js` |
| Upload file storage/limits | `backend/src/middleware/uploadMiddleware.js` |
| Reading master sessions | `backend/src/services/timetableSessionService.js` |
| Subgroup CRUD | `backend/src/controllers/subgroupController.js`, `backend/src/routes/subgroupRoutes.js`, `backend/src/models/Subgroup.js` |
| Run/reconcile validation | `backend/src/controllers/validationController.js`, `backend/src/routes/validationRoutes.js`, `backend/src/models/ValidationResult.js` |
| Clash, capacity and resource rules | `backend/src/services/validationService.js` |
| Errors, corrections, justification and audit | `backend/src/controllers/errorController.js`, `backend/src/routes/errorRoutes.js`, `backend/src/models/ValidationError.js` |
| Request parsing and errors | `backend/src/utils/request.js`, `backend/src/utils/HttpError.js`, `backend/src/middleware/errorMiddleware.js` |
| Existing seed script | `backend/src/seed/seed.js` |
| Environment template | `backend/.env.example`; secrets only in ignored `backend/.env` |
| Existing automated tests | `backend/src/tests/validationService.test.js`, `backend/src/tests/coordinator.integration.test.js`, `backend/src/tests/masterTimetable.integration.test.js` |

Coordinator functionality was not intentionally changed. Controllers, schemas, CRUD, validation, correction, justification, authentication and navigation behavior were preserved.
