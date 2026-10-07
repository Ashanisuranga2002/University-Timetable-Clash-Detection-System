import { randomUUID } from 'node:crypto';
import { Subgroup } from '../models/Subgroup.js';
import { ValidationError } from '../models/ValidationError.js';
import { Timetable } from '../models/Timetable.js';
import { HttpError } from '../utils/HttpError.js';
import { bodyObject, optionalNumber, optionalString, optionalEnum, positiveInteger, requiredNumber, requiredString, routeObjectId } from '../utils/request.js';
const subgroupStatuses = ['active', 'inactive'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export async function createSubgroup(req, res) {
  const body = bodyObject(req);
  const fields = parseSubgroupFields(body, false);
  await ensureTimetableExists(fields.timetableId);
  const subgroup = await Subgroup.create(fields);
  res.status(201).json({
    success: true,
    data: subgroup
  });
}
export async function listSubgroups(req, res) {
  const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInteger(req.query.limit, 50, 500);
  const filter = {};
  for (const key of ['moduleCode', 'subgroup', 'studentId', 'status']) {
    const value = req.query[key];
    if (typeof value === 'string' && value.trim()) {
      filter[key] = key === 'moduleCode' || key === 'subgroup' || key === 'studentId' ? value.trim().toUpperCase() : value.trim();
    }
  }
  if (typeof req.query.timetableId === 'string') filter.timetableId = routeObjectId(req.query.timetableId, 'timetableId');
  const [data, total] = await Promise.all([Subgroup.find(filter).sort({
    createdAt: -1
  }).skip((page - 1) * limit).limit(limit), Subgroup.countDocuments(filter)]);
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
export async function getSubgroup(req, res) {
  const id = routeObjectId(req.params.id);
  const subgroup = await Subgroup.findById(id);
  if (!subgroup) throw new HttpError(404, 'Subgroup record not found.');
  res.status(200).json({
    success: true,
    data: subgroup
  });
}
export async function updateSubgroup(req, res) {
  const id = routeObjectId(req.params.id);
  const body = bodyObject(req);
  const subgroup = await Subgroup.findById(id);
  if (!subgroup) throw new HttpError(404, 'Subgroup record not found.');
  subgroup.set(parseSubgroupFields({
    ...subgroup.toObject(),
    timetableId: subgroup.timetableId.toString(),
    ...body
  }, false));
  const pending = await ValidationError.exists({
    subgroupId: subgroup._id,
    status: {
      $ne: 'resolved'
    }
  });
  if (pending) throw new HttpError(409, 'Use the error list to correct this record with a justification.');
  if ('timetableId' in body) await ensureTimetableExists(subgroup.timetableId);
  await subgroup.save();
  res.status(200).json({
    success: true,
    data: subgroup
  });
}
export async function deleteSubgroup(req, res) {
  const id = routeObjectId(req.params.id);
  const subgroup = await Subgroup.findByIdAndDelete(id);
  if (!subgroup) throw new HttpError(404, 'Subgroup record not found.');
  await ValidationError.deleteMany({
    $or: [{
      subgroupId: id
    }, {
      relatedSubgroupId: id
    }]
  });
  res.status(200).json({
    success: true,
    data: {
      id: id.toString(),
      deleted: true
    }
  });
}
export async function bulkCreateSubgroups(req, res) {
  const body = bodyObject(req);
  if (!Array.isArray(body.records) || body.records.length === 0 || body.records.length > 5000) {
    throw new HttpError(400, 'records must be a non-empty array containing at most 5,000 entries.');
  }
  const sourceFileName = optionalString(body, 'sourceFileName', 255);
  const sourceFileSize = optionalNumber(body, 'sourceFileSize', 0);
  const uploadBatchId = randomUUID();
  const errors = [];
  const candidates = [];
  for (const [index, raw] of body.records.entries()) {
    try {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new HttpError(400, 'Record must be a JSON object.');
      const fields = parseSubgroupFields(raw, false);
      const document = new Subgroup({
        ...fields,
        sourceFileName,
        sourceFileSize,
        uploadBatchId
      });
      await document.validate();
      candidates.push({
        index,
        document
      });
    } catch (error) {
      errors.push({
        index,
        message: validationMessage(error)
      });
    }
  }
  const timetableIds = [...new Set(candidates.map(({
    document
  }) => document.timetableId.toString()))];
  const existingTimetableIds = new Set((await Timetable.find({
    _id: {
      $in: timetableIds
    }
  }).select('_id').lean()).map(({
    _id
  }) => _id.toString()));
  const validDocuments = candidates.filter(({
    index,
    document
  }) => {
    if (existingTimetableIds.has(document.timetableId.toString())) return true;
    errors.push({
      index,
      message: 'timetableId does not refer to an existing timetable.'
    });
    return false;
  }).map(({
    document
  }) => document);
  const inserted = validDocuments.length > 0 ? await Subgroup.insertMany(validDocuments) : [];
  res.status(errors.length === 0 ? 201 : 200).json({
    success: true,
    inserted: inserted.length,
    failed: errors.length,
    errors,
    data: {
      uploadBatchId,
      sourceFileName: sourceFileName ?? null
    }
  });
}
export function parseSubgroupFields(body, partial) {
  const fields = {};
  if (!partial || 'studentId' in body) fields.studentId = requiredString(body, 'studentId', 30).toUpperCase();
  if (!partial || 'studentName' in body) fields.studentName = requiredString(body, 'studentName', 120);
  if (!partial || 'program' in body) fields.program = requiredString(body, 'program', 160);
  if (!partial || 'year' in body) fields.year = requiredNumber(body, 'year', 1);
  if (!partial || 'semester' in body) fields.semester = requiredNumber(body, 'semester', 1);
  if (!partial || 'moduleCode' in body) fields.moduleCode = requiredString(body, 'moduleCode', 30).toUpperCase();
  if (!partial || 'moduleName' in body) fields.moduleName = requiredString(body, 'moduleName', 160);
  if (!partial || 'subgroup' in body) fields.subgroup = requiredString(body, 'subgroup', 30).toUpperCase();
  if (!partial || 'day' in body) {
    const day = requiredString(body, 'day', 20);
    if (!weekdays.includes(day)) throw new HttpError(400, `day must be one of: ${weekdays.join(', ')}.`);
    fields.day = day;
  }
  if (!partial || 'startTime' in body) fields.startTime = validateTime(requiredString(body, 'startTime', 5), 'startTime');
  if (!partial || 'endTime' in body) fields.endTime = validateTime(requiredString(body, 'endTime', 5), 'endTime');
  if (fields.startTime && fields.endTime && toMinutes(fields.endTime) <= toMinutes(fields.startTime)) {
    throw new HttpError(400, 'endTime must be later than startTime.');
  }
  if (!partial || 'venue' in body) fields.venue = requiredString(body, 'venue', 100);
  if ('lecturerName' in body) fields.lecturerName = optionalString(body, 'lecturerName', 120);
  if (!partial || 'timetableId' in body) fields.timetableId = routeObjectId(requiredString(body, 'timetableId', 40), 'timetableId');
  if ('sourceFileName' in body) fields.sourceFileName = optionalString(body, 'sourceFileName', 255);
  if ('sourceFileSize' in body) fields.sourceFileSize = optionalNumber(body, 'sourceFileSize', 0);
  if ('uploadBatchId' in body) fields.uploadBatchId = optionalString(body, 'uploadBatchId', 80);
  if ('status' in body) fields.status = optionalEnum(body.status, subgroupStatuses, 'status');
  if ('year' in fields && !Number.isInteger(fields.year)) throw new HttpError(400, 'year must be a whole number.');
  if ('semester' in fields && !Number.isInteger(fields.semester)) throw new HttpError(400, 'semester must be a whole number.');
  return fields;
}
async function ensureTimetableExists(id) {
  const exists = await Timetable.exists({
    _id: id
  });
  if (!exists) throw new HttpError(400, 'timetableId does not refer to an existing timetable.');
}
function validateTime(value, field) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new HttpError(400, `${field} must use 24-hour HH:mm format.`);
  return value;
}
function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
function validationMessage(error) {
  if (error instanceof HttpError) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Record validation failed.';
}
