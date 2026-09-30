require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Clash = require("../models/Clash");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing timetable data
    await Student.deleteMany({ studentId: "IT21047138" });
    await Course.deleteMany({
      courseCode: { $in: ["IT3060", "IT3040", "IT3080", "IT3090"] },
    });

    console.log("Creating Courses...");
    const courses = await Course.create([
      {
        courseCode: "IT3060",
        courseName: "Human Computer Interaction",
        credits: 4,
        semester: 3,
        type: "Core",
        lecturer: "Prof. Diana Jenkins • Dept of Informatics",
        description: "Interaction design, usability metrics, and interface prototyping.",
        schedule: [
          {
            day: "Monday",
            startTime: "09:00",
            endTime: "12:00",
            room: "Auditorium East",
            type: "Lecture",
          },
          {
            day: "Wednesday",
            startTime: "14:00",
            endTime: "16:00",
            room: "Graphics Lab T-302",
            type: "Lab",
          },
        ],
      },
      {
        courseCode: "IT3040",
        courseName: "Distributed Systems & Cloud",
        credits: 4,
        semester: 3,
        type: "Core",
        lecturer: "Dr. Aaron Vance • Systems Engineering",
        description: "Cloud computing architectures, distributed algorithms, and microservices.",
        schedule: [
          {
            day: "Tuesday",
            startTime: "10:00",
            endTime: "13:00",
            room: "Turing Hall B-201",
            type: "Lecture",
          },
          {
            day: "Thursday",
            startTime: "13:30",
            endTime: "15:30",
            room: "Main Complex • Hall 3A",
            type: "Lecture",
          },
        ],
      },
      {
        courseCode: "IT3080",
        courseName: "Machine Learning Applications",
        credits: 4,
        semester: 3,
        type: "Elective",
        lecturer: "Assoc. Prof. Elena Wu • AI Lab",
        description: "Applied machine learning, deep neural networks, and model deployment.",
        slots: [
          {
            slotName: "Slot A",
            day: "Thursday",
            startTime: "09:00",
            endTime: "12:00",
            room: "Robotics Center R-12",
          },
          {
            slotName: "Slot B",
            day: "Wednesday",
            startTime: "14:00",
            endTime: "17:00",
            room: "AI Lab 102", // Clashes with IT3060 Wed 14:00-16:00
          },
        ],
        schedule: [
          {
            day: "Thursday",
            startTime: "09:00",
            endTime: "12:00",
            room: "Robotics Center R-12",
            type: "Lecture",
          },
        ],
      },
      {
        courseCode: "IT3090",
        courseName: "Mobile Application Development",
        credits: 4,
        semester: 3,
        type: "Elective",
        lecturer: "Lecturer Marcus Lin • Mobile UX",
        description: "Cross-platform mobile application development with React Native.",
        schedule: [
          {
            day: "Friday",
            startTime: "14:00",
            endTime: "17:00",
            room: "Computing Block C • Lab 04",
            type: "Lab",
          },
        ],
      },
    ]);

    console.log(`Created ${courses.length} courses.`);

    // Create Sample Student
    console.log("Creating Sample Student...");
    const passwordHash = await bcrypt.hash("password123", 10);
    const student = await Student.create({
      studentId: "IT21047138",
      name: "Alex Perera",
      email: "alex.p@uni.edu",
      passwordHash,
      programme: "BSc (Hons) in Information Technology",
      semester: 3,
    });
    console.log(`Student created: ${student.studentId} (${student.name})`);

    // Create Initial Registration
    console.log("Creating Registration...");
    await Registration.deleteMany({ student: student._id });
    await Clash.deleteMany({ student: student._id });

    // Register all 4 courses (4 x 4 = 16 credits)
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const registration = await Registration.create({
      student: student._id,
      courses: courses.map((c) => c._id),
      totalCredits,
      status: "confirmed",
      academicYear: "2025/2026",
      semester: 3,
    });
    console.log(
      `Registration created: ${registration.totalCredits} credits registered.`
    );

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
