const bcrypt = require('bcryptjs');
const User = require('../../models/User.js');
const { createAccessToken } = require('../middleware/authMiddleware.js');
const { HttpError } = require('../utils/HttpError.js');
const { bodyObject, requiredString } = require('../utils/request.js');
async function login(req, res) {
  const body = bodyObject(req);
  const studentId = requiredString(body, 'studentId', 100).trim();
  const password = requiredString(body, 'password', 200);
  const user = await User.findOne({
    $or: [{ userId: studentId }, { email: studentId.toLowerCase() }]
  }).select('+passwordHash');
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Student ID or password is incorrect.');
  }
  if (user.role !== 'Coordinator' || user.status !== 'Active') {
    throw new HttpError(403, 'A coordinator account is required to access this module.');
  }
  const token = createAccessToken({
    sub: user._id.toString(),
    role: 'coordinator'
  });
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      studentId: user.userId,
      role: 'coordinator'
    }
  });
}

module.exports = { login };
