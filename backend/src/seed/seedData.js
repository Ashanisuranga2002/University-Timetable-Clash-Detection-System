require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Clash = require("../models/Clash");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Monitor = require("../models/Monitor");
const Alert = require("../models/Alert");

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

    // ── Create Sample Detected Timetable Clash ───────────
    console.log("Creating Detected Timetable Clash...");
    const courseHCI = courses.find((c) => c.courseCode === "IT3060");
    const courseML = courses.find((c) => c.courseCode === "IT3080");
    if (courseHCI && courseML) {
      await Clash.create({
        student: student._id,
        course1: courseHCI._id,
        course2: courseML._id,
        day: "Wednesday",
        startTime: "14:00",
        endTime: "16:00",
        room1: "Graphics Lab T-302",
        room2: "AI Lab 102",
        overlapMinutes: 120,
        status: "active",
      });
      console.log("Sample Clash created: IT3060 vs IT3080 (Wednesday 14:00-16:00).");
    }

    // ── Seed Admin Account ────────────────────────────────
    console.log("Seeding Administrator account...");
    await Admin.deleteMany({ adminId: "ADM001" });
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const admin = await Admin.create({
      adminId: "ADM001",
      name: "Dr. Sarah Mitchell",
      email: "admin@university.edu",
      passwordHash: adminPasswordHash,
      role: "admin",
      department: "Academic Affairs",
      status: "Active",
    });
    console.log(`Admin created: ${admin.adminId} (${admin.name})`);

    // ── Seed System Users Directory ───────────────────────
    console.log("Seeding System Users...");
    await User.deleteMany({});
    const defaultUserHash = await bcrypt.hash("User@123", 10);
    await User.create([
      {
        userId: "ADM001",
        name: "Dr. Sarah Mitchell",
        email: "admin@university.edu",
        role: "Administrator",
        department: "Academic Affairs",
        status: "Active",
        passwordHash: adminPasswordHash,
      },
      {
        userId: "ADV001",
        name: "Prof. Alan Vance",
        email: "a.vance@university.edu",
        role: "Academic Advisor",
        department: "Faculty of Computing",
        status: "Active",
        passwordHash: defaultUserHash,
      },
      {
        userId: "STU001",
        name: "Kasun Perera",
        email: "kasun.p@my.sliit.lk",
        role: "Student",
        department: "Software Engineering",
        status: "Active",
        passwordHash: defaultUserHash,
      },
      {
        userId: "MON001",
        name: "Elena Rostova",
        email: "elena.r@infra.university.edu",
        role: "Monitor",
        department: "Cloud Operations",
        status: "Active",
        passwordHash: defaultUserHash,
      },
      {
        userId: "CRD001",
        name: "Dr. Jonathan Hayes",
        email: "j.hayes@university.edu",
        role: "Coordinator",
        department: "Curriculum Planning",
        status: "Active",
        passwordHash: defaultUserHash,
      },
    ]);
    console.log("Seeded 5 core system users.");

    // ── Seed Service Health Monitors ──────────────────────
    console.log("Seeding Service Monitors...");
    await Monitor.deleteMany({});
    await Monitor.create([
      {
        monitorId: "MON-01",
        serviceName: "Clash Detection Service",
        serviceType: "Engine",
        description: "Real-time timetable conflict detection engine",
        endpoint: "https://api.university.edu/clash-detection/health",
        interval: "15s",
        status: "online",
        healthStatus: "Healthy",
        enabled: true,
        responseTime: "1.2s",
      },
      {
        monitorId: "MON-02",
        serviceName: "Registration Service",
        serviceType: "Gateway",
        description: "Student course enrollment and registration ingress",
        endpoint: "https://api.university.edu/registration/health",
        interval: "30s",
        status: "online",
        healthStatus: "Healthy",
        enabled: true,
        responseTime: "1.5s",
      },
      {
        monitorId: "MON-03",
        serviceName: "Database Primary Cluster",
        serviceType: "Database",
        description: "High availability MongoDB database cluster",
        endpoint: "mongodb://cluster-core.internal:27017/status",
        interval: "10s",
        status: "online",
        healthStatus: "Healthy",
        enabled: true,
        responseTime: "0.8s",
      },
      {
        monitorId: "MON-04",
        serviceName: "Notification Service",
        serviceType: "Queue",
        description: "Event dispatch queue for timetable change notifications",
        endpoint: "https://queue.university.edu/sqs/health",
        interval: "60s",
        status: "warning",
        healthStatus: "Warning",
        enabled: true,
        responseTime: "2.4s",
      },
    ]);
    console.log("Seeded 4 core service health monitors.");

    // ── Seed Diagnostic Incident Alerts ───────────────────
    console.log("Seeding Incident Alerts...");
    await Alert.deleteMany({});
    await Alert.create([
      {
        alertId: "INC-2024-8841",
        title: "High Latency Spike in Conflict Engine",
        service: "Clash Detection Core",
        worker: "Worker 04",
        time: "2 mins ago",
        severity: "high",
        state: "active",
        metricLabel1: "P99 LATENCY",
        metricValue1: "4.8s",
        metricLabel2: "QUEUE DEPTH",
        metricValue2: "148 jobs",
        impactNote: "Course clash checks taking 4x baseline; 148 jobs in pending queue",
        resolvedNote: "Investigating thread starvation on node 04",
        ttr: "~12m remaining",
      },
      {
        alertId: "INC-2024-8839",
        title: "Deadlock Detected on Timetable Lock Row",
        service: "Database Primary",
        worker: "Cluster 01",
        time: "14 mins ago",
        severity: "critical",
        state: "active",
        metricLabel1: "BLOCKED QUERIES",
        metricValue1: "23",
        metricLabel2: "WAIT TIME",
        metricValue2: "8.2s",
        impactNote: "Concurrent registration transactions contending on semester lock",
        resolvedNote: "Connection pool autoscaling triggered",
        ttr: "~5m remaining",
      },
      {
        alertId: "INC-2024-8835",
        title: "Slow Query Execution on Elective Enrollments",
        service: "Course Indexer",
        worker: "Index Worker",
        time: "1 hour ago",
        severity: "medium",
        state: "monitoring",
        metricLabel1: "QUERY TIME",
        metricValue1: "2.1s",
        metricLabel2: "CPU LOAD",
        metricValue2: "78%",
        impactNote: "Elective course search filtering degraded for mobile clients",
        resolvedNote: "Applied partial index, monitoring query plan cache",
        ttr: "Stabilizing",
      },
      {
        alertId: "INC-2024-8820",
        title: "Gateway SSL Certificate Renewed",
        service: "Edge Proxy 04",
        worker: "Cert Manager",
        time: "3 hours ago",
        severity: "low",
        state: "resolved",
        metricLabel1: "EXPIRY",
        metricValue1: "89 days",
        metricLabel2: "ALGORITHM",
        metricValue2: "ECDSA",
        impactNote: "Routine automated security renewal completed",
        resolvedNote: "Renewed via Let's Encrypt automated challenge",
        ttr: "Resolved",
      },
    ]);
    console.log("Seeded 4 system incident alerts.");

    console.log("All Timetable & Admin seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
