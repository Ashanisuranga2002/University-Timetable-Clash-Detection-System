// ===============================================================
// Admin Model - Mongoose Schema for Administrator Accounts
// Defines the data structure for system admin credentials and profile
// ===============================================================

const mongoose = require("mongoose");

// Schema definition for Admin accounts
const adminSchema = new mongoose.Schema(
  {
    // Unique identifier for the administrator (e.g., ADM001)
    adminId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Full name of the administrator
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact and login email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Securely hashed password (bcrypt)
    passwordHash: {
      type: String,
      required: true,
    },

    // Access level: regular admin or superadmin with full permissions
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },

    // Department or division the administrator belongs to
    department: {
      type: String,
      trim: true,
      default: "Academic Affairs",
    },

    // Current account status: Active, Inactive, or Suspended
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    // Timestamp tracking the last successful login
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Export Admin model for use across controllers
module.exports = mongoose.model("Admin", adminSchema);

