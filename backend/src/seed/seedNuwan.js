require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Clash = require("../models/Clash");
const StudentRequest = require("../models/StudentRequest");

async function setupNuwan() {
  try {
    const uri = process.env.MONGO_URI.trim();
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("Connected to MongoDB.");

    // 1. Password hash for 'User@123'
    const passwordHash = await bcrypt.hash("User@123", 10);

    // 2. Upsert Student & User records for Nuwan (IT22334455)
    const user = await User.findOneAndUpdate(
      { userId: "IT22334455" },
      {
        $set: {
          userId: "IT22334455",
          name: "Nuwan Silva",
          email: "nuwansilva@gmail.com",
          role: "Student",
          department: "Faculty of Computing",
          status: "Active",
          passwordHash,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    console.log("Nuwan User updated:", user.userId, user.name);

    const student = await Student.findOneAndUpdate(
      { studentId: "IT22334455" },
      {
        $set: {
          studentId: "IT22334455",
          name: "Nuwan Silva",
          email: "nuwansilva@gmail.com",
          programme: "BSc (Hons) in Information Technology",
          semester: 3,
          passwordHash,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    console.log("Nuwan Student updated:", student.studentId, student.name, "Semester:", student.semester);

    // 3. Fetch the 4 courses
    const courses = await Course.find({
      courseCode: { $in: ["IT3060", "IT3040", "IT3080", "IT3090"] },
    });
    console.log(`Found ${courses.length} courses:`, courses.map(c => c.courseCode));

    const courseHCI = courses.find((c) => c.courseCode === "IT3060");
    const courseML = courses.find((c) => c.courseCode === "IT3080");

    if (!courseHCI || !courseML) {
      throw new Error("Could not find IT3060 or IT3080 courses");
    }

    // 4. Create Registration for Nuwan with IT3080 on Slot B (clashes with IT3060)
    await Registration.deleteMany({ student: student._id });
    const reg3 = await Registration.create({
      student: student._id,
      courses: courses.map((c) => c._id),
      selectedSlots: { IT3080: "Slot B" },
      totalCredits: 16,
      status: "blocked",
      academicYear: "2025/2026",
      semester: 3,
    });
    console.log("Created Semester 3 Registration for Nuwan:", reg3.status, `${reg3.totalCredits} credits.`);

    // Also create semester 1 registration so it resolves regardless of queried semester
    await Registration.create({
      student: student._id,
      courses: courses.map((c) => c._id),
      selectedSlots: { IT3080: "Slot B" },
      totalCredits: 16,
      status: "blocked",
      academicYear: "2025/2026",
      semester: 1,
    });

    // 5. Create Active Clash in Clash collection
    await Clash.deleteMany({ student: student._id });
    const clash = await Clash.create({
      student: student._id,
      course1: courseHCI._id,
      course2: courseML._id,
      day: "Wednesday",
      startTime: "14:00",
      endTime: "16:00",
      room1: "Graphics Lab T-302",
      room2: "AI Lab 102",
      course1Group: "Lab",
      course2Group: "Slot B",
      overlapMinutes: 120,
      status: "active",
    });
    console.log("Created Active Clash for Nuwan:", clash.day, clash.startTime, "-", clash.endTime);

    // 6. Create StudentRequest for Advisor review
    await StudentRequest.deleteMany({ studentId: "IT22334455" });
    const request = await StudentRequest.create({
      studentId: "IT22334455",
      courseCode: "IT3080",
      currentGroup: "Slot B (Wed 14:00-17:00)",
      requestedGroup: "Slot A (Thu 09:00-12:00)",
      conflictDetails: "Clashes with IT3060 Human Computer Interaction on Wednesday 14:00-16:00 (120 mins overlap)",
      conflictDay: "Wednesday",
      conflictStartTime: "14:00",
      conflictEndTime: "16:00",
      reason: "Mandatory HCI lab session overlaps with ML Slot B on Wednesday afternoon. Requesting approval to move to Slot A to eliminate timetable conflict.",
      requestType: "ADVISOR_APPROVAL",
      workflowStatus: "PENDING_ADVISOR",
      lastDecision: "PENDING",
      status: "PENDING",
      courseIds: courses.map((c) => c.courseCode),
      selectedSlots: { IT3080: "Slot B" },
      proposedDay: "Thursday",
      proposedStartTime: "09:00",
      proposedEndTime: "12:00",
      proposedVenue: "Robotics Center R-12",
    });
    console.log("Created StudentRequest for Nuwan:", request._id);

    console.log("\n>>> Nuwan (IT22334455) conflicting timetable successfully created! <<<");
    process.exit(0);
  } catch (err) {
    console.error("Error setting up Nuwan:", err);
    process.exit(1);
  }
}

setupNuwan();
