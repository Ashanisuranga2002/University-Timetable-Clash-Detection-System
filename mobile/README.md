# University Timetable mobile app

Expo SDK 57 with React Native, Expo Router and JavaScript/JSX. Run commands from this directory.

```sh
npm install
npx expo start
```

Routes are in `src/app/`. The `@/` alias resolves to `src/` through `jsconfig.json`. Coordinator screens are in `src/components/Coordinator/`, shared components in `src/components/common/`, platform hooks in `src/hooks/`, and API/authentication/session logic in `src/services/`.

Copy `.env.example` to `.env` only when no local `.env` exists. The current phone API URL is `http://172.20.10.4:5001/api`. Start the backend from `../backend/` and connect the phone to the same network as the Mac. Restart Expo when environment values change.

## Checks

```sh
npm run lint
npx tsc --noEmit -p jsconfig.json
npx expo export --platform ios --platform android --output-dir /tmp/timetable-native-export
```

The compiler command checks the JavaScript project configuration; `checkJs` is false, so it does not provide the former TypeScript semantic checks. TypeScript remains a development dependency because Expo ESLint's parser requires it. React type declarations remain for the React Native/tooling peer dependencies. No application source or runtime requires TypeScript, and there is no `tsconfig.json`.

Native bundle export does not produce a signed APK/IPA or verify physical-device interactions. See [the project allocation](../docs/PROJECT-FILE-ALLOCATION.md) and [verification report](../docs/JAVASCRIPT-CONVERSION-REPORT.md).
