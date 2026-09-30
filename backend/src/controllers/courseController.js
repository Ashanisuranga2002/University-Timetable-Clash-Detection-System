const Course = require("../models/Course");

// Get all active courses (optional filter by semester)
const getAllCourses = async (req, res) => {
  try {
    const { semester, type } = req.query;
    const query = { isActive: true };

    if (semester) {
      query.semester = Number(semester);
    }
    if (type) {
      query.type = type;
    }

    const courses = await Course.find(query).sort({ type: 1, courseCode: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

// Get single course by ID or code
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    let course = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(id);
    } else {
      course = await Course.findOne({ courseCode: id.toUpperCase() });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch course",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCourses,
  getCourse,
};
