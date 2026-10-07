import { Subgroup } from '../models/Subgroup.js';
import { Timetable } from '../models/Timetable.js';
import { ValidationError } from '../models/ValidationError.js';
import { ValidationResult } from '../models/ValidationResult.js';
export async function getDashboardStats(_req, res) {
  const [timetableFiles, periods, subgroupData, latestValidation, scheduleClashes, recentUploads] = await Promise.all([Timetable.countDocuments(), Timetable.find({
    status: {
      $in: ['uploaded', 'processing', 'processed']
    }
  }).select('academicYear semester').lean(), Subgroup.countDocuments({
    status: 'active'
  }), ValidationResult.findOne().sort({
    createdAt: -1
  }).lean(), ValidationError.countDocuments({
    status: {
      $in: ['unresolved', 'in_progress']
    }
  }), buildRecentUploads()]);
  const activeSemesters = new Set(periods.map(({
    academicYear,
    semester
  }) => `${academicYear}:${semester}`)).size;
  const validMatrix = latestValidation?.cleanPercentage ?? 0;
  const validationStatus = latestValidation ? {
    resultId: latestValidation._id,
    timetableId: latestValidation.timetableId,
    status: latestValidation.status,
    totalRecords: latestValidation.totalRecords,
    validRecords: latestValidation.validRecords,
    errorRecords: latestValidation.errorRecords,
    cleanPercentage: latestValidation.cleanPercentage,
    createdAt: latestValidation.createdAt
  } : {
    status: 'not_run'
  };
  res.status(200).json({
    success: true,
    data: {
      timetableFiles,
      activeSemesters,
      subgroupData,
      validMatrix,
      scheduleClashes,
      recentUploads,
      validationStatus
    }
  });
}
export async function getRecentUploads(_req, res) {
  res.status(200).json({
    success: true,
    data: await buildRecentUploads()
  });
}
async function buildRecentUploads() {
  const [timetables, subgroupBatches] = await Promise.all([Timetable.find().sort({
    createdAt: -1
  }).limit(12).lean(), Subgroup.aggregate([{
    $match: {
      sourceFileName: {
        $exists: true,
        $ne: null
      }
    }
  }, {
    $group: {
      _id: {
        batchId: '$uploadBatchId',
        fileName: '$sourceFileName',
        timetableId: '$timetableId'
      },
      fileName: {
        $first: '$sourceFileName'
      },
      fileSize: {
        $max: '$sourceFileSize'
      },
      recordCount: {
        $sum: 1
      },
      status: {
        $first: '$status'
      },
      createdAt: {
        $max: '$createdAt'
      },
      timetableId: {
        $first: '$timetableId'
      }
    }
  }, {
    $sort: {
      createdAt: -1
    }
  }, {
    $limit: 12
  }])]);
  const timetableUploads = timetables.map(timetable => ({
    id: timetable._id.toString(),
    type: 'timetable',
    fileName: timetable.fileName,
    fileSize: timetable.fileSize,
    recordCount: timetable.allocatedSlots,
    status: timetable.status,
    createdAt: timetable.createdAt ?? new Date(0)
  }));
  const subgroupUploads = subgroupBatches.map(batch => ({
    id: batch._id.batchId ?? `${batch._id.timetableId}:${batch._id.fileName}`,
    type: 'subgroups',
    fileName: batch.fileName,
    fileSize: batch.fileSize ?? 0,
    recordCount: batch.recordCount,
    status: batch.status,
    createdAt: batch.createdAt,
    timetableId: batch.timetableId.toString()
  }));
  return [...timetableUploads, ...subgroupUploads].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 10);
}
