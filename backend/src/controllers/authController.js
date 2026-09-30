const bcrypt = require("bcryptjs");
const Student = require("../models/Student");

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

    // Allow login with studentId or email
    const student = await Student.findOne({
      $or: [{ studentId: cleanId }, { email: cleanId.toLowerCase() }],
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid Student ID or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, student.passwordHash);

    if (!isPasswordValid) {
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
        programme: student.programme,
        semester: student.semester,
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

module.exports = {
  registerStudent,
  loginStudent,
};
