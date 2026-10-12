# Coordinator file allocation

The team TypeScript/CommonJS architecture is preserved; only Coordinator additions use JavaScript. The Expo app is in `mobile/src/`; the backend runs native JavaScript from `backend/src/server.js`.

## Mobile workload

| Feature | Actual files | Purpose |
| --- | --- | --- |
| Coordinator login and role selection | `mobile/src/app/coordinator/index.jsx` | Existing login interface and actions |
| Auth state, login/logout | `mobile/src/services/CoordinatorAuth.jsx`, `mobile/src/services/sessionStorage.js` | Context, JWT/session persistence and logout |
| Protected navigation | `mobile/src/app/_layout.tsx`, `mobile/src/app/coordinator/_layout.jsx` | Existing auth guard and stack routes |
| Coordinator Dashboard | `mobile/src/app/coordinator/dashboard.jsx`, `mobile/src/components/Coordinator/CoordinatorDashboard.jsx` | Statistics, recent uploads and workflow entry points |
| Master upload (Create) | `mobile/src/app/coordinator/timetable.jsx`, `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx` (`UploadTimetableScreen`) | Select/upload a timetable |
| Master list (Read) | `mobile/src/app/coordinator/master-timetables.jsx`, `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` (`UploadedMasterTimetablesScreen`) | Saved file cards and pagination |
| Master view (Read) | `mobile/src/app/coordinator/master-view.jsx`, `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` (`ViewMasterTimetableScreen`) | Stored file metadata and sessions |
| Master rename (Update) | `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` | Existing rename dialog and persisted API update |
| Master delete (Delete) | `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` | Existing confirmation and API deletion |
| Subgroup upload, read, edit, delete | `mobile/src/app/coordinator/subgroups.jsx`, `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx` (`UploadSubgroupsScreen`) | Existing subgroup CRUD |
| Edit forms | `mobile/src/components/Coordinator/CoordinatorRecordEditor.jsx` | Existing shared record form |
| Validation | `mobile/src/app/coordinator/validation.jsx`, `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` (`ValidateDataScreen`) | Run/read validation |
| Error list and invalid record identification | `mobile/src/app/coordinator/errors.jsx`, `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` (`ValidationErrorsScreen`) | Error filtering and correction entry |
| Correct/Update Data, justification, Save Changes | `mobile/src/app/coordinator/update.jsx`, `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` (`UpdateDataScreen`) | Existing correction, save failure/success and next-record navigation |
| Coordinator profile/logout | `mobile/src/app/coordinator/profile.jsx`, `mobile/src/components/Coordinator/CoordinatorProfileScreen.jsx` | Existing profile screen |
| Shared layout, navigation and controls | `mobile/src/components/Coordinator/CoordinatorUI.jsx` | Scaffold, bottom navigation, buttons, panels and badges |
| Existing visual theme | `mobile/src/constants/CoordinatorTheme.js` | Colors, spacing and dimensions |
| Central API requests | `mobile/src/services/coordinatorApi.js` | Every existing Coordinator API method; reads `EXPO_PUBLIC_API_URL` |
| Mobile environment/import configuration | `mobile/.env` (ignored), `mobile/tsconfig.json`, `mobile/app.json` | API base URL, aliases and Expo configuration |

## Backend workload

| Responsibility | Actual files |
| --- | --- |
| Startup and API port/host | `backend/src/server.js` |
| API mounting and CORS | `backend/src/coordinator/router.js` |
| MongoDB environment connection | `backend/src/config/db.js` |
| Login controller/route/model | `backend/src/coordinator/controllers/authController.js`, `backend/src/coordinator/routes/authRoutes.js`, `backend/src/models/User.js` |
| JWT and Coordinator authorization | `backend/src/coordinator/middleware/authMiddleware.js` |
| Dashboard statistics | `backend/src/coordinator/controllers/dashboardController.js`, `backend/src/coordinator/routes/dashboardRoutes.js` |
| Master CRUD/view/rename | `backend/src/coordinator/controllers/timetableController.js`, `backend/src/coordinator/routes/timetableRoutes.js`, `backend/src/coordinator/models/Timetable.js` |
| Master and subgroup upload handlers | `backend/src/coordinator/controllers/fileUploadController.js` |
| Upload file storage/limits | `backend/src/coordinator/middleware/uploadMiddleware.js` |
| Reading master sessions | `backend/src/coordinator/services/timetableSessionService.js` |
| Subgroup CRUD | `backend/src/coordinator/controllers/subgroupController.js`, `backend/src/coordinator/routes/subgroupRoutes.js`, `backend/src/coordinator/models/Subgroup.js` |
| Run/reconcile validation | `backend/src/coordinator/controllers/validationController.js`, `backend/src/coordinator/routes/validationRoutes.js`, `backend/src/coordinator/models/ValidationResult.js` |
| Clash, capacity and resource rules | `backend/src/coordinator/services/validationService.js` |
| Errors, corrections, justification and audit | `backend/src/coordinator/controllers/errorController.js`, `backend/src/coordinator/routes/errorRoutes.js`, `backend/src/coordinator/models/ValidationError.js` |
| Request parsing and errors | `backend/src/coordinator/utils/request.js`, `backend/src/coordinator/utils/HttpError.js`, `backend/src/coordinator/middleware/errorMiddleware.js` |
| Seed/account updates | Deferred to the separate account-fix submission |
| Environment template | Setup in `docs/COORDINATOR-INTEGRATION.md`; secrets only in ignored `backend/.env` |
| Existing automated tests | `backend/src/coordinator/tests/validationService.test.js`, `backend/src/coordinator/tests/coordinator.integration.test.js`, `backend/src/coordinator/tests/masterTimetable.integration.test.js` |

Coordinator workflows are retained. Authentication uses the team User model; API and screen URLs are namespaced to avoid collisions. See COORDINATOR-INTEGRATION.md.
