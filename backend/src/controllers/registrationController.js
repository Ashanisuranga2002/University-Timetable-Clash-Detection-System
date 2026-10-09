const Registration = require("../models/Registration");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Clash = require("../models/Clash");
const StudentRequest = require("../models/StudentRequest");
const { detectClashes } = require("../utils/clashDetector");

// Get active registration for a student
const getStudentRegistration = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const registration = await Registration.findOne({
      student: student._id,
      semester: student.semester,
    }).populate("courses");

    const clashes = await Clash.find({
      student: student._id,
      status: "active",
    }).populate("course1 course2");

    res.status(200).json({
      success: true,
      registration: registration || {
        courses: [],
        totalCredits: 0,
        status: "draft",
        semester: student.semester,
      },
      clashes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get registration",
      error: error.message,
    });
  }
};

// Register or update courses for a student
const registerCourses = async (req, res) => {
  try {
    const { studentId, courseIds, academicYear, semester, selectedSlots } = req.body;

    if (!studentId || !Array.isArray(courseIds)) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseIds array are required",
      });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Resolve course IDs or codes
    const courses = await Course.find({
      $or: [
        { _id: { $in: courseIds.filter((id) => id.toString().match(/^[0-9a-fA-F]{24}$/)) } },
        { courseCode: { $in: courseIds.map((c) => c.toString().toUpperCase()) } },
      ],
    });

    // Calculate total credits
    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
    const maxCredits = 20;

    // Detect timetable clashes
    const detectedClashes = detectClashes(courses, selectedSlots || {});

    // Check StudentRequests for requested groups
    if (selectedSlots) {
      const studentRequests = await StudentRequest.find({ studentId: student.studentId });
      for (const course of courses) {
        const selectedGroup = selectedSlots[course.courseCode];
        if (selectedGroup) {
          const matchingRequest = studentRequests.find(r => 
            r.courseCode === course.courseCode && 
            r.requestedGroup === selectedGroup
          );
          
          if (matchingRequest) {
            if (matchingRequest.status === 'PENDING') {
              return res.status(403).json({
                success: false,
                message: `Cannot register for ${course.courseCode} - ${selectedGroup}. Your subgroup request is still pending advisor approval.`
              });
            }
            if (matchingRequest.status === 'REJECTED') {
              return res.status(403).json({
                success: false,
                message: `Cannot register for ${course.courseCode} - ${selectedGroup}. Your subgroup request was rejected by the advisor.`
              });
            }
            // If APPROVED, we allow registration to proceed
          }
        }
      }
    }

    // Clear old active clashes for this student
    await Clash.deleteMany({ student: student._id });

    // Save newly detected clashes
    const savedClashes = [];
    for (const clash of detectedClashes) {
      const createdClash = await Clash.create({
        student: student._id,
        course1: clash.course1,
        course2: clash.course2,
        day: clash.day,
        startTime: clash.startTime,
        endTime: clash.endTime,
        room1: clash.room1,
        room2: clash.room2,
        overlapMinutes: clash.overlapMinutes,
        status: "active",
      });
      savedClashes.push(createdClash);
    }

    // Determine status
    let regStatus = "confirmed";
    if (detectedClashes.length > 0) {
      regStatus = "blocked";
    } else if (totalCredits < 12) {
      regStatus = "draft";
    }

    const targetSemester = semester ? Number(semester) : student.semester;
    const targetYear = academicYear || "2025/2026";

    // Upsert registration
    let registration = await Registration.findOne({
      student: student._id,
      semester: targetSemester,
    });

    if (registration) {
      registration.courses = courses.map((c) => c._id);
      registration.totalCredits = totalCredits;
      registration.status = regStatus;
      registration.academicYear = targetYear;
      await registration.save();
    } else {
      registration = await Registration.create({
        student: student._id,
        courses: courses.map((c) => c._id),
        totalCredits,
        status: regStatus,
        academicYear: targetYear,
        semester: targetSemester,
      });
    }

    const populatedReg = await Registration.findById(registration._id).populate("courses");

    res.status(200).json({
      success: true,
      message:
        detectedClashes.length > 0
          ? `Saved with ${detectedClashes.length} clash(es) detected`
          : "Registration saved successfully",
      registration: populatedReg,
      totalCredits,
      maxCredits,
      hasClashes: detectedClashes.length > 0,
      clashes: savedClashes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentRegistration,
  registerCourses,
};
