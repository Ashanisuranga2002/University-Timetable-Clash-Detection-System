import { performance } from 'node:perf_hooks';
import { Subgroup } from '../models/Subgroup.js';
import { Timetable } from '../models/Timetable.js';
import { ValidationError } from '../models/ValidationError.js';
import { ValidationResult } from '../models/ValidationResult.js';
import { VALIDATION_ENGINE_VERSION, validateRecords } from '../services/validationService.js';
import { HttpError } from '../utils/HttpError.js';
import { routeObjectId } from '../utils/request.js';
export async function getValidationRuns(req, res) {
  const limitValue = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
  const limit = Number.isInteger(limitValue) ? Math.max(1, Math.min(limitValue, 100)) : 20;
  const filter = {};
  if (typeof req.query.timetableId === 'string') filter.timetableId = routeObjectId(req.query.timetableId, 'timetableId');
  const data = await ValidationResult.find(filter).sort({
    createdAt: -1
  }).limit(limit).populate('timetableId', 'fileName academicYear semester').lean();
  res.status(200).json({
    success: true,
    data
  });
}
export async function runValidation(req, res) {
  const timetableId = routeObjectId(req.params.timetableId, 'timetableId');
  const timetable = await Timetable.findById(timetableId);
  if (!timetable) throw new HttpError(404, 'Timetable not found.');
  const records = await Subgroup.find({
    timetableId,
    status: 'active'
  }).lean();
  if (records.length === 0) {
    throw new HttpError(400, 'No active subgroup records are available for this timetable. Upload subgroup data to this timetable before running validation.');
  }
  const startedAt = performance.now();
  const issues = validateRecords(records, timetable.venues);
  const executionTime = Number((performance.now() - startedAt).toFixed(2));
  const affectedRecordIds = new Set(issues.map(issue => issue.subgroupId.toString()));
  const totalRecords = records.length;
  const errorRecords = affectedRecordIds.size;
  const validRecords = Math.max(0, totalRecords - errorRecords);
  const cleanPercentage = totalRecords === 0 ? 100 : Number((validRecords / totalRecords * 100).toFixed(1));
  const clashPercentage = totalRecords === 0 ? 0 : Number((errorRecords / totalRecords * 100).toFixed(1));
  const result = await ValidationResult.create({
    timetableId,
    totalRecords,
    validRecords,
    errorRecords,
    cleanPercentage,
    clashPercentage,
    executionTime,
    engineVersion: VALIDATION_ENGINE_VERSION,
    status: errorRecords > 0 ? 'completed_with_errors' : 'completed'
  });
  await synchronizeIssues(timetableId, result._id, issues);
  res.status(200).json({
    success: true,
    data: {
      resultId: result._id,
      summary: {
        totalRecords,
        validRecords,
        errorRecords,
        cleanPercentage,
        clashPercentage
      },
      issueCount: issues.length,
      executionTime,
      engineVersion: VALIDATION_ENGINE_VERSION,
      status: result.status
    }
  });
}
async function synchronizeIssues(timetableId, resultId, issues) {
  const now = new Date();
  const activeErrors = await ValidationError.find({
    timetableId,
    status: {
      $in: ['unresolved', 'in_progress']
    }
  });
  const currentKeys = new Set(issues.map(({
    issueKey
  }) => issueKey));
  for (const error of activeErrors) {
    if (currentKeys.has(error.issueKey)) continue;
    error.status = 'resolved';
    error.justification = 'Automatically cleared because the issue no longer appears in the latest validation run.';
    error.resolvedAt = now;
    error.auditLog.push({
      action: 'auto_resolved',
      actorName: 'Validation Engine',
      details: 'Issue cleared by a later validation run.',
      createdAt: now
    });
    await error.save();
  }
  for (const issue of issues) {
    let error = await ValidationError.findOne({
      issueKey: issue.issueKey
    });
    if (!error) {
      await ValidationError.create({
        ...issue,
        timetableId,
        validationResultId: resultId,
        status: 'unresolved',
        auditLog: []
      });
      continue;
    }
    if (error.status === 'resolved') {
      error.auditLog.push({
        action: 'reopened',
        actorName: 'Validation Engine',
        details: 'The issue appeared again in a later validation run.',
        createdAt: now
      });
      error.resolvedAt = undefined;
      error.justification = undefined;
    }
    error.set({
      ...issue,
      timetableId,
      validationResultId: resultId,
      status: 'unresolved'
    });
    await error.save();
  }
}
