# 📱 University Timetable & Clash Detection System — Mobile App

> Cross-platform mobile client built with React Native and Expo SDK 57.

[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📱 Features

- **Multi-Role Portal**: Dedicated, polished interfaces for Students, Academic Advisors, Course Coordinators, and System Admins.
- **Dynamic Clash Detection UI**: Color-coded timetable conflict visualization and instant alternative subgroup selection.
- **Advisor Review Interface**: Review incoming student clash requests, draft notes, and submit formal approvals.
- **Admin Control Center**: Monitor infrastructure services, examine incident alerts, and manage user accounts.
- **Smart Network Resolution**: Dynamic host auto-discovery for seamless connectivity between physical devices (Expo Go) and local backend APIs.

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Backend Host IP
If testing on a physical smartphone using **Expo Go**, verify that your phone and development computer are on the same local Wi-Fi. The app auto-detects your debugger host IP, or you can configure `LOCAL_IP` in [`src/services/api.ts`](src/services/api.ts).

### 3. Start Expo Dev Server
```bash
npx expo start
```

* **Physical Device**: Scan the terminal QR code via **Expo Go** (Android) or **Camera** (iOS).
* **Android Emulator**: Press `a`.
* **iOS Simulator**: Press `i`.
* **Web Browser**: Press `w`.

---

## 🧪 Linting & Quality Checks
```bash
# Typecheck
npx tsc --noEmit

# Lint
npx expo lint
```

For full documentation and pre-seeded test accounts, refer to the [Root README](../README.md).
