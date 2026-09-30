const express = require("express");
const router = express.Router();
const { getStudentDashboard } = require("../controllers/dashboardController");

router.get("/:studentId", getStudentDashboard);

module.exports = router;
