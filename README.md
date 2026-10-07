# University Timetable Clash Detection System

The Expo JavaScript/JSX app lives in `mobile/`. The Express/MongoDB JavaScript API lives in `backend/`. Both projects have their own package and lockfile.

## Run

In one terminal, from the repository root:

```sh
cd backend
npm install
npm start
```

In a second terminal, from the repository root:

```sh
cd mobile
npm install
npx expo start
```

Keep MongoDB running and preserve the local configuration in `backend/.env`. The mobile `.env` is now `mobile/.env`; its API URL remains `http://172.20.10.4:5001/api`. Keep the phone and Mac on the same network and restart Expo after changing the URL.

## Project guides

- [Complete file allocation](docs/PROJECT-FILE-ALLOCATION.md)
- [Conversion and verification report](docs/JAVASCRIPT-CONVERSION-REPORT.md)
- [Backend setup and API](backend/README.md)
- [Mobile setup](mobile/README.md)
- [Coordinator workflow files](docs/COORDINATOR-FILE-ALLOCATION.md)
- [Master Timetable walkthrough](docs/MASTER-TIMETABLE-WORKFLOW.md)
