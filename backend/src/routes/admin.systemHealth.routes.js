// ===============================================================
// Admin System Health Routes
// Endpoints for system uptime, memory usage, and node health telemetry
// ===============================================================

const express = require("express");
const router = express.Router();
const systemHealthController = require("../controllers/adminSystemHealthController");

// Fetch real-time system health metrics, memory usage, and service availability
router.get("/", systemHealthController.getSystemHealth);

module.exports = router;

