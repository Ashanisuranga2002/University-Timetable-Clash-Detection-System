const bcrypt = require("bcryptjs");
const User = require("../models/User");

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
    const salt = await bcrypt.genSalt(10);
    const defaultHash = await bcrypt.hash("User@123", salt);
    const usersWithHash = INITIAL_USERS.map((u) => ({
      ...u,
      passwordHash: defaultHash,
    }));
    await User.insertMany(usersWithHash);
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

    const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { userId: id };
    const user = await User.findOne(query).select("-passwordHash");
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
    const { userId, name, email, password, role, department, status } = req.body;
    if (!userId || !name || !email) {
      return res.status(400).json({ success: false, message: "User ID, Name, and Email are required" });
    }

    const existing = await User.findOne({
      $or: [{ userId: userId.trim().toUpperCase() }, { email: email.trim().toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "User ID or Email already exists" });
    }

    let passwordHash = undefined;
    const rawPass = password && password.trim() ? password.trim() : "Temp@123";
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(rawPass, salt);

    const newUser = await User.create({
      userId: userId.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role || "Student",
      department: department?.trim() || "Faculty of Computing",
      status: status || "Active",
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    return res.status(201).json({ success: true, data: userObj, message: "User created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, status } = req.body;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { userId: id };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (email) {
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== user.email) {
        const emailTaken = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
        if (emailTaken) {
          return res.status(409).json({ success: false, message: "Email is already taken by another user" });
        }
        user.email = emailLower;
      }
    }
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }
    if (role) user.role = role;
    if (department) user.department = department.trim();
    if (status) user.status = status;

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return res.status(200).json({ success: true, data: userObj, message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status (Active, Inactive, Suspended) is required" });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { userId: id };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = status;
    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return res.status(200).json({ success: true, data: userObj, message: `User status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { deactivateOnly } = req.query;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { userId: id };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (deactivateOnly === "true") {
      user.status = "Inactive";
      await user.save();
      const userObj = user.toObject();
      delete userObj.passwordHash;
      return res.status(200).json({ success: true, data: userObj, message: "User deactivated successfully" });
    }

    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
