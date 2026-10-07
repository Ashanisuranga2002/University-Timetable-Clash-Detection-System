import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { createAccessToken } from '../middleware/authMiddleware.js';
import { HttpError } from '../utils/HttpError.js';
import { bodyObject, requiredString } from '../utils/request.js';
export async function login(req, res) {
  const body = bodyObject(req);
  const studentId = requiredString(body, 'studentId', 30).toUpperCase();
  const password = requiredString(body, 'password', 200);
  const user = await User.findOne({
    studentId
  }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Student ID or password is incorrect.');
  }
  if (user.role !== 'coordinator') {
    throw new HttpError(403, 'A coordinator account is required to access this module.');
  }
  const token = createAccessToken({
    sub: user._id.toString(),
    role: user.role
  });
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      studentId: user.studentId,
      role: user.role
    }
  });
}
