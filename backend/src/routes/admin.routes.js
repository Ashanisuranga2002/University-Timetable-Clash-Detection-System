// ===============================================================
// General Admin Routes
// Endpoints for admin dashboard metrics and academic course administration
// ===============================================================

const express = require("express");
const router = express.Router();
const {
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminDashboard,
  getAdminDashboardStats,
  getAllCoursesAdmin,
} = require("../controllers/adminController");

// Admin dashboard overview summary (counts of courses, students, registrations)
router.get("/dashboard", getAdminDashboard);

// Real aggregated Admin telemetry and system status statistics
router.get("/dashboard/stats", getAdminDashboardStats);

// Course administration routes
router.get("/courses", getAllCoursesAdmin);     // Fetch all courses
router.post("/courses", createCourse);         // Create new course
router.put("/courses/:id", updateCourse);      // Edit existing course
router.delete("/courses/:id", deleteCourse);   // Deactivate course

module.exports = router;

