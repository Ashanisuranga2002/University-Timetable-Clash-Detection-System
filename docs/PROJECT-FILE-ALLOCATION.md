# Final project file allocation

All paths below are relative to the repository root. This describes the actual files, not a proposed architecture.

```text
appp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/check-js.js
│   ├── README.md
│   ├── package.json
│   └── package-lock.json
├── mobile/
│   ├── assets/
│   ├── src/
│   │   ├── app/(tabs)/
│   │   ├── components/Coordinator/
│   │   ├── components/common/
│   │   ├── constants/
│   │   ├── hooks/
│   │   └── services/
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── LICENSE
│   ├── README.md
│   ├── app.json
│   ├── eslint.config.js
│   ├── jsconfig.json
│   ├── package.json
│   ├── package-lock.json
│   └── package.json.backup
├── docs/
├── AGENTS.md
├── LICENSE
└── README.md
```

Each application retains its own ignored `.env` and installed `node_modules/`, plus a safe `.env.example`. Backend uploads remain in `backend/uploads/`. Expo may generate ignored caches/declarations. Root Git metadata, ignore rules and editor settings remain at the repository root. The pre-existing mobile package backup is preserved and is not used to install or run the app. No empty `mobile/scripts/` folder was invented: there are no existing mobile utility scripts to allocate there.

## Backend responsibilities

| Folder/file | Purpose |
| --- | --- |
| `backend/src/config/` | MongoDB connection configuration |
| `backend/src/controllers/` | Authentication, dashboard, uploads, timetable/subgroup CRUD, validation and correction request handlers |
| `backend/src/middleware/` | JWT/role authorization, error responses and upload handling |
| `backend/src/models/` | Mongoose schemas/models |
| `backend/src/routes/` | Existing Express API routes |
| `backend/src/seed/` | Existing development seed dataset/script |
| `backend/src/services/` | Existing timetable parsing and validation rules; retained together without unnecessary splitting |
| `backend/src/utils/` | Request parsing helpers and runtime HttpError class |
| `backend/src/tests/` | Existing validation and HTTP/database regression tests, converted to JS |
| `backend/src/app.js` | Express middleware and route composition |
| `backend/src/server.js` | API startup, database connection and shutdown |
| `backend/scripts/check-js.js` | Native Node syntax verification |

## Mobile responsibilities

| Folder | Purpose |
| --- | --- |
| `mobile/src/app/` | Expo Router routes and layouts; all route filenames/URLs preserved |
| `mobile/src/components/Coordinator/` | Existing Coordinator dashboard, uploads, Master Timetable, correction, profile and shared Coordinator controls |
| `mobile/src/components/common/` | Shared template/theme/text/link UI |
| `mobile/src/constants/` | Existing centralized colors/theme |
| `mobile/src/hooks/` | Color-scheme and client-only hooks, including web variants |
| `mobile/src/services/` | Central API requests, authentication context and session storage |
| `mobile/assets/` | Existing fonts and images, moved unchanged |

`@/` resolves to `mobile/src/`. Backend relative module imports include `.js`. Environment values and API URLs are unchanged.

## Complete source-file move/conversion map

The mobile files had already been converted to JS/JSX before this restructuring. The table uses their names immediately before this task.

| Before | Final location |
| --- | --- |
| `app/(tabs)/_layout.jsx` | `mobile/src/app/(tabs)/_layout.jsx` |
| `app/(tabs)/dashboard.jsx` | `mobile/src/app/(tabs)/dashboard.jsx` |
| `app/(tabs)/errors.jsx` | `mobile/src/app/(tabs)/errors.jsx` |
| `app/(tabs)/index.jsx` | `mobile/src/app/(tabs)/index.jsx` |
| `app/(tabs)/master-timetables.jsx` | `mobile/src/app/(tabs)/master-timetables.jsx` |
| `app/(tabs)/master-view.jsx` | `mobile/src/app/(tabs)/master-view.jsx` |
| `app/(tabs)/profile.jsx` | `mobile/src/app/(tabs)/profile.jsx` |
| `app/(tabs)/subgroups.jsx` | `mobile/src/app/(tabs)/subgroups.jsx` |
| `app/(tabs)/timetable.jsx` | `mobile/src/app/(tabs)/timetable.jsx` |
| `app/(tabs)/two.jsx` | `mobile/src/app/(tabs)/two.jsx` |
| `app/(tabs)/update.jsx` | `mobile/src/app/(tabs)/update.jsx` |
| `app/(tabs)/validation.jsx` | `mobile/src/app/(tabs)/validation.jsx` |
| `app/+html.jsx` | `mobile/src/app/+html.jsx` |
| `app/+not-found.jsx` | `mobile/src/app/+not-found.jsx` |
| `app/_layout.jsx` | `mobile/src/app/_layout.jsx` |
| `app/modal.jsx` | `mobile/src/app/modal.jsx` |
| `backend/src/app.ts` | `backend/src/app.js` |
| `backend/src/config/database.ts` | `backend/src/config/database.js` |
| `backend/src/controllers/authController.ts` | `backend/src/controllers/authController.js` |
| `backend/src/controllers/dashboardController.ts` | `backend/src/controllers/dashboardController.js` |
| `backend/src/controllers/errorController.ts` | `backend/src/controllers/errorController.js` |
| `backend/src/controllers/fileUploadController.ts` | `backend/src/controllers/fileUploadController.js` |
| `backend/src/controllers/subgroupController.ts` | `backend/src/controllers/subgroupController.js` |
| `backend/src/controllers/timetableController.ts` | `backend/src/controllers/timetableController.js` |
| `backend/src/controllers/validationController.ts` | `backend/src/controllers/validationController.js` |
| `backend/src/middleware/authMiddleware.ts` | `backend/src/middleware/authMiddleware.js` |
| `backend/src/middleware/errorMiddleware.ts` | `backend/src/middleware/errorMiddleware.js` |
| `backend/src/middleware/uploadMiddleware.ts` | `backend/src/middleware/uploadMiddleware.js` |
| `backend/src/models/Subgroup.ts` | `backend/src/models/Subgroup.js` |
| `backend/src/models/Timetable.ts` | `backend/src/models/Timetable.js` |
| `backend/src/models/User.ts` | `backend/src/models/User.js` |
| `backend/src/models/ValidationError.ts` | `backend/src/models/ValidationError.js` |
| `backend/src/models/ValidationResult.ts` | `backend/src/models/ValidationResult.js` |
| `backend/src/routes/authRoutes.ts` | `backend/src/routes/authRoutes.js` |
| `backend/src/routes/dashboardRoutes.ts` | `backend/src/routes/dashboardRoutes.js` |
| `backend/src/routes/errorRoutes.ts` | `backend/src/routes/errorRoutes.js` |
| `backend/src/routes/subgroupRoutes.ts` | `backend/src/routes/subgroupRoutes.js` |
| `backend/src/routes/timetableRoutes.ts` | `backend/src/routes/timetableRoutes.js` |
| `backend/src/routes/validationRoutes.ts` | `backend/src/routes/validationRoutes.js` |
| `backend/src/scripts/seed.ts` | `backend/src/seed/seed.js` |
| `backend/src/server.ts` | `backend/src/server.js` |
| `backend/src/services/timetableSessionService.ts` | `backend/src/services/timetableSessionService.js` |
| `backend/src/services/validationService.ts` | `backend/src/services/validationService.js` |
| `backend/src/tests/coordinator.integration.test.ts` | `backend/src/tests/coordinator.integration.test.js` |
| `backend/src/tests/masterTimetable.integration.test.ts` | `backend/src/tests/masterTimetable.integration.test.js` |
| `backend/src/tests/validationService.test.ts` | `backend/src/tests/validationService.test.js` |
| `backend/src/types/index.ts` | `backend/src/utils/HttpError.js` |
| `backend/src/utils/request.ts` | `backend/src/utils/request.js` |
| `components/CoordinatorDashboard.jsx` | `mobile/src/components/Coordinator/CoordinatorDashboard.jsx` |
| `components/CoordinatorProfileScreen.jsx` | `mobile/src/components/Coordinator/CoordinatorProfileScreen.jsx` |
| `components/CoordinatorRecordEditor.jsx` | `mobile/src/components/Coordinator/CoordinatorRecordEditor.jsx` |
| `components/CoordinatorUI.jsx` | `mobile/src/components/Coordinator/CoordinatorUI.jsx` |
| `components/CoordinatorUploadScreens.jsx` | `mobile/src/components/Coordinator/CoordinatorUploadScreens.jsx` |
| `components/CoordinatorValidationScreens.jsx` | `mobile/src/components/Coordinator/CoordinatorValidationScreens.jsx` |
| `components/EditScreenInfo.jsx` | `mobile/src/components/common/EditScreenInfo.jsx` |
| `components/ExternalLink.jsx` | `mobile/src/components/common/ExternalLink.jsx` |
| `components/MasterTimetableScreens.jsx` | `mobile/src/components/Coordinator/MasterTimetableScreens.jsx` |
| `components/StyledText.jsx` | `mobile/src/components/common/StyledText.jsx` |
| `components/Themed.jsx` | `mobile/src/components/common/Themed.jsx` |
| `components/useClientOnlyValue.js` | `mobile/src/hooks/useClientOnlyValue.js` |
| `components/useClientOnlyValue.web.js` | `mobile/src/hooks/useClientOnlyValue.web.js` |
| `components/useColorScheme.js` | `mobile/src/hooks/useColorScheme.js` |
| `components/useColorScheme.web.js` | `mobile/src/hooks/useColorScheme.web.js` |
| `constants/Colors.js` | `mobile/src/constants/Colors.js` |
| `constants/CoordinatorTheme.js` | `mobile/src/constants/CoordinatorTheme.js` |
| `services/CoordinatorAuth.jsx` | `mobile/src/services/CoordinatorAuth.jsx` |
| `services/api.js` | `mobile/src/services/api.js` |
| `services/sessionStorage.js` | `mobile/src/services/sessionStorage.js` |

Mobile config/package/lockfile, assets and `.env`/`.env.example` moved from root into `mobile/`. Root instructions, license and ignore rules were retained and also provided in `mobile/`. Project guides/fixtures stay in `docs/`; backend configuration and uploads stay under `backend/`. Old TypeScript configs and generated build caches are no longer used.
