// ===============================================================
// Admin Alert Routes
// Endpoints for retrieving, acknowledging, and resolving system alerts
// ===============================================================

const express = require("express");
const router = express.Router();
const alertController = require("../controllers/adminAlertController");

// Get all system alerts (supports ?status= and ?severity= query filters)
router.get("/", alertController.getAlerts);

// Get a single alert by ID (either MongoDB _id or alertId string)
router.get("/:id", alertController.getAlertById);

// Update an alert's lifecycle status and resolution note
router.put("/:id/status", alertController.updateAlertStatus);

// Quick-action: Acknowledge an active alert
router.patch("/:id/acknowledge", alertController.acknowledgeAlert);

// Quick-action: Resolve an alert with an optional note
router.patch("/:id/resolve", alertController.resolveAlert);

// Reopen a previously resolved alert back to active
router.patch("/:id/reopen", alertController.reopenAlert);

// Delete or dismiss an alert
router.delete("/:id", alertController.deleteAlert);

module.exports = router;

