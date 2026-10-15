const Registration = require("../models/Registration");
const Clash = require("../models/Clash");
const StudentRequest = require("../models/StudentRequest");
const { resolveStudent } = require("../utils/studentResolver");

const getStudentDashboard = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    const cleanId = studentId.trim();

    // Resolve every account to the canonical Student document. Registrations
    // and clashes reference this document, never the generic User document.
    const student = await resolveStudent(cleanId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 2. Fetch registration and active clashes
    const [registration, activeClashes, pendingRequests] = await Promise.all([
      Registration.findOne({
        student: student._id,
        semester: student.semester,
      })
        .sort({ createdAt: -1 })
        .populate("courses")
        .lean(),
      Clash.find({
        student: student._id,
        status: "active",
      })
        .populate("course1 course2")
        .lean(),
      StudentRequest.find({
        studentId: student.studentId,
        status: "PENDING",
      }).lean(),
    ]);

    const enrolledCourses = registration?.courses || [];
    const selectedSlots = registration?.selectedSlots instanceof Map
      ? Object.fromEntries(registration.selectedSlots.entries())
      : registration?.selectedSlots || {};
    const totalCredits = enrolledCourses.reduce((acc, c) => acc + (c.credits || 0), 0);
    const maxCredits = 20;
    const creditPercentage = Math.round((totalCredits / maxCredits) * 100);

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

      if (c.slots && c.slots.length > 0) {
        const selectedSlotName =
          selectedSlots[c.courseCode] || selectedSlots[c.courseCode?.toUpperCase()];
        const selectedSlot =
          c.slots.find((slot) => slot.slotName === selectedSlotName) || c.slots[0];

        if (selectedSlot?.day && selectedSlot.startTime && selectedSlot.endTime) {
          scheduleItems.push({
            id: `${c._id}-${selectedSlot.slotName}`,
            courseCode: c.courseCode,
            courseName: c.courseName,
            day: selectedSlot.day,
            time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
            tag: selectedSlot.slotName || "SUBGROUP",
            location: selectedSlot.room || "Campus Hall",
          });
        }
      }
    });

    // Compute initials
    const initials = (student.name || "ST")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const hasClashes = (activeClashes && activeClashes.length > 0) || (pendingRequests && pendingRequests.length > 0);
    const clashCount = (activeClashes ? activeClashes.length : 0) + (pendingRequests ? pendingRequests.length : 0);

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        programme: student.programme,
        semester: student.semester || 1,
        initials,
      },
      academics: {
        registeredCount: enrolledCourses.length,
        totalCredits,
        maxCredits,
        creditPercentage,
        status: registration?.status || "draft",
        courses: enrolledCourses,
        selectedSlots,
      },
      clashes: {
        hasClashes,
        count: clashCount,
        items: activeClashes || [],
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
