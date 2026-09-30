const Student = require("../models/Student");
const Registration = require("../models/Registration");
const Clash = require("../models/Clash");
const Course = require("../models/Course");

const getStudentDashboard = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({
      $or: [{ studentId }, { email: studentId.toLowerCase() }],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Fetch registration for student's current semester
    const registration = await Registration.findOne({
      student: student._id,
      semester: student.semester,
    }).populate("courses");

    const enrolledCourses = registration?.courses || [];
    const totalCredits = enrolledCourses.reduce(
      (sum, c) => sum + (c.credits || 0),
      0
    );
    const maxCredits = 20;
    const creditPercentage = Math.min(
      Math.round((totalCredits / maxCredits) * 100),
      100
    );

    // Active clashes
    const activeClashes = await Clash.find({
      student: student._id,
      status: "active",
    }).populate("course1 course2");

    // Build schedule from enrolled courses
    const scheduleItems = [];
    enrolledCourses.forEach((c) => {
      if (c.schedule && c.schedule.length > 0) {
        c.schedule.forEach((s) => {
          scheduleItems.push({
            id: `${c._id}-${s.day}-${s.startTime}`,
            courseCode: c.courseCode,
            courseName: c.courseName,
            day: s.day,
            time: `${s.startTime} - ${s.endTime}`,
            tag: s.type ? s.type.toUpperCase() : "LECTURE",
            location: s.room || "Campus Hall",
          });
        });
      }
    });

    // Compute initials
    const initials = student.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        programme: student.programme,
        semester: student.semester,
        initials,
      },
      academics: {
        registeredCount: enrolledCourses.length,
        totalCredits,
        maxCredits,
        creditPercentage,
        status: registration?.status || "draft",
        courses: enrolledCourses,
      },
      clashes: {
        hasClashes: activeClashes.length > 0,
        count: activeClashes.length,
        items: activeClashes,
      },
      schedule: scheduleItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentDashboard,
};
