const express = require("express");
const router = express.Router();
const { loginAdmin, getAdminProfile } = require("../controllers/adminAuthController");

router.post("/login", loginAdmin);
router.get("/profile/:adminId", getAdminProfile);

module.exports = router;
