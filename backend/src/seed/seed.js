import path from 'node:path';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Subgroup } from '../models/Subgroup.js';
import { Timetable } from '../models/Timetable.js';
import { User } from '../models/User.js';
import { ValidationError } from '../models/ValidationError.js';
import { ValidationResult } from '../models/ValidationResult.js';
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});
const venueNames = Array.from({
  length: 26
}, (_, index) => `Room ${String(index + 1).padStart(2, '0')}`);
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const modules = [{
  code: 'CS3012',
  name: 'Distributed Systems'
}, {
  code: 'CS3040',
  name: 'Machine Learning'
}, {
  code: 'CS3082',
  name: 'Human Computer Interaction'
}, {
  code: 'CS3051',
  name: 'Software Architecture'
}, {
  code: 'CS3065',
  name: 'Database Systems'
}, {
  code: 'CS3090',
  name: 'Computer Networks'
}];
async function main() {
  const seedPassword = process.env.SEED_COORDINATOR_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('Set SEED_COORDINATOR_PASSWORD (at least 12 characters) in backend/.env before running the seed script.');
  }
  await connectDatabase();
  const coordinator = await seedCoordinator(seedPassword);
  const timetables = await seedTimetables(coordinator._id);
  const subgroups = await seedSubgroups(timetables);
  await seedValidationData(timetables[0]._id, subgroups, coordinator._id);
  console.info('Development seed complete: 1 coordinator, 24 timetables, 14,820 subgroup rows, validation results and example errors.');
}
async function seedCoordinator(password) {
  const existing = await User.findOne({
    studentId: 'IT20601828'
  });
  if (existing) {
    console.info('Coordinator IT20601828 already exists; left its password unchanged.');
    return existing;
  }
  const user = await User.create({
    name: 'Dr. K. Jayawardena',
    studentId: 'IT20601828',
    email: 'coordinator.dev@university.example',
    password,
    role: 'coordinator'
  });
  console.info('Created development coordinator IT20601828. Password is read from SEED_COORDINATOR_PASSWORD.');
  return user;
}
async function seedTimetables(uploadedBy) {
  const existing = await Timetable.find().sort({
    createdAt: 1
  }).limit(24);
  if (existing.length >= 24) return existing;
  const missingCount = 24 - existing.length;
  const documents = Array.from({
    length: missingCount
  }, (_, offset) => {
    const index = existing.length + offset;
    const period = periodForIndex(index);
    const venueList = venueNames.map(name => ({
      name,
      capacity: index === 0 && name === 'Room 04' ? 25 : 80,
      type: name.startsWith('Room 0') ? 'Lecture / Laboratory' : 'Lecture Hall'
    }));
    return {
      academicYear: period.academicYear,
      semester: period.semester,
      faculty: index % 3 === 0 ? 'Faculty of Computing & Technology' : index % 3 === 1 ? 'Faculty of Engineering' : 'Faculty of Science',
      fileName: index === 0 ? 'Master_Timetable_Computing_2025_2026_S2.xlsx' : `Master_Timetable_Faculty_${index + 1}.xlsx`,
      fileSize: index === 0 ? 4_800_000 : 3_200_000 + index * 42_000,
      sheetsDetected: index === 0 ? 4 : 3,
      allocatedSlots: 20,
      venues: venueList,
      status: 'processed',
      uploadedBy,
      createdAt: new Date(Date.now() - (23 - index) * 60_000)
    };
  });
  await Timetable.insertMany(documents);
  return Timetable.find().sort({
    createdAt: 1
  }).limit(24);
}
async function seedSubgroups(timetables) {
  const existingCount = await Subgroup.countDocuments();
  if (existingCount > 0) {
    console.info(`Subgroup collection already contains ${existingCount} rows; sample rows were not duplicated.`);
    return Subgroup.find({
      timetableId: timetables[0]._id
    }).limit(143);
  }
  const totalRows = 14_820;
  const rowsPerTimetable = Math.floor(totalRows / timetables.length);
  let studentSequence = 0;
  const documents = timetables.flatMap((timetable, timetableIndex) => {
    const rowCount = rowsPerTimetable + (timetableIndex < totalRows % timetables.length ? 1 : 0);
    const semesterMatch = /Semester\s+(\d)/i.exec(timetable.semester);
    const semester = semesterMatch ? Number(semesterMatch[1]) : timetableIndex % 2 + 1;
    const batchId = `seed-batch-${timetable._id.toString()}`;
    return Array.from({
      length: rowCount
    }, (_, rowIndex) => {
      const eventIndex = Math.floor(rowIndex / 32);
      const dayIndex = Math.floor(eventIndex / 4);
      const timeIndex = eventIndex % 4;
      const module = modules[eventIndex % modules.length];
      const room = venueNames[eventIndex % 13];
      const studentName = `Student ${String(studentSequence + 1).padStart(5, '0')}`;
      const studentId = timetableIndex === 0 && rowIndex === 0 ? 'IT20601828' : `IT${String(202600000 + studentSequence).slice(-8)}`;
      const currentSequence = studentSequence;
      studentSequence += 1;
      const startHour = 8 + timeIndex * 2;
      const defaultRecord = {
        studentId,
        studentName: timetableIndex === 0 && rowIndex === 0 ? 'Alex Perera' : studentName,
        program: 'BSc (Hons) Software Engineering',
        year: eventIndex % 4 + 1,
        semester,
        moduleCode: module.code,
        moduleName: module.name,
        subgroup: `SLOT-${String.fromCharCode(65 + (eventIndex % 3 + Math.floor(eventIndex / 6)) % 3)}`,
        day: weekdays[dayIndex] ?? 'Friday',
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(startHour + 2).padStart(2, '0')}:00`,
        venue: room,
        lecturerName: `Dr. Lecturer ${eventIndex + 1}`,
        timetableId: timetable._id,
        sourceFileName: timetableIndex === 0 ? 'Subgroups_SoftwareEng_Year3.xlsx' : `Subgroups_Faculty_${timetableIndex + 1}.xlsx`,
        sourceFileSize: timetableIndex === 0 ? 1_400_000 : 980_000,
        uploadBatchId: batchId,
        status: 'active',
        createdAt: new Date(Date.now() - currentSequence % 10_000 * 100)
      };
      if (timetableIndex === 0 && rowIndex === 32) {
        return {
          ...defaultRecord,
          studentId: 'IT20601828',
          studentName: 'Alex Perera',
          moduleCode: 'CS3040',
          moduleName: 'Machine Learning',
          subgroup: 'SLOT-B',
          startTime: '09:00',
          endTime: '11:00',
          venue: 'Room 20',
          lecturerName: 'Dr. Ng'
        };
      }
      if (timetableIndex === 0 && rowIndex === 64) {
        return {
          ...defaultRecord,
          moduleCode: 'CS3082',
          moduleName: 'Human Computer Interaction',
          subgroup: 'SLOT-C',
          startTime: '09:30',
          endTime: '11:30',
          venue: 'Room 01',
          lecturerName: 'Dr. Lecturer 1'
        };
      }
      return defaultRecord;
    });
  });
  await Subgroup.insertMany(documents, {
    ordered: true
  });
  console.info(`Inserted ${documents.length} development subgroup rows.`);
  return Subgroup.find({
    timetableId: timetables[0]._id
  }).limit(143);
}
async function seedValidationData(timetableId, sampleRows, coordinatorId) {
  if ((await ValidationResult.countDocuments()) === 0) {
    await ValidationResult.create({
      timetableId,
      totalRecords: 1000,
      validRecords: 964,
      errorRecords: 36,
      cleanPercentage: 96.4,
      clashPercentage: 3.6,
      executionTime: 2.4,
      engineVersion: '1.0.0',
      status: 'completed_with_errors'
    });
  }
  if ((await ValidationError.countDocuments()) > 0) return;
  const sample = sampleRows.slice(0, 143);
  const documents = sample.map((record, index) => {
    const errorType = ['CLASH', 'CAPACITY', 'LECTURER_CONFLICT', 'VENUE_CONFLICT'][index % 4];
    const isResolved = index === 142;
    return {
      timetableId,
      issueKey: `seed:${errorType}:${record._id.toString()}:${index}`,
      subgroupId: record._id,
      studentId: record.studentId,
      studentName: record.studentName,
      moduleCode: record.moduleCode,
      moduleName: record.moduleName,
      errorType,
      severity: index % 4 === 0 ? 'SEV-1' : 'SEV-2',
      description: index === 0 ? 'Clashes with mandatory Capstone Project Presentation on Wed 14:00–16:00.' : `${errorType.replace('_', ' ').toLowerCase()} found during the development seed validation run.`,
      currentSlot: {
        subgroup: record.subgroup,
        day: record.day,
        startTime: record.startTime,
        endTime: record.endTime,
        venue: record.venue
      },
      recommendedSlot: 'SLOT-A',
      status: isResolved ? 'resolved' : 'unresolved',
      advisor: 'Dr. S. Wickramasinghe',
      ...(isResolved ? {
        resolvedAt: new Date(),
        coordinatorId,
        justification: 'Resolved in development seed data.',
        auditLog: [{
          action: 'resolved',
          actorId: coordinatorId.toString(),
          actorName: 'Dr. K. Jayawardena',
          details: 'Seed example marked resolved.',
          createdAt: new Date()
        }]
      } : {})
    };
  });
  await ValidationError.insertMany(documents);
}
function periodForIndex(index) {
  const periods = [{
    academicYear: '2025/2026',
    semester: 'Semester 2 (Regular)'
  }, {
    academicYear: '2025/2026',
    semester: 'Semester 1 (Regular)'
  }, ...Array.from({
    length: 8
  }, (_, offset) => {
    const year = 2024 - offset;
    return [{
      academicYear: `${year}/${year + 1}`,
      semester: 'Semester 2 (Regular)'
    }, {
      academicYear: `${year}/${year + 1}`,
      semester: 'Semester 1 (Regular)'
    }];
  }).flat()];
  return periods[index % periods.length];
}
void main().catch(error => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
}).finally(async () => {
  await disconnectDatabase();
});
