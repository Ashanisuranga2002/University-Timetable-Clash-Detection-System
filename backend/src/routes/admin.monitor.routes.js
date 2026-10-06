const express = require("express");
const router = express.Router();
const monitorController = require("../controllers/adminMonitorController");

router.get("/", monitorController.getMonitors);
router.get("/:id", monitorController.getMonitorById);
router.post("/", monitorController.createMonitor);
router.put("/:id", monitorController.updateMonitor);
router.delete("/:id", monitorController.deleteMonitor);

module.exports = router;
