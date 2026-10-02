require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for admin seeding...");

    // Remove existing test admin
    await Admin.deleteMany({ adminId: "ADM001" });

    const passwordHash = await bcrypt.hash("admin123", 10);
    const admin = await Admin.create({
      adminId: "ADM001",
      name: "Dr. Sarah Mitchell",
      email: "admin@university.edu",
      passwordHash,
      role: "admin",
      department: "Academic Affairs",
    });

    console.log(`Admin created: ${admin.adminId} (${admin.name})`);
    console.log(`Login: adminId=${admin.adminId}, password=admin123`);
    process.exit(0);
  } catch (err) {
    console.error("Admin seeding error:", err);
    process.exit(1);
  }
}

seedAdmin();
