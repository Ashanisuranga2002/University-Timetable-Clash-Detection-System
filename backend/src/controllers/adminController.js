const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Student = require("../models/Student");

// Admin: Create a new course
const createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      credits,
      semester,
      type,
      lecturer,
      description,
      schedule,
      slots,
    } = req.body;

    if (!courseCode || !courseName || !credits || !semester || !type) {
      return res.status(400).json({
        success: false,
        message: "courseCode, courseName, credits, semester, and type are required",
      });
    }

    const existing = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Course ${courseCode.toUpperCase()} already exists`,
      });
    }

    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      credits: Number(credits),
      semester: Number(semester),
      type,
      lecturer: lecturer || "",
      description: description || "",
      schedule: schedule || [],
      slots: slots || [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

// Admin: Update an existing course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    let course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    Object.assign(course, req.body);
    await course.save();

    res.status(200).json({ success: true, message: "Course updated", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete (deactivate) a course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, message: "Course deactivated", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get admin dashboard summary
const getAdminDashboard = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalStudents = await Student.countDocuments();
    const totalRegistrations = await Registration.countDocuments();

    const confirmedRegistrations = await Registration.countDocuments({ status: "confirmed" });
    const blockedRegistrations = await Registration.countDocuments({ status: "blocked" });
    const draftRegistrations = await Registration.countDocuments({ status: "draft" });

    const coreCount = await Course.countDocuments({ type: "Core", isActive: true });
    const electiveCount = await Course.countDocuments({ type: "Elective", isActive: true });

    const recentCourses = await Course.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("studentId name programme semester createdAt");

    res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        totalRegistrations,
        confirmedRegistrations,
        blockedRegistrations,
        draftRegistrations,
        coreCount,
        electiveCount,
      },
      recentCourses,
      recentStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};

// Admin: Get all courses (including inactive if ?all=true)
const getAllCoursesAdmin = async (req, res) => {
  try {
    const showAll = req.query.all === "true";
    const query = showAll ? {} : { isActive: true };

    const courses = await Course.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminDashboard,
  getAllCoursesAdmin,
};
