const express = require("express");
const router = express.Router();
const monitorController = require("../controllers/adminMonitorController");

router.get("/", monitorController.getMonitors);
router.post("/check-all", monitorController.checkAllMonitors);
router.get("/:id", monitorController.getMonitorById);
router.post("/:id/check", monitorController.checkMonitor);
router.post("/", monitorController.createMonitor);
router.put("/:id", monitorController.updateMonitor);
router.patch("/:id/status", monitorController.updateMonitorStatus);
router.delete("/:id", monitorController.deleteMonitor);

module.exports = router;
