const express = require("express");
const router = express.Router();
const {
  getStudentRegistration,
  registerCourses,
} = require("../controllers/registrationController");

router.get("/:studentId", getStudentRegistration);
router.post("/register", registerCourses);

module.exports = router;
