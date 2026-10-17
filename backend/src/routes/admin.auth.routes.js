// ===============================================================
// Admin Authentication & Profile Routes
// Endpoints for admin login and profile retrieval/updates
// ===============================================================

const express = require("express");
const router = express.Router();
const { loginAdmin, getAdminProfile, updateAdminProfile } = require("../controllers/adminAuthController");

// Admin login verification with credentials
router.post("/login", loginAdmin);

// Fetch admin profile (using headers or default admin)
router.get("/profile", getAdminProfile);

// Fetch admin profile by specific adminId param
router.get("/profile/:adminId", getAdminProfile);

// Update admin profile details (name, department)
router.put("/profile", updateAdminProfile);

// Update admin profile details by specific adminId param
router.put("/profile/:adminId", updateAdminProfile);

module.exports = router;

