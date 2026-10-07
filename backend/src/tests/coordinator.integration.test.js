import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import app from '../app.js';
import { ValidationError } from '../models/ValidationError.js';
import { createAccessToken } from '../middleware/authMiddleware.js';

// Opt-in: uses a fresh database; never changes the configured application database.
test('Coordinator: persisted CRUD, correction validation, audit and deletion', {
  skip: process.env.RUN_DB_TESTS !== '1'
}, async context => {
  const dbName = `coordinator_test_${Date.now()}`;
  await mongoose.connect(process.env.MONGO_URI ?? process.env.MONGODB_URI, {
    dbName,
    serverSelectionTimeoutMS: 5000
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  const token = createAccessToken({
    sub: new mongoose.Types.ObjectId().toString(),
    role: 'coordinator'
  });
  const call = async (path, method = 'GET', data, expected = 200) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(data instanceof FormData ? {} : {
          'Content-Type': 'application/json'
        })
      },
      body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data)
    });
    const body = await response.json();
    assert.equal(response.status, expected, body.message);
    return body.data;
  };
  try {
    const file = new FormData();
    file.append('file', new Blob(['moduleCode,moduleName,subgroup,day,startTime,endTime,venue,capacity\nIT3060,HCI,A,Monday,09:00,10:00,R1,1\nIT3060,HCI,B,Tuesday,09:00,10:00,R2,10']), 'master.csv');
    file.append('academicYear', '2026/2027');
    file.append('semester', 'Semester 1');
    file.append('faculty', 'Computing');
    const upload = await call('/timetables/upload', 'POST', file, 201);
    const timetableId = upload.timetable._id;
    assert.equal((await call(`/timetables/${timetableId}/sessions`)).length, 2);
    const sessions = await call(`/timetables/${timetableId}/sessions`);
    sessions[1].venue = 'R3';
    await call(`/timetables/${timetableId}`, 'PUT', {
      sessions,
      faculty: 'Faculty of Computing'
    });
    assert.equal((await call(`/timetables/${timetableId}/sessions`))[1].venue, 'R3');
    await call(`/timetables/${timetableId}`, 'PUT', {
      sessions: [{
        ...sessions[0],
        endTime: '08:00'
      }]
    }, 400);
    const input = {
      timetableId,
      studentId: 'IT001',
      studentName: 'Test Student',
      program: 'IT',
      year: 3,
      semester: 1,
      moduleCode: 'IT3060',
      moduleName: 'HCI',
      subgroup: 'A',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      venue: 'R1',
      status: 'active'
    };
    const first = await call('/subgroups', 'POST', input, 201);
    await call(`/subgroups/${first._id}`, 'PUT', {
      studentName: 'Updated Student'
    });
    assert.equal((await call(`/subgroups/${first._id}`)).studentName, 'Updated Student');
    await call(`/subgroups/${first._id}`, 'PUT', {
      endTime: '08:00'
    }, 400);
    await call('/subgroups', 'POST', {
      ...input,
      studentId: 'IT002'
    }, 201);
    await call(`/validation/run/${timetableId}`, 'POST');
    const errors = await call(`/errors?timetableId=${timetableId}&status=unresolved`);
    const error = errors.find(item => item.subgroupId === first._id);
    assert.ok(error);
    await call(`/errors/${error._id}/resolve`, 'PUT', {
      changes: {
        venue: 'R1'
      }
    }, 400);
    await call(`/errors/${error._id}/resolve`, 'PUT', {
      changes: {
        lecturerName: 'Still over capacity'
      },
      justification: 'Test invalid correction'
    }, 409);
    assert.equal((await call(`/errors/${error._id}`)).status, 'unresolved');
    assert.equal((await call(`/subgroups/${first._id}`)).venue, 'R1');
    await call(`/errors/${error._id}`, 'PUT', {
      status: 'resolved'
    }, 400);
    const failedSave = context.mock.method(ValidationError.prototype, 'save', async () => {
      throw new Error('Injected database save failure');
    });
    await call(`/errors/${error._id}/resolve`, 'PUT', {
      changes: {
        subgroup: 'B',
        day: 'Tuesday',
        venue: 'R2'
      },
      justification: 'Test failed save.'
    }, 500);
    failedSave.mock.restore();
    assert.equal((await call(`/subgroups/${first._id}`)).day, 'Monday');
    assert.equal((await call(`/errors/${error._id}`)).status, 'unresolved');
    await call(`/errors/${error._id}/resolve`, 'PUT', {
      changes: {
        subgroup: 'B',
        day: 'Tuesday',
        venue: 'R2'
      },
      justification: 'Move to a room with capacity.'
    });
    const saved = await call(`/errors/${error._id}`);
    assert.equal(saved.status, 'resolved');
    assert.equal(saved.justification, 'Move to a room with capacity.');
    assert.ok(saved.auditLog.length);
    assert.equal((await call(`/subgroups/${first._id}`)).day, 'Tuesday');
    const runs = await call(`/validation/runs?timetableId=${timetableId}`);
    assert.equal(runs[0].errorRecords, 0);
    const dataset = new FormData();
    dataset.append('timetableId', timetableId);
    dataset.append('file', new Blob(['studentId,studentName,program,year,semester,moduleCode,moduleName,subgroup,day,startTime,endTime,venue\nIT003,Upload Student,IT,3,1,IT3060,HCI,B,Tuesday,09:00,10:00,R2']), 'subgroups.csv');
    const subgroupUpload = await call('/subgroups/upload', 'POST', dataset, 201);
    assert.equal(subgroupUpload.insertedRecords, 1);
    await call(`/subgroups/${first._id}`, 'DELETE');
    await call(`/subgroups/${first._id}`, 'GET', undefined, 404);
    await call(`/timetables/${timetableId}`, 'DELETE');
    assert.equal((await call(`/subgroups?timetableId=${timetableId}`)).length, 0);
    assert.equal((await call(`/errors?timetableId=${timetableId}`)).length, 0);
    await call(`/timetables/${timetableId}`, 'GET', undefined, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
