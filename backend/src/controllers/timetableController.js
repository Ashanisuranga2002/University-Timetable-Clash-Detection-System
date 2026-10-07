import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Types } from 'mongoose';
import { Subgroup } from '../models/Subgroup.js';
import { Timetable } from '../models/Timetable.js';
import { ValidationError } from '../models/ValidationError.js';
import { ValidationResult } from '../models/ValidationResult.js';
import { HttpError } from '../utils/HttpError.js';
import { readTimetableSessions } from '../services/timetableSessionService.js';
import { bodyObject, optionalNumber, optionalString, positiveInteger, requiredNumber, requiredString, routeObjectId } from '../utils/request.js';
const timetableStatuses = ['uploaded', 'processing', 'processed', 'failed'];
export async function createTimetable(req, res) {
  const body = bodyObject(req);
  const timetable = await Timetable.create({
    ...parseTimetableFields(body, false),
    uploadedBy: new Types.ObjectId(req.auth.sub)
  });
  res.status(201).json({
    success: true,
    data: timetable
  });
}
export async function listTimetables(req, res) {
  const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInteger(req.query.limit, 20, 100);
  const filter = {};
  for (const key of ['academicYear', 'semester', 'faculty', 'status']) {
    const value = req.query[key];
    if (typeof value === 'string' && value.trim()) filter[key] = value.trim();
  }
  const [data, total] = await Promise.all([Timetable.find(filter).sort({
    createdAt: -1
  }).skip((page - 1) * limit).limit(limit), Timetable.countDocuments(filter)]);
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
export async function getTimetable(req, res) {
  const id = routeObjectId(req.params.id);
  const timetable = await Timetable.findById(id);
  if (!timetable) throw new HttpError(404, 'Timetable not found.');
  res.status(200).json({
    success: true,
    data: timetable
  });
}
export async function getTimetableSessions(req, res) {
  const id = routeObjectId(req.params.id);
  const timetable = await Timetable.findById(id).lean();
  if (!timetable) throw new HttpError(404, 'Timetable not found.');
  const data = await readTimetableSessions(timetable);
  res.status(200).json({
    success: true,
    data
  });
}
export async function updateTimetable(req, res) {
  const id = routeObjectId(req.params.id);
  const body = bodyObject(req);
  const timetable = await Timetable.findById(id);
  if (!timetable) throw new HttpError(404, 'Timetable not found.');
  const fields = parseTimetableFields(body, true);
  // Legacy uploads rely on their original extension when parsing the stored file.
  // Materialize those same sessions before changing the display name, so both
  // View and the existing subgroup correction reader continue to work.
  if (fields.fileName !== undefined && fields.fileName !== timetable.fileName && timetable.sessions === undefined && timetable.fileUrl && fields.sessions === undefined) {
    timetable.sessions = await readTimetableSessions(timetable);
  }
  timetable.set(fields);
  if ('sessions' in body) {
    for (const session of timetable.sessions ?? []) {
      if (!timetable.venues.some(venue => venue.name.toLowerCase() === session.venue.toLowerCase())) {
        timetable.venues.push({
          name: session.venue
        });
      }
    }
  }
  await timetable.save();
  res.status(200).json({
    success: true,
    data: timetable
  });
}
export async function deleteTimetable(req, res) {
  const id = routeObjectId(req.params.id);
  const timetable = await Timetable.findById(id);
  if (!timetable) throw new HttpError(404, 'Timetable not found.');
  await Promise.all([Subgroup.deleteMany({
    timetableId: id
  }), ValidationError.deleteMany({
    timetableId: id
  }), ValidationResult.deleteMany({
    timetableId: id
  })]);
  await timetable.deleteOne();
  if (timetable.fileUrl && /^\/uploads\/[A-Za-z0-9._-]+$/.test(timetable.fileUrl)) {
    await unlink(path.resolve(process.cwd(), timetable.fileUrl.slice(1))).catch(() => undefined);
  }
  res.status(200).json({
    success: true,
    data: {
      id: id.toString(),
      deleted: true
    }
  });
}
function parseTimetableFields(body, partial) {
  const fields = {};
  if (!partial || 'academicYear' in body) fields.academicYear = requiredString(body, 'academicYear', 20);
  if (!partial || 'semester' in body) fields.semester = requiredString(body, 'semester', 80);
  if (!partial || 'faculty' in body) fields.faculty = requiredString(body, 'faculty', 160);
  if (!partial || 'fileName' in body) {
    fields.fileName = requiredString(body, 'fileName', 255);
    if (/[\x00-\x1f\x7f]/.test(fields.fileName)) throw new HttpError(400, 'The file name must not contain control characters.');
  }
  if (!partial || 'fileSize' in body) fields.fileSize = requiredNumber(body, 'fileSize');
  if (!partial || 'sheetsDetected' in body) fields.sheetsDetected = requiredNumber(body, 'sheetsDetected');
  if (!partial || 'allocatedSlots' in body) fields.allocatedSlots = requiredNumber(body, 'allocatedSlots');
  if ('fileUrl' in body) {
    const fileUrl = optionalString(body, 'fileUrl', 2048);
    if (fileUrl) {
      let parsed;
      try {
        parsed = new URL(fileUrl);
      } catch {
        throw new HttpError(400, 'fileUrl must be a valid URL.');
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new HttpError(400, 'fileUrl must use HTTP or HTTPS.');
    }
    fields.fileUrl = fileUrl;
  }
  if ('sessions' in body) {
    if (!Array.isArray(body.sessions) || body.sessions.length > 5000) throw new HttpError(400, 'Supply up to 5,000 timetable sessions.');
    fields.sessions = body.sessions.map(raw => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, 'Invalid timetable session.');
      const row = raw;
      const result = {
        moduleCode: requiredString(row, 'moduleCode', 30).toUpperCase(),
        moduleName: requiredString(row, 'moduleName', 160),
        subgroup: requiredString(row, 'subgroup', 30).toUpperCase(),
        day: requiredString(row, 'day', 20),
        startTime: requiredString(row, 'startTime', 5),
        endTime: requiredString(row, 'endTime', 5),
        venue: requiredString(row, 'venue', 100),
        lecturerName: optionalString(row, 'lecturerName', 120)
      };
      if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(result.day) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(result.startTime) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(result.endTime) || result.endTime <= result.startTime) {
        throw new HttpError(400, 'Use a valid weekday and HH:mm times with end after start.');
      }
      return result;
    });
    fields.allocatedSlots = fields.sessions.length;
  }
  if ('venues' in body) fields.venues = parseVenues(body.venues);
  if ('status' in body) {
    const status = body.status;
    if (typeof status !== 'string' || !timetableStatuses.includes(status)) {
      throw new HttpError(400, `status must be one of: ${timetableStatuses.join(', ')}.`);
    }
    fields.status = status;
  }
  if (!partial) {
    const requiredFields = ['academicYear', 'semester', 'faculty', 'fileName', 'fileSize', 'sheetsDetected', 'allocatedSlots'];
    for (const key of requiredFields) if (!(key in fields)) throw new HttpError(400, `${key} is required.`);
  }
  return fields;
}
function parseVenues(value) {
  if (!Array.isArray(value)) throw new HttpError(400, 'venues must be an array.');
  return value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new HttpError(400, `venues[${index}] must be an object.`);
    }
    const venue = entry;
    const name = typeof venue.name === 'string' ? venue.name.trim() : '';
    if (!name) throw new HttpError(400, `venues[${index}].name is required.`);
    const capacity = optionalNumber(venue, 'capacity', 1);
    const type = optionalString(venue, 'type', 80);
    return {
      name,
      ...(capacity === undefined ? {} : {
        capacity
      }),
      ...(type ? {
        type
      } : {})
    };
  });
}
