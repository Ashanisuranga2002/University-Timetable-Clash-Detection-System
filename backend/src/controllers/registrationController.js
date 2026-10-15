const Registration = require("../models/Registration");
const Course = require("../models/Course");
const Clash = require("../models/Clash");
const StudentRequest = require("../models/StudentRequest");
const CourseGroup = require("../models/CourseGroup");
const { detectClashes } = require("../utils/clashDetector");
const { resolveStudent } = require("../utils/studentResolver");

const applyApprovedSubgroup = async (request) => {
  const student = await resolveStudent(request.studentId);
  if (!student) {
    throw new Error("Student not found");
  }

  const subgroup = request.proposedSubgroupId
    ? await CourseGroup.findById(request.proposedSubgroupId)
    : await CourseGroup.findOne({
        courseCode: request.courseCode.toUpperCase(),
        groupName: request.requestedGroup,
      });

  if (!subgroup) {
    throw new Error("Approved subgroup was not found");
  }

  const registration = await Registration.findOne({
    student: student._id,
    semester: student.semester,
  }).populate("courses");

  if (!registration) {
    throw new Error("Student registration was not found");
  }

  const selectedSlots = registration.selectedSlots instanceof Map
    ? registration.selectedSlots
    : new Map(Object.entries(registration.selectedSlots || {}));

  selectedSlots.set(request.courseCode.toUpperCase(), subgroup.groupName);
  registration.selectedSlots = selectedSlots;

  const courses = registration.courses || [];
  const selectedSlotObject = Object.fromEntries(selectedSlots.entries());
  const remainingClashes = detectClashes(courses, selectedSlotObject);

  await Clash.deleteMany({ student: student._id });

  for (const clash of remainingClashes) {
    await Clash.create({
      student: student._id,
      course1: clash.course1,
      course2: clash.course2,
      day: clash.day,
      startTime: clash.startTime,
      endTime: clash.endTime,
      room1: clash.room1,
      room2: clash.room2,
      course1Group: clash.course1Group,
      course2Group: clash.course2Group,
      overlapMinutes: clash.overlapMinutes,
      status: "active",
    });
  }

  registration.status = remainingClashes.length > 0 ? "blocked" : "confirmed";
  await registration.save();

  return { registration, clashes: remainingClashes };
};

// Get active registration for a student
const getStudentRegistration = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await resolveStudent(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const registration = await Registration.findOne({
      student: student._id,
      semester: student.semester,
    }).sort({ createdAt: -1 }).populate("courses");

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
        selectedSlots: {},
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

    const student = await resolveStudent(studentId);
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

    // Store only valid selections for the courses being registered. If a
    // course has subgroup options and the client omitted one, use the first
    // catalogue option consistently and persist that choice for this student.
    const normalizedSelectedSlots = {};
    for (const course of courses) {
      const requestedSlot =
        selectedSlots?.[course.courseCode] ||
        selectedSlots?.[course.courseCode?.toUpperCase()] ||
        selectedSlots?.[course._id.toString()];

      if (course.slots?.length) {
        const selectedSlot = course.slots.find((slot) => slot.slotName === requestedSlot) || course.slots[0];
        normalizedSelectedSlots[course.courseCode] = selectedSlot.slotName;
      }
    }

    // Calculate total credits
    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
    const maxCredits = 20;

    // Detect timetable clashes
    const detectedClashes = detectClashes(courses, normalizedSelectedSlots);

    // Check StudentRequests for requested groups
    if (Object.keys(normalizedSelectedSlots).length > 0) {
      const studentRequests = await StudentRequest.find({ studentId: student.studentId });
      for (const course of courses) {
        const selectedGroup = normalizedSelectedSlots[course.courseCode];
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
        course1Group: clash.course1Group,
        course2Group: clash.course2Group,
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
      registration.selectedSlots = normalizedSelectedSlots;
      registration.totalCredits = totalCredits;
      registration.status = regStatus;
      registration.academicYear = targetYear;
      await registration.save();
    } else {
      registration = await Registration.create({
        student: student._id,
        courses: courses.map((c) => c._id),
        selectedSlots: normalizedSelectedSlots,
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
  applyApprovedSubgroup,
};
