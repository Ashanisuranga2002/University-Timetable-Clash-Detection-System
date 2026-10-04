const express = require("express");
const router = express.Router();
const {
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminDashboard,
  getAllCoursesAdmin,
} = require("../controllers/adminController");

// Admin dashboard stats
router.get("/dashboard", getAdminDashboard);

// Course management
router.get("/courses", getAllCoursesAdmin);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

module.exports = router;
