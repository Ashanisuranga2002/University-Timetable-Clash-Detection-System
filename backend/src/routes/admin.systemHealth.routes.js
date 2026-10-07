const express = require("express");
const router = express.Router();
const systemHealthController = require("../controllers/adminSystemHealthController");

router.get("/", systemHealthController.getSystemHealth);

module.exports = router;
