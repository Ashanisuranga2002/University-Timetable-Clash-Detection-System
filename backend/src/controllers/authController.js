const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const User = require("../models/User");
const Admin = require("../models/Admin");
const {
  findStudentByIdentifier,
  findStudentUserByIdentifier,
  ensureStudentProfile,
} = require("../utils/studentResolver");
const { ensureSeedUsers } = require("./adminUserController");

const accountQuery = (identifier) => {
  const cleanIdentifier = String(identifier || "").trim();
  const escapedIdentifier = cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    $or: [
      { userId: new RegExp(`^${escapedIdentifier}$`, "i") },
      { adminId: new RegExp(`^${escapedIdentifier}$`, "i") },
      { email: cleanIdentifier.toLowerCase() },
    ],
  };
};

const normaliseRole = (role) => (role === "admin" ? "Administrator" : role || "Student");

const accountResponse = (account, role) => {
  const resolvedRole = normaliseRole(role || account.role);
  const accountId = account.userId || account.adminId || account.studentId;

  return {
    id: account._id,
    userId: accountId,
    adminId: accountId,
    studentId: account.studentId || (resolvedRole === "Student" ? accountId : undefined),
    name: account.name,
    email: account.email,
    role: resolvedRole,
    department: account.department,
    status: account.status || "Active",
    programme: account.programme,
    semester: account.semester || 1,
  };
};

// Student Registration
const registerStudent = async (req, res) => {
  try {
    const { studentId, name, email, password, programme, semester } = req.body;

    if (!studentId || !name || !email || !password || !programme || !semester) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentId = studentId.trim();

    const existingStudent = await Student.findOne({
      $or: [{ studentId: cleanStudentId }, { email: cleanEmail }],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student with this ID or Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await Student.create({
      studentId: cleanStudentId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      programme: programme.trim(),
      semester: Number(semester),
    });

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        programme: student.programme,
        semester: student.semester,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Student Login
const loginStudent = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID and password are required",
      });
    }

    const cleanId = studentId.trim();

    // Student is the canonical account used by registrations and clashes.
    let student = await findStudentByIdentifier(cleanId);

    let isPasswordValid = false;

    if (student) {
      isPasswordValid = await bcrypt.compare(password, student.passwordHash);
    } else {
      // Older/admin-created accounts may exist only in User. Validate first,
      // then create the canonical Student profile so their data has one owner.
      const user = await findStudentUserByIdentifier(cleanId);

      if (user && user.passwordHash) {
        isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordValid) {
          student = await ensureStudentProfile(user);
        }
      }
    }

    if (!student || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Student ID or password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        programme: student.programme || "Information Technology",
        semester: student.semester || 1,
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

// Unified login for every account type. The role is read from the account;
// the client does not need a separate role selector or login endpoint.
const loginUnified = async (req, res) => {
  try {
    const { userId, studentId, password } = req.body;
    const identifier = (userId || studentId || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "University ID and password are required",
      });
    }

    // Also makes the documented development account available on an existing
    // database, not only after a full database reseed.
    await ensureSeedUsers();

    const studentUser = await findStudentUserByIdentifier(identifier);
    if (studentUser?.status && studentUser.status !== "Active") {
      return res.status(403).json({ success: false, message: `This account is ${studentUser.status.toLowerCase()}.` });
    }

    const student = await findStudentByIdentifier(identifier);
    if (student) {
      const valid = await bcrypt.compare(password, student.passwordHash);
      if (valid) {
        const account = accountResponse(student, "Student");
        return res.status(200).json({ success: true, message: "Login successful", account, student: account });
      }
    }

    if (studentUser?.passwordHash && await bcrypt.compare(password, studentUser.passwordHash)) {
      const canonicalStudent = await ensureStudentProfile(studentUser);
      const account = accountResponse(canonicalStudent, "Student");
      return res.status(200).json({ success: true, message: "Login successful", account, student: account });
    }

    const user = await User.findOne(accountQuery(identifier)).select("+passwordHash");
    if (user) {
      if (user.status && user.status !== "Active") {
        return res.status(403).json({ success: false, message: `This account is ${user.status.toLowerCase()}.` });
      }

      if (user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
        const account = accountResponse(user, user.role);
        return res.status(200).json({ success: true, message: "Login successful", account, admin: account });
      }

      // Do not accept an older password from the legacy Admin copy when the
      // directory account exists; user management owns the current password.
      return res.status(401).json({ success: false, message: "Invalid university ID or password" });
    }

    const admin = await Admin.findOne(accountQuery(identifier)).select("+passwordHash");
    if (admin?.passwordHash && await bcrypt.compare(password, admin.passwordHash)) {
      if (admin.status && admin.status !== "Active") {
        return res.status(403).json({ success: false, message: `This account is ${admin.status.toLowerCase()}.` });
      }
      const account = accountResponse(admin, normaliseRole(admin.role));
      return res.status(200).json({ success: true, message: "Login successful", account, admin: account });
    }

    return res.status(401).json({ success: false, message: "Invalid university ID or password" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  loginUnified,
};
