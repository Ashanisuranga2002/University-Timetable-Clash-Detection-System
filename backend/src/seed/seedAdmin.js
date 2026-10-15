require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const User = require("../models/User");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for admin seeding...");

    const passwordHash = await bcrypt.hash("admin123", 10);
    const [admin] = await Promise.all([
      Admin.findOneAndUpdate(
        { adminId: "ADM001" },
        {
          $set: {
            adminId: "ADM001",
            name: "Dr. Sarah Mitchell",
            email: "admin@university.edu",
            passwordHash,
            role: "admin",
            department: "Academic Affairs",
            status: "Active",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      User.findOneAndUpdate(
        { userId: "ADM001" },
        {
          $set: {
            userId: "ADM001",
            name: "Dr. Sarah Mitchell",
            email: "admin@university.edu",
            passwordHash,
            role: "Administrator",
            department: "Academic Affairs",
            status: "Active",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);

    console.log(`Admin created: ${admin.adminId} (${admin.name})`);
    console.log("ADM001 synchronized across Admin and User collections.");
    console.log("Demo password reset to admin123.");
    process.exit(0);
  } catch (err) {
    console.error("Admin seeding error:", err);
    process.exit(1);
  }
}

seedAdmin();
