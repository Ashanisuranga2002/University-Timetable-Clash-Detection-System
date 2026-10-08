require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const CourseGroup = require("../models/CourseGroup");

const seedGroups = async () => {
  try {
    await connectDB();
    
    // Clear existing groups
    await CourseGroup.deleteMany({});
    
    const groups = [
      {
        courseCode: "IT3080",
        courseName: "Machine Learning Applications",
        groupName: "Group 1", // Original clash time
        day: "Wednesday",
        startTime: "14:00",
        endTime: "17:00",
        venue: "Data Lab",
        capacity: 40,
        enrolledCount: 35
      },
      {
        courseCode: "IT3080",
        courseName: "Machine Learning Applications",
        groupName: "Group 2", // Alternative safe subgroup
        day: "Thursday",
        startTime: "13:00",
        endTime: "16:00",
        venue: "Main Hall A",
        capacity: 40,
        enrolledCount: 20
      },
      {
        courseCode: "IT3080",
        courseName: "Machine Learning Applications",
        groupName: "Group 3", // Alternative safe subgroup
        day: "Friday",
        startTime: "09:00",
        endTime: "12:00",
        venue: "Lab 3",
        capacity: 40,
        enrolledCount: 15
      }
    ];

    await CourseGroup.insertMany(groups);
    console.log("Seeded Course Groups successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding course groups:", error);
    process.exit(1);
  }
};

seedGroups();
