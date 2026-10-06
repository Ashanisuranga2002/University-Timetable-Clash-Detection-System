const express = require("express");
const router = express.Router();
const alertController = require("../controllers/adminAlertController");

router.get("/", alertController.getAlerts);
router.get("/:id", alertController.getAlertById);
router.put("/:id/status", alertController.updateAlertStatus);
router.patch("/:id/acknowledge", alertController.acknowledgeAlert);
router.patch("/:id/resolve", alertController.resolveAlert);
router.patch("/:id/reopen", alertController.reopenAlert);
router.delete("/:id", alertController.deleteAlert);

module.exports = router;
