import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { access, unlink } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import app from '../app.js';
import { createAccessToken } from '../middleware/authMiddleware.js';
import { uploadsDirectory } from '../middleware/uploadMiddleware.js';
import { Timetable } from '../models/Timetable.js';
import { Subgroup } from '../models/Subgroup.js';
import { ValidationError } from '../models/ValidationError.js';

// Each integration test owns a separate database and files; application data is untouched.
test('Master file CRUD: rename persists, legacy files remain readable, subgroup workflow is unchanged', {
  skip: process.env.RUN_DB_TESTS !== '1'
}, async () => {
  await mongoose.connect(process.env.MONGO_URI ?? process.env.MONGODB_URI, {
    dbName: `master_test_${randomUUID().replaceAll('-', '')}`,
    serverSelectionTimeoutMS: 5000
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  const token = createAccessToken({
    sub: new mongoose.Types.ObjectId().toString(),
    role: 'coordinator'
  });
  const files = [];
  const call = async (route, method = 'GET', data, status = 200) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/api${route}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(data instanceof FormData ? {} : {
          'Content-Type': 'application/json'
        })
      },
      body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data)
    });
    const result = await response.json();
    assert.equal(response.status, status, result.message);
    return result.data;
  };
  const upload = async (content, name, status = 201) => {
    const form = new FormData();
    form.append('file', content, name);
    form.append('academicYear', '2026/2027');
    form.append('semester', 'Semester 1');
    form.append('faculty', 'Computing');
    const result = await call('/timetables/upload', 'POST', form, status);
    if (result?.timetable?.fileUrl) files.push(path.join(uploadsDirectory, path.basename(result.timetable.fileUrl)));
    return result;
  };
  try {
    await upload(new Blob(['']), 'empty.csv', 400);
    await upload(new Blob(['not,a,timetable\ninvalid,data,row']), 'invalid.csv', 400);
    await upload(new Blob(['text']), 'unsupported.txt', 400);
    const headers = ['moduleCode', 'moduleName', 'subgroup', 'day', 'startTime', 'endTime', 'venue', 'capacity'];
    const rows = [['IT3060', 'HCI', 'A', 'Monday', '09:00', '10:00', 'R1', 1], ['IT3060', 'HCI', 'B', 'Tuesday', '09:00', '10:00', 'R2', 10]];
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const created = await upload(new Blob([csv]), 'master.csv');
    const id = created.timetable._id;
    const initialSessions = await call(`/timetables/${id}/sessions`);
    assert.equal(initialSessions.length, 2);
    assert.ok((await call('/timetables')).some(item => item._id === id));
    await access(files[0]);
    await call(`/timetables/${id}`, 'PUT', {
      fileName: '   '
    }, 400);
    await call(`/timetables/${id}`, 'PUT', {
      fileName: 'x'.repeat(256)
    }, 400);
    await call(`/timetables/${id}`, 'PUT', {
      fileName: 'bad\nname'
    }, 400);
    assert.equal((await call(`/timetables/${id}`)).fileName, 'master.csv');
    // Simulate an older file-backed upload; extension-free rename must not break parsing.
    await Timetable.updateOne({
      _id: id
    }, {
      $unset: {
        sessions: ''
      }
    });
    await call(`/timetables/${id}`, 'PUT', {
      fileName: '  Master Timetable October 2026  '
    });
    assert.equal((await Timetable.findById(id)).fileName, 'Master Timetable October 2026');
    assert.equal((await call(`/timetables/${id}`)).fileName, 'Master Timetable October 2026');
    assert.deepEqual(await call(`/timetables/${id}/sessions`), initialSessions);
    assert.equal((await call(`/timetables/${id}`)).fileUrl, created.timetable.fileUrl);
    await access(files[0]);
    const subgroupFile = new FormData();
    subgroupFile.append('timetableId', id);
    subgroupFile.append('file', new Blob(['studentId,studentName,program,year,semester,moduleCode,moduleName,subgroup,day,startTime,endTime,venue\n' + 'IT001,One,IT,3,1,IT3060,HCI,A,Monday,09:00,10:00,R1\nIT002,Two,IT,3,1,IT3060,HCI,A,Monday,09:00,10:00,R1']), 'subgroups.csv');
    assert.equal((await call('/subgroups/upload', 'POST', subgroupFile, 201)).insertedRecords, 2);
    await call(`/validation/run/${id}`, 'POST');
    const issues = await call(`/errors?timetableId=${id}&status=unresolved`);
    assert.equal(issues.length, 2);
    const issue = issues[0];
    const beforeRecords = await Subgroup.find({
      timetableId: id
    }).lean();
    const beforeErrors = await ValidationError.find({
      timetableId: id
    }).lean();
    await call(`/timetables/${id}`, 'PUT', {
      fileName: 'Master Renamed Again'
    });
    assert.deepEqual(await Subgroup.find({
      timetableId: id
    }).lean(), beforeRecords);
    assert.deepEqual(await ValidationError.find({
      timetableId: id
    }).lean(), beforeErrors);
    await call(`/errors/${issue._id}/resolve`, 'PUT', {
      changes: {
        day: 'Tuesday'
      }
    }, 400);
    await call(`/errors/${issue._id}/resolve`, 'PUT', {
      changes: {
        lecturerName: 'Still full'
      },
      justification: 'Invalid correction'
    }, 409);
    await call(`/errors/${issue._id}/resolve`, 'PUT', {
      changes: {
        subgroup: 'B',
        day: 'Tuesday',
        venue: 'R2'
      },
      justification: 'Move to available parallel session.'
    });
    assert.equal((await call(`/errors/${issue._id}`)).status, 'resolved');
    assert.equal((await call(`/subgroups/${issue.subgroupId}`)).venue, 'R2');
    const revalidation = await call(`/validation/run/${id}`, 'POST');
    assert.equal(revalidation.status, 'completed');
    assert.equal(revalidation.summary.cleanPercentage, 100);
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Master').addRows([headers, ...rows]);
    const xlsx = await upload(new Blob([new Uint8Array(await workbook.xlsx.writeBuffer())]), 'master.xlsx');
    const xlsxId = xlsx.timetable._id;
    await Timetable.updateOne({
      _id: xlsxId
    }, {
      $unset: {
        sessions: ''
      }
    });
    await call(`/timetables/${xlsxId}`, 'PUT', {
      fileName: 'Renamed Excel timetable'
    });
    assert.equal((await call(`/timetables/${xlsxId}/sessions`)).length, 2);
    await call(`/timetables/${xlsxId}`, 'DELETE');
    assert.equal(await Subgroup.countDocuments({
      timetableId: id
    }), 2);
    await call(`/timetables/${id}`, 'DELETE');
    assert.equal(await Timetable.countDocuments(), 0);
    assert.equal(await Subgroup.countDocuments({
      timetableId: id
    }), 0);
    assert.equal((await call('/timetables')).length, 0);
    await call(`/timetables/${id}`, 'GET', undefined, 404);
    await call(`/timetables/${id}`, 'PUT', {
      fileName: 'Cannot rename deleted file'
    }, 404);
    for (const file of files) await assert.rejects(access(file), {
      code: 'ENOENT'
    });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    for (const file of files) await unlink(file).catch(() => undefined);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
