// ===============================================================
// Admin Monitor Routes
// Endpoints for managing and triggering health check probes on services
// ===============================================================

const express = require("express");
const router = express.Router();
const monitorController = require("../controllers/adminMonitorController");

// List all registered service monitors
router.get("/", monitorController.getMonitors);

// Trigger simultaneous health checks across all monitors
router.post("/check-all", monitorController.checkAllMonitors);

// Get details of a single monitor by ID
router.get("/:id", monitorController.getMonitorById);

// Trigger an immediate probe health check for a single monitor
router.post("/:id/check", monitorController.checkMonitor);

// Create and register a new service monitor
router.post("/", monitorController.createMonitor);

// Update configuration for an existing monitor
router.put("/:id", monitorController.updateMonitor);

// Update status or enabled flag for a monitor
router.patch("/:id/status", monitorController.updateMonitorStatus);

// Delete a monitor from the system
router.delete("/:id", monitorController.deleteMonitor);

module.exports = router;

