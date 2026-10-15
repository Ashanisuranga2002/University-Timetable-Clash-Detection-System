const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const User = require("../models/User");

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

    // User is the source of truth for accounts managed in the admin dashboard.
    // Older deployments may still have an Admin-only account, so retain that
    // collection as a fallback when no directory account exists.
    const userAdmin = await User.findOne({
      $or: [
        { userId: new RegExp(`^${cleanId}$`, "i") },
        { email: cleanId.toLowerCase() },
      ],
      role: { $in: ["Administrator", "Coordinator", "Academic Advisor"] },
    }).select("+passwordHash");

    let admin = null;
    let isPasswordValid = false;
    let isUserModel = false;

    if (userAdmin) {
      if (userAdmin.status && userAdmin.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: `This account is ${userAdmin.status.toLowerCase()}.`,
        });
      }
      isPasswordValid = Boolean(
        userAdmin.passwordHash && await bcrypt.compare(password, userAdmin.passwordHash)
      );
      if (isPasswordValid) {
        admin = userAdmin;
        isUserModel = true;
      }
    } else {
      // Legacy accounts created before the user directory was introduced.
      admin = await Admin.findOne({
        $or: [
          { adminId: new RegExp(`^${cleanId}$`, "i") },
          { email: cleanId.toLowerCase() },
        ],
      }).select("+passwordHash");
      isPasswordValid = Boolean(
        admin?.passwordHash && await bcrypt.compare(password, admin.passwordHash)
      );
    }

    if (!admin || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Admin ID or password",
      });
    }

    // Update last login
    if (!isUserModel) {
      admin.lastLogin = new Date();
      await admin.save();
    }

    const responseAdmin = {
      id: admin._id,
      adminId: admin.adminId || admin.userId,
      userId: admin.adminId || admin.userId,
      name: admin.name,
      email: admin.email,
      role: admin.role || "Administrator",
      department: admin.department || "Academic Affairs",
      status: admin.status || "Active",
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin || new Date(),
    };

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      admin: responseAdmin,
      data: responseAdmin,
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
    const targetId =
      req.params.adminId ||
      req.query.adminId ||
      req.headers["x-admin-id"] ||
      req.headers["x-user-id"];

    if (!targetId || !targetId.trim()) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    const cleanId = targetId.trim();
    const isObjectId = cleanId.match(/^[0-9a-fA-F]{24}$/);

    let admin = await Admin.findOne({
      $or: [
        { adminId: new RegExp(`^${cleanId}$`, "i") },
        { email: cleanId.toLowerCase() },
        ...(isObjectId ? [{ _id: cleanId }] : []),
      ],
    }).select("-passwordHash");

    if (!admin) {
      const userAdmin = await User.findOne({
        $or: [
          { userId: new RegExp(`^${cleanId}$`, "i") },
          { email: cleanId.toLowerCase() },
          ...(isObjectId ? [{ _id: cleanId }] : []),
        ],
      }).select("-passwordHash");

      if (userAdmin) {
        admin = {
          id: userAdmin._id,
          adminId: userAdmin.userId,
          userId: userAdmin.userId,
          name: userAdmin.name,
          email: userAdmin.email,
          role: userAdmin.role,
          department: userAdmin.department,
          status: userAdmin.status,
          createdAt: userAdmin.createdAt,
          lastLogin: new Date(),
        };
      }
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin profile not found" });
    }

    const data = {
      id: admin._id || admin.id,
      adminId: admin.adminId || admin.userId,
      userId: admin.adminId || admin.userId,
      name: admin.name,
      email: admin.email,
      role: admin.role === "admin" ? "Administrator" : admin.role,
      department: admin.department || "Academic Affairs",
      status: admin.status || "Active",
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin || new Date(),
    };

    res.status(200).json({ success: true, admin: data, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update safe admin profile fields (name, department)
const updateAdminProfile = async (req, res) => {
  try {
    const targetId =
      req.params.adminId ||
      req.headers["x-admin-id"] ||
      req.body.adminId ||
      req.body.userId;

    const { name, department } = req.body;

    if (!targetId) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    const cleanId = targetId.trim();
    let admin = await Admin.findOne({
      $or: [{ adminId: cleanId }, { email: cleanId.toLowerCase() }],
    });

    if (admin) {
      if (name && name.trim()) admin.name = name.trim();
      if (department && department.trim()) admin.department = department.trim();
      await admin.save();
    } else {
      const userAdmin = await User.findOne({
        $or: [{ userId: cleanId.toUpperCase() }, { email: cleanId.toLowerCase() }],
      });
      if (userAdmin) {
        if (name && name.trim()) userAdmin.name = name.trim();
        if (department && department.trim()) userAdmin.department = department.trim();
        await userAdmin.save();
        admin = userAdmin;
      }
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const updated = {
      id: admin._id,
      adminId: admin.adminId || admin.userId,
      userId: admin.adminId || admin.userId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      department: admin.department,
      status: admin.status || "Active",
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: updated,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { loginAdmin, getAdminProfile, updateAdminProfile };
