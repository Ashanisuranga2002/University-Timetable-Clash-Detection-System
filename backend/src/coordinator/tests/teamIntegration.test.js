const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Full production app, with a fresh local database and no shared fixture mutation.
test('Team integration: existing roles and Coordinator use their original identity stores', {
  skip: process.env.RUN_DB_TESTS !== '1'
}, async context => {
  const uri = new URL(process.env.MONGO_URI || process.env.MONGODB_URI);
  uri.pathname = `/role_integration_${randomUUID().replaceAll('-', '')}`;
  process.env.MONGO_URI = uri.toString();
  const app = require('../../server');
  await mongoose.connection.asPromise();
  const User = require('../../models/User');
  const Student = require('../../models/Student');
  const Admin = require('../../models/Admin');
  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function call(path, method = 'GET', body, status = 200, token) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify(result));
    return result;
  }
  try {
    await Student.create({ studentId: 'TEST-STUDENT', name: 'Student', email: 'student@example.test', passwordHash, programme: 'IT', semester: 3 });
    await Admin.create({ adminId: 'TEST-ADMIN', name: 'Admin', email: 'admin@example.test', passwordHash });
    const user = await User.create({ userId: 'TEST-COORD', name: 'Coordinator', email: 'coord@example.test', passwordHash, role: 'Coordinator' });
    assert.equal((await call('/auth/login', 'POST', { studentId: 'TEST-STUDENT', password })).student.studentId, 'TEST-STUDENT');
    await call('/auth/login', 'POST', { studentId: 'TEST-STUDENT', password: randomUUID() }, 401);
    await context.test('Student dashboard responds successfully (main regression check)', async () => {
      await call('/dashboard/TEST-STUDENT');
    });
    await call('/courses');
    assert.equal((await call('/admin/auth/login', 'POST', { adminId: 'TEST-ADMIN', password })).admin.adminId, 'TEST-ADMIN');
    const request = await call('/student-requests', 'POST', { studentId: 'TEST-STUDENT', courseCode: 'IT100', currentGroup: 'A', requestedGroup: 'B', reason: 'Timetable conflict' }, 201);
    const review = await call('/advisor-reviews', 'POST', { requestId: request.request._id, advisorId: 'TEST-ADVISOR', comments: 'Review draft', decision: 'APPROVED', reviewStatus: 'DRAFT' }, 201);
    assert.equal((await call('/advisor-reviews/TEST-ADVISOR')).length, 1);
    await call(`/advisor-reviews/${review.review._id}`, 'DELETE');
    await call(`/student-requests/${request.request._id}`, 'DELETE');
    await call('/coordinator/module/timetables', 'GET', undefined, 401);
    const session = await call('/coordinator/module/auth/login', 'POST', { studentId: 'TEST-COORD', password });
    assert.equal(session.user.id, user.id);
    await call('/coordinator/module/dashboard/stats', 'GET', undefined, 200, session.token);
    await call('/coordinator/module/timetables', 'GET', undefined, 200, session.token);
    await call('/coordinator/module/auth/login', 'POST', { studentId: 'coord@example.test', password });
    await call('/coordinator/module/auth/login', 'POST', { studentId: 'TEST-COORD', password: randomUUID() }, 401);
    user.status = 'Suspended'; await user.save();
    await call('/coordinator/module/auth/login', 'POST', { studentId: 'TEST-COORD', password }, 403);
    user.status = 'Active'; user.role = 'Academic Advisor'; await user.save();
    await call('/coordinator/module/auth/login', 'POST', { studentId: 'TEST-COORD', password }, 403);
    const { createAccessToken } = require('../middleware/authMiddleware');
    await call('/coordinator/module/timetables', 'GET', undefined, 403, createAccessToken({ sub: user.id, role: 'student' }));
  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
