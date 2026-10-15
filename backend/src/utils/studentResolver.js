const Student = require("../models/Student");
const User = require("../models/User");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const identifierQuery = (identifier) => {
  const cleanIdentifier = String(identifier || "").trim();
  const escapedIdentifier = escapeRegex(cleanIdentifier);

  return {
    $or: [
      { studentId: new RegExp(`^${escapedIdentifier}$`, "i") },
      { email: cleanIdentifier.toLowerCase() },
    ],
  };
};

const findStudentByIdentifier = (identifier) =>
  Student.findOne(identifierQuery(identifier));

const findStudentUserByIdentifier = (identifier) =>
  User.findOne({
    $or: [
      { userId: new RegExp(`^${escapeRegex(String(identifier || "").trim())}$`, "i") },
      { email: String(identifier || "").trim().toLowerCase() },
    ],
    role: "Student",
  }).select("+passwordHash");

const ensureStudentProfile = async (user) => {
  if (!user) return null;

  return Student.findOneAndUpdate(
    { studentId: user.userId },
    {
      $set: {
        studentId: user.userId,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        programme: user.department || "BSc (Hons) in Information Technology",
        semester: 1,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const resolveStudent = async (identifier) => {
  const student = await findStudentByIdentifier(identifier);
  if (student) return student;

  const user = await findStudentUserByIdentifier(identifier);
  return ensureStudentProfile(user);
};

module.exports = {
  findStudentByIdentifier,
  findStudentUserByIdentifier,
  ensureStudentProfile,
  resolveStudent,
};
