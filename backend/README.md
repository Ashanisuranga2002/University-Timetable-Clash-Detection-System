# ⚙️ University Timetable & Clash Detection System — Backend API

> Fast, asynchronous REST API built with Node.js, Express 5.x, and MongoDB Atlas.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## 🛠 Features

- **Timetable Conflict Engine**: Automatically evaluates lecture, tutorial, and lab schedules for overlapping intervals.
- **Unified Role Authentication**: Secure login and role routing for Students, Advisors, Coordinators, and Administrators.
- **Advisor Review & Draft CRUD**: Endpoints supporting full draft lifecycle and automatic registration sync upon decision.
- **Coordinator Slot & Subgroup Management**: Dynamically configure slots and balance subgroup capacities.
- **Admin System Health & Diagnostics**: Live uptime, memory, health probes, and incident alerting.

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in this directory:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Seed Database
Seeds courses, pre-configured clashes, demo users, monitors, and alerts:
```bash
npm run seed
```

### 4. Run Server
```bash
# Development mode with hot-reload:
npm run dev

# Or standard production start:
npm start
```
Default URL: `http://localhost:5001`  
API Base: `http://localhost:5001/api`

---

## 🧪 Testing
```bash
npm test
```

For complete documentation, architecture diagrams, and demo accounts, refer to the [Root README](../README.md).
