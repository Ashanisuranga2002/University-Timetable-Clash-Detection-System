const express = require("express");
const router = express.Router();
const { loginAdmin, getAdminProfile, updateAdminProfile } = require("../controllers/adminAuthController");

router.post("/login", loginAdmin);
router.get("/profile", getAdminProfile);
router.get("/profile/:adminId", getAdminProfile);
router.put("/profile", updateAdminProfile);
router.put("/profile/:adminId", updateAdminProfile);

module.exports = router;
