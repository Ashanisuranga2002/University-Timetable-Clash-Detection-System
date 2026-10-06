const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and password are required",
      });
    }

    const cleanId = adminId.trim();

    const admin = await Admin.findOne({
      $or: [{ adminId: cleanId }, { email: cleanId.toLowerCase() }],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Admin ID or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Admin ID or password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findOne({
      $or: [{ adminId }, { email: adminId.toLowerCase() }],
    }).select("-passwordHash");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { loginAdmin, getAdminProfile };
