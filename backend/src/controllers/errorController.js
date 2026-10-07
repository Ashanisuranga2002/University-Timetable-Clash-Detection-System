import mongoose, { Types } from 'mongoose';
import { parseSubgroupFields } from './subgroupController.js';
import { validateRecords, timeRangesOverlap } from '../services/validationService.js';
import { Subgroup } from '../models/Subgroup.js';
import { Timetable } from '../models/Timetable.js';
import { ValidationResult } from '../models/ValidationResult.js';
import { ValidationError } from '../models/ValidationError.js';
import { HttpError } from '../utils/HttpError.js';
import { canonicalSlotCode, readTimetableSessions } from '../services/timetableSessionService.js';
import { bodyObject, optionalEnum, optionalString, positiveInteger, requiredString, routeObjectId, stringArray } from '../utils/request.js';
const errorStatuses = ['unresolved', 'in_progress', 'resolved'];
const severities = ['SEV-1', 'SEV-2', 'SEV-3'];
const errorTypes = ['CLASH', 'CAPACITY', 'LECTURER_CONFLICT', 'VENUE_CONFLICT'];
export async function listErrors(req, res) {
  const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInteger(req.query.limit, 20, 100);
  const status = optionalEnum(req.query.status, errorStatuses, 'status');
  const severity = optionalEnum(req.query.severity, severities, 'severity');
  const errorType = optionalEnum(req.query.errorType, errorTypes, 'errorType');
  const filter = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (errorType) filter.errorType = errorType;
  if (typeof req.query.timetableId === 'string') filter.timetableId = routeObjectId(req.query.timetableId, 'timetableId');
  if (typeof req.query.studentId === 'string' && req.query.studentId.trim()) filter.studentId = req.query.studentId.trim().toUpperCase();
  if (typeof req.query.moduleCode === 'string' && req.query.moduleCode.trim()) filter.moduleCode = req.query.moduleCode.trim().toUpperCase();
  for (const key of ['subgroup', 'day', 'startTime', 'endTime', 'venue']) {
    const value = req.query[key];
    if (typeof value === 'string' && value.trim()) filter[`currentSlot.${key}`] = key === 'subgroup' ? value.trim().toUpperCase() : value.trim();
  }
  const [data, total] = await Promise.all([ValidationError.find(filter).sort({
    severity: 1,
    createdAt: -1
  }).skip((page - 1) * limit).limit(limit), ValidationError.countDocuments(filter)]);
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
export async function getError(req, res) {
  const id = routeObjectId(req.params.id);
  const error = await ValidationError.findById(id);
  if (!error) throw new HttpError(404, 'Validation error not found.');
  res.status(200).json({
    success: true,
    data: error
  });
}
export async function updateError(req, res) {
  const id = routeObjectId(req.params.id);
  const body = bodyObject(req);
  const error = await ValidationError.findById(id);
  if (!error) throw new HttpError(404, 'Validation error not found.');
  let changed = false;
  const status = optionalEnum(body.status, errorStatuses, 'status');
  const severity = optionalEnum(body.severity, severities, 'severity');
  const errorType = optionalEnum(body.errorType, errorTypes, 'errorType');
  if (status === 'resolved') throw new HttpError(400, 'Use Save Changes to validate and resolve this error.');
  if ('status' in body && status) {
    error.status = status;
    changed = true;
  }
  if ('severity' in body && severity) {
    error.severity = severity;
    changed = true;
  }
  if ('errorType' in body && errorType) {
    error.errorType = errorType;
    changed = true;
  }
  if ('description' in body) {
    error.description = requiredString(body, 'description', 1000);
    changed = true;
  }
  if ('recommendedSlot' in body) {
    error.recommendedSlot = optionalString(body, 'recommendedSlot', 30);
    changed = true;
  }
  if ('advisor' in body) {
    error.advisor = optionalString(body, 'advisor', 160);
    changed = true;
  }
  if ('justification' in body) {
    error.justification = optionalString(body, 'justification', 2000);
    changed = true;
  }
  if (!changed) throw new HttpError(400, 'At least one supported validation error field must be supplied.');
  error.auditLog.push({
    action: 'updated',
    actorId: req.auth.sub,
    details: 'Validation error fields were updated by a coordinator.',
    createdAt: new Date()
  });
  await error.save();
  res.status(200).json({
    success: true,
    data: error
  });
}
export async function deleteError(req, res) {
  const id = routeObjectId(req.params.id);
  const error = await ValidationError.findByIdAndDelete(id);
  if (!error) throw new HttpError(404, 'Validation error not found.');
  res.status(200).json({
    success: true,
    data: {
      id: id.toString(),
      deleted: true
    }
  });
}
export async function resolveError(req, res) {
  const id = routeObjectId(req.params.id);
  const body = bodyObject(req);
  const options = parseResolution(body);
  const error = await ValidationError.findById(id);
  if (!error) throw new HttpError(404, 'Validation error not found.');
  const updatedRecords = await resolveErrorRecord(error, options, req.auth.sub);
  res.status(200).json({
    success: true,
    data: {
      error,
      updatedRecords
    }
  });
}
export async function batchResolveErrors(req, res) {
  const body = bodyObject(req);
  const ids = stringArray(body.errorIds, 'errorIds', 500);
  const options = parseResolution(body);
  let updatedRecords = 0;
  let updatedErrors = 0;
  const errors = [];
  for (const id of new Set(ids)) {
    try {
      const error = await ValidationError.findById(routeObjectId(id));
      if (!error) throw new HttpError(404, 'Validation error not found.');
      updatedRecords += await resolveErrorRecord(error, options, req.auth.sub);
      updatedErrors++;
    } catch (cause) {
      errors.push({
        id,
        message: cause instanceof HttpError ? cause.message : 'Could not save this correction. Please retry.'
      });
    }
  }
  res.json({
    success: true,
    data: {
      updatedErrors,
      updatedRecords,
      failed: errors.length,
      errors
    }
  });
}
function parseResolution(body) {
  const justification = requiredString(body, 'justification', 2000);
  const targetSlot = optionalString(body, 'targetSlot', 30);
  const changes = body.changes;
  if (changes !== undefined && (!changes || typeof changes !== 'object' || Array.isArray(changes))) {
    throw new HttpError(400, 'Enter valid correction fields.');
  }
  if (!targetSlot && !changes) throw new HttpError(400, 'Select a session or edit the incorrect fields.');
  return {
    targetSlot,
    changes: changes,
    justification,
    cohortBatch: body.cohortBatch === true,
    sendNotification: body.sendNotification === true
  };
}
async function resolveErrorRecord(error, options, coordinatorId) {
  // Both the record and its audit/error state commit together, or neither does.
  const topology = await mongoose.connection.db.admin().command({
    hello: 1
  });
  const supportsTransactions = Boolean(topology.setName || topology.msg === 'isdbgrid');
  let savedResultId;
  let undoRecords = [];
  let undoErrors = [];
  const apply = async session => {
    const latest = await ValidationError.findById(error._id).session(session ?? null);
    if (!latest || latest.status === 'resolved') throw new HttpError(409, 'This error is already resolved. Refresh the error list.');
    const current = await Subgroup.findById(latest.subgroupId).session(session ?? null);
    if (!current || current.status !== 'active') throw new HttpError(409, 'The affected active record no longer exists. Run validation again.');
    const timetable = await Timetable.findById(current.timetableId).session(session ?? null);
    if (!timetable) throw new HttpError(404, 'Timetable not found.');
    let changes = options.changes;
    if (!changes) {
      const sessions = await readTimetableSessions(timetable);
      const target = sessions.find(item => item.moduleCode === current.moduleCode && canonicalSlotCode(item.subgroup) === canonicalSlotCode(options.targetSlot));
      if (!target) throw new HttpError(400, 'Choose an existing session for this module.');
      changes = {
        subgroup: target.subgroup,
        day: target.day,
        startTime: target.startTime,
        endTime: target.endTime,
        venue: target.venue,
        lecturerName: target.lecturerName ?? ''
      };
    }
    const allowed = ['subgroup', 'day', 'startTime', 'endTime', 'venue', 'lecturerName'];
    const edited = Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.includes(key)));
    const parsed = parseSubgroupFields({
      ...current.toObject(),
      timetableId: current.timetableId.toString(),
      ...edited
    }, false);
    if (timetable.venues.length && !timetable.venues.some(venue => venue.name.toLowerCase() === parsed.venue?.toLowerCase())) throw new HttpError(400, 'Choose a venue listed in the master timetable.');
    const candidate = new Subgroup({
      ...current.toObject(),
      ...parsed
    });
    await candidate.validate();
    const masterSessions = await readTimetableSessions(timetable);
    for (const master of masterSessions) {
      const matches = record => master.moduleCode === record.moduleCode && canonicalSlotCode(master.subgroup) === canonicalSlotCode(record.subgroup) && master.day === record.day && master.startTime === record.startTime && master.endTime === record.endTime && master.venue.toLowerCase() === record.venue.toLowerCase();
      if (matches(current) || matches(candidate)) continue;
      if (master.day !== candidate.day || !timeRangesOverlap(master.startTime, master.endTime, candidate.startTime, candidate.endTime)) continue;
      if (master.venue.toLowerCase() === candidate.venue.toLowerCase() || candidate.lecturerName && master.lecturerName?.toLowerCase() === candidate.lecturerName.toLowerCase()) {
        throw new HttpError(409, 'The correction still conflicts with a session in the master timetable.');
      }
    }
    if (allowed.every(key => String(current.get(key) ?? '') === String(candidate.get(key) ?? ''))) {
      throw new HttpError(400, 'Change the incorrect data before saving.');
    }
    const records = await Subgroup.find({
      timetableId: current.timetableId,
      status: 'active'
    }).session(session ?? null).lean();
    const affected = records.filter(item => item._id.equals(current._id) || options.cohortBatch && item.moduleCode === current.moduleCode && item.year === current.year && item.semester === current.semester && item.subgroup === current.subgroup && item.day === current.day && item.startTime === current.startTime && item.endTime === current.endTime && item.venue === current.venue);
    const ids = new Set(affected.map(item => item._id.toString()));
    const patch = Object.fromEntries(allowed.map(key => [key, candidate.get(key) ?? '']));
    const projected = records.map(item => ids.has(item._id.toString()) ? {
      ...item,
      ...patch
    } : item);
    const issues = validateRecords(projected, timetable.venues);
    const remaining = issues.find(issue => ids.has(issue.subgroupId.toString()));
    if (remaining) throw new HttpError(409, `The correction still has an error: ${remaining.description}`);
    if (!supportsTransactions) {
      undoRecords = await Subgroup.find({
        _id: {
          $in: affected.map(item => item._id)
        }
      });
      undoErrors = await ValidationError.find({
        timetableId: current.timetableId,
        status: {
          $ne: 'resolved'
        }
      });
    }
    await Subgroup.updateMany({
      _id: {
        $in: affected.map(item => item._id)
      }
    }, {
      $set: patch
    }, {
      session,
      runValidators: true
    });
    const currentKeys = new Set(issues.map(issue => issue.issueKey));
    const pending = await ValidationError.find({
      timetableId: current.timetableId,
      status: {
        $ne: 'resolved'
      }
    }).session(session ?? null);
    for (const item of pending) {
      if (currentKeys.has(item.issueKey)) continue;
      item.status = 'resolved';
      item.justification = options.justification;
      item.coordinatorId = new Types.ObjectId(coordinatorId);
      item.resolvedAt = new Date();
      item.cohortBatch = options.cohortBatch;
      item.sendNotification = options.sendNotification;
      item.auditLog.push({
        action: 'resolved',
        actorId: coordinatorId,
        details: `Correction ${JSON.stringify(patch)}. Justification: ${options.justification}`.slice(0, 1000),
        createdAt: new Date()
      });
      await item.save({
        session
      });
    }
    const errorCount = new Set(issues.map(issue => issue.subgroupId.toString())).size;
    const [result] = await ValidationResult.create([{
      timetableId: current.timetableId,
      totalRecords: records.length,
      validRecords: records.length - errorCount,
      errorRecords: errorCount,
      cleanPercentage: Number(((records.length - errorCount) / records.length * 100).toFixed(1)),
      clashPercentage: Number((errorCount / records.length * 100).toFixed(1)),
      executionTime: 0,
      engineVersion: '1.0.0',
      status: errorCount ? 'completed_with_errors' : 'completed'
    }], {
      session
    });
    savedResultId = result._id;
    return affected.length;
  };
  if (supportsTransactions) return mongoose.connection.transaction(apply);
  // The development database may be standalone. Restore both collections if a
  // later write fails; replica sets use the transaction above instead.
  try {
    return await apply();
  } catch (cause) {
    if (savedResultId) await ValidationResult.deleteOne({
      _id: savedResultId
    });
    for (const record of undoRecords) await Subgroup.replaceOne({
      _id: record._id
    }, record.toObject());
    for (const record of undoErrors) await ValidationError.replaceOne({
      _id: record._id
    }, record.toObject());
    throw cause;
  }
}
