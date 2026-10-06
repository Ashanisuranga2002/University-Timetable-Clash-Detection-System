const User = require("../models/User");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

const INITIAL_USERS = [
  {
    userId: "ADM001",
    name: "Dr. Sarah Mitchell",
    email: "admin@university.edu",
    role: "Administrator",
    department: "Academic Affairs",
    status: "Active",
  },
  {
    userId: "ADV001",
    name: "Prof. Alan Vance",
    email: "a.vance@university.edu",
    role: "Academic Advisor",
    department: "Faculty of Computing",
    status: "Active",
  },
  {
    userId: "STU001",
    name: "Kasun Perera",
    email: "kasun.p@my.sliit.lk",
    role: "Student",
    department: "Software Engineering",
    status: "Active",
  },
  {
    userId: "MON001",
    name: "Elena Rostova",
    email: "elena.r@infra.university.edu",
    role: "Monitor",
    department: "Cloud Operations",
    status: "Active",
  },
  {
    userId: "CRD001",
    name: "Dr. Jonathan Hayes",
    email: "j.hayes@university.edu",
    role: "Coordinator",
    department: "Curriculum Planning",
    status: "Active",
  },
];

async function ensureSeedUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.insertMany(INITIAL_USERS);
  }
}

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    await ensureSeedUsers();

    const { search, role, status } = req.query;
    const filter = {};

    if (role && role !== "All") {
      filter.role = role;
    }
    if (status && status !== "All") {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }, { userId: regex }, { department: regex }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { userId: id }] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { userId, name, email, role, department, status } = req.body;
    if (!userId || !name || !email) {
      return res.status(400).json({ success: false, message: "User ID, Name, and Email are required" });
    }

    const existing = await User.findOne({ $or: [{ userId }, { email: email.toLowerCase() }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "User ID or Email already exists" });
    }

    const newUser = await User.create({
      userId: userId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || "Student",
      department: department?.trim() || "Faculty of Computing",
      status: status || "Active",
    });

    return res.status(201).json({ success: true, data: newUser, message: "User created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, status } = req.body;

    const user = await User.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { userId: id }] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role;
    if (department) user.department = department.trim();
    if (status) user.status = status;

    await user.save();
    return res.status(200).json({ success: true, data: user, message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { deactivateOnly } = req.query;

    const user = await User.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { userId: id }] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (deactivateOnly === "true") {
      user.status = "Inactive";
      await user.save();
      return res.status(200).json({ success: true, data: user, message: "User deactivated successfully" });
    }

    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
