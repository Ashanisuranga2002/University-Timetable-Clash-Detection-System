const express = require("express");
const router = express.Router();
const { registerStudent, loginStudent, loginUnified } = require("../controllers/authController");

router.post("/register", registerStudent);
router.post("/login", loginUnified);
router.post("/student-login", loginStudent);

module.exports = router;
