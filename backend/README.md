# University Timetable API

This is a separate Express and JavaScript backend for the Expo application. It uses MongoDB through Mongoose. It parses `.xlsx` and `.csv` timetable/subgroup uploads, stores timetable files under the ignored local `uploads/` directory, and saves records and metadata in MongoDB. Uploaded subgroup files are parsed and discarded after their records are saved.

## Local setup

1. Ensure a local MongoDB server is running on `127.0.0.1:27017`, or set `MONGO_URI` in the ignored `backend/.env`.
2. Copy `.env.example` to `.env` and set `JWT_SECRET` to a new random secret. A development `.env` may already exist in your local checkout; it is ignored by Git.
3. Install and check JavaScript:

   ```sh
   cd /Users/user/Desktop/appp/backend
   npm install
   npm run check
   ```

4. Seed a development dataset, then start the API:

   ```sh
   npm run seed
   npm run dev
   ```

   The seed is idempotent for existing timetable, subgroup, validation, and coordinator data. It adds the coordinator only when `IT20601828` does not already exist and does not reset an existing password. The configured seed password is for local development only and must not be reused in production.

5. Check `GET http://localhost:5001/api/health`.

The development coordinator uses `IT20601828` and the value of `SEED_COORDINATOR_PASSWORD` in `.env` (the supplied example is `CoordinatorDevOnly2026!`). Passwords are hashed with bcrypt before storage.

## Database environment and port

Use `PORT=5001` and `MONGO_URI` in `.env`. The server listens on `0.0.0.0` for physical-device access. `MONGODB_URI` remains a compatibility fallback; new configurations should use `MONGO_URI`.

For Atlas, rotate the previously exposed database-user password in Atlas first. Copy the new connection string directly into the local `.env`; never paste it into source code, documentation or Git. `.env.example` contains placeholders only. Configure Atlas network access for the machine running this backend. Until a fresh Atlas URI is supplied, the existing local MongoDB connection remains the verified development database.

Backend source uses native ECMAScript modules with explicit `.js` imports. `npm start` runs `src/server.js` directly; `npm run dev` uses Node watch mode. No compilation step is required. Seed data lives in `src/seed/seed.js`; no application logic was redesigned.

## Expo device connection

For a physical iPhone, copy `/Users/user/Desktop/appp/mobile/.env.example` to `/Users/user/Desktop/appp/mobile/.env`, find the Mac Wi-Fi IP with `ipconfig getifaddr en0`, and set `EXPO_PUBLIC_API_URL=http://<your-Mac-LAN-IP>:5001/api`. Keep the phone and Mac on the same network. Do not use `localhost` from the phone. Restart Expo after changing `.env`. The API allows requests without an `Origin` header for native clients. Browser origins are restricted to configured `CORS_ORIGINS`; local development localhost origins are accepted outside production.

## API routes

All routes except health and login require `Authorization: Bearer <token>` and coordinator role.

| Method           | Route                              | Purpose                                                    |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| GET              | `/api/health`                      | Server health                                              |
| POST             | `/api/auth/login`                  | Coordinator login                                          |
| POST, GET        | `/api/timetables`                  | Create/list timetables                                     |
| POST             | `/api/timetables/upload`           | Parse and store one `.xlsx` or `.csv` timetable            |
| GET, PUT, DELETE | `/api/timetables/:id`              | Read/update/delete timetable and its associated data       |
| POST, GET        | `/api/subgroups`                   | Create/list subgroup records                               |
| POST             | `/api/subgroups/upload`            | Parse and bulk insert subgroup rows from `.xlsx` or `.csv` |
| POST             | `/api/subgroups/bulk`              | Validate and insert JSON subgroup records                  |
| GET, PUT, DELETE | `/api/subgroups/:id`               | Read/update/delete subgroup record                         |
| POST             | `/api/validation/run/:timetableId` | Run and persist validation                                 |
| GET              | `/api/validation/runs`             | Read saved validation history                              |
| GET              | `/api/errors`                      | Filtered, paginated validation issues                      |
| GET, PUT, DELETE | `/api/errors/:id`                  | Read/update/delete validation issue                        |
| PUT              | `/api/errors/:id/resolve`          | Apply and audit one correction                             |
| PUT              | `/api/errors/batch-resolve`        | Apply a correction to selected errors/cohort records       |
| GET              | `/api/dashboard/stats`             | Aggregated database statistics and uploads                 |
| GET              | `/api/dashboard/recent-uploads`    | Recent timetable and subgroup uploads                      |

CRUD operations use MongoDB. Resolving an error updates subgroup records and records coordinator, justification, batch, notification-request, and timestamp details. Notification delivery is not implemented. Re-running validation reconciles old issues: issues no longer detected are marked resolved with a system audit entry; current issues are updated or reopened.

## Tests

Run the validation engine unit tests with:

```sh
npm test
```

These tests cover student overlap, venue overlap, lecturer overlap, and venue capacity rules. Run `RUN_DB_TESTS=1 npm test` to include the Coordinator and Master CRUD integration tests against isolated temporary databases. This requires a running MongoDB service and permission to create/drop those test databases.
