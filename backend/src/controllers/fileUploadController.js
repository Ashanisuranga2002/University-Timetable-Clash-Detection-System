import { unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import ExcelJS from 'exceljs';
import { Subgroup } from '../models/Subgroup.js';
import { Timetable } from '../models/Timetable.js';
import { HttpError } from '../utils/HttpError.js';
import { bodyObject, requiredString, routeObjectId } from '../utils/request.js';
import { readTimetableSessions } from '../services/timetableSessionService.js';
import { parseSubgroupFields } from './subgroupController.js';
export async function uploadTimetableFile(req, res) {
  if (!req.file) throw new HttpError(400, 'Choose an .xlsx or .csv timetable file.');
  try {
    const body = bodyObject(req);
    const sheets = await readSpreadsheet(req.file.path, req.file.originalname);
    const sheetNames = sheets.map(({
      name
    }) => name);
    if (sheetNames.length === 0) throw new HttpError(400, 'The workbook contains no sheets.');
    let allocatedSlots = 0;
    const venues = new Map();
    for (const sheet of sheets) {
      const rows = nonEmptyRows(sheet.rows);
      if (rows.length < 2) continue;
      const headers = rows[0].map(normalizeHeader);
      const venueIndex = findHeader(headers, ['venue', 'room', 'location', 'classroom']);
      const capacityIndex = findHeader(headers, ['capacity', 'roomcapacity', 'venuecapacity']);
      allocatedSlots += rows.length - 1;
      if (venueIndex < 0) continue;
      for (const row of rows.slice(1)) {
        const venueName = cellText(row[venueIndex]);
        if (!venueName) continue;
        const capacity = capacityIndex < 0 ? undefined : Number(cellText(row[capacityIndex]));
        const key = venueName.toLocaleLowerCase();
        const previous = venues.get(key);
        const detectedCapacity = capacity !== undefined && Number.isInteger(capacity) && capacity > 0 ? capacity : previous?.capacity;
        venues.set(key, {
          name: venueName,
          ...(detectedCapacity === undefined ? {} : {
            capacity: detectedCapacity
          })
        });
      }
    }
    if (allocatedSlots === 0) throw new HttpError(400, 'No timetable rows were found below the header rows.');
    const sessions = await readTimetableSessions({
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`
    });
    if (!sessions.length) throw new HttpError(400, 'No valid timetable sessions were found. Check the column headings.');
    const timetable = await Timetable.create({
      sessions,
      academicYear: requiredString(body, 'academicYear', 20),
      semester: requiredString(body, 'semester', 80),
      faculty: requiredString(body, 'faculty', 160),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileUrl: `/uploads/${req.file.filename}`,
      sheetsDetected: sheetNames.length,
      allocatedSlots,
      venues: [...venues.values()],
      status: 'processed',
      uploadedBy: new Types.ObjectId(req.auth.sub)
    });
    res.status(201).json({
      success: true,
      data: {
        timetable,
        upload: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          sheetsDetected: sheetNames.length,
          allocatedSlots,
          venuesDetected: venues.size
        }
      }
    });
  } catch (error) {
    await removeUploadedFile(req.file.path);
    throw error;
  }
}
export async function uploadSubgroupFile(req, res) {
  if (!req.file) throw new HttpError(400, 'Choose an .xlsx or .csv subgroup file.');
  try {
    const body = bodyObject(req);
    const timetableId = routeObjectId(requiredString(body, 'timetableId', 40), 'timetableId');
    if (!(await Timetable.exists({
      _id: timetableId
    }))) throw new HttpError(404, 'Selected timetable was not found.');
    const workbookSheets = await readSpreadsheet(req.file.path, req.file.originalname);
    const firstSheet = workbookSheets[0];
    if (!firstSheet) throw new HttpError(400, 'The subgroup workbook contains no sheets.');
    const rows = nonEmptyRows(firstSheet.rows);
    if (rows.length < 2) throw new HttpError(400, 'The subgroup file must contain a header row and at least one data row.');
    const headers = rows[0].map(normalizeHeader);
    const columnMap = mapSubgroupColumns(headers);
    const sourceFileName = req.file.originalname;
    const uploadBatchId = randomUUID();
    const errors = [];
    const candidates = [];
    const dataRows = rows.slice(1);
    for (const [index, row] of dataRows.entries()) {
      try {
        const record = {
          timetableId: timetableId.toString()
        };
        for (const [field, columnIndex] of Object.entries(columnMap)) {
          const raw = cellText(row[columnIndex]);
          record[field] = field === 'day' ? titleCase(raw) : field === 'startTime' || field === 'endTime' ? normalizeTime(raw) : field === 'year' || field === 'semester' ? Number(raw) : raw;
        }
        const document = new Subgroup({
          ...parseSubgroupFields(record, false),
          sourceFileName,
          sourceFileSize: req.file.size,
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
          row: index + 2,
          message: error instanceof Error ? error.message : 'Record validation failed.'
        });
      }
    }
    const inserted = candidates.length > 0 ? await Subgroup.insertMany(candidates.map(({
      document
    }) => document)) : [];
    const recordCount = dataRows.length;
    await removeUploadedFile(req.file.path);
    res.status(errors.length === 0 ? 201 : 200).json({
      success: true,
      data: {
        fileName: sourceFileName,
        totalRecords: recordCount,
        validRecords: candidates.length,
        invalidRecords: errors.length,
        insertedRecords: inserted.length,
        errors,
        uploadBatchId
      }
    });
  } catch (error) {
    await removeUploadedFile(req.file.path);
    throw error;
  }
}
function nonEmptyRows(rows) {
  return rows.filter(row => row.some(cell => cellText(cell) !== ''));
}
async function readSpreadsheet(filePath, fileName) {
  const workbook = new ExcelJS.Workbook();
  if (fileName.toLowerCase().endsWith('.csv')) await workbook.csv.readFile(filePath);else await workbook.xlsx.readFile(filePath);
  return workbook.worksheets.map(worksheet => {
    const rows = [];
    worksheet.eachRow({
      includeEmpty: true
    }, row => {
      rows[row.number - 1] = Array.from({
        length: row.cellCount
      }, (_unused, index) => row.getCell(index + 1).text.trim());
    });
    return {
      name: worksheet.name,
      rows
    };
  });
}
function cellText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}
function normalizeHeader(value) {
  return cellText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}
function findHeader(headers, aliases) {
  return headers.findIndex(header => aliases.includes(header));
}
function mapSubgroupColumns(headers) {
  const aliases = {
    studentId: ['studentid', 'registrationnumber', 'registrationno', 'regno', 'indexnumber'],
    studentName: ['studentname', 'name', 'fullname'],
    program: ['program', 'degreeprogram', 'course', 'degree'],
    year: ['year', 'academicyear', 'studyyear'],
    semester: ['semester', 'semesterNo', 'term'],
    moduleCode: ['modulecode', 'subjectcode', 'coursecode'],
    moduleName: ['modulename', 'subjectname', 'coursename'],
    subgroup: ['subgroup', 'slot', 'slotcode', 'group'],
    day: ['day', 'weekday'],
    startTime: ['starttime', 'from', 'start'],
    endTime: ['endtime', 'to', 'end'],
    venue: ['venue', 'room', 'location', 'classroom'],
    lecturerName: ['lecturername', 'lecturer', 'tutor', 'instructor']
  };
  const result = {};
  for (const [field, fieldAliases] of Object.entries(aliases)) {
    const index = findHeader(headers, fieldAliases.map(normalizeHeader));
    if (index >= 0) result[field] = index;
  }
  const required = ['studentId', 'studentName', 'program', 'year', 'semester', 'moduleCode', 'moduleName', 'subgroup', 'day', 'startTime', 'endTime', 'venue'];
  const missing = required.filter(field => result[field] === undefined);
  if (missing.length) throw new HttpError(400, `Missing required subgroup columns: ${missing.join(', ')}.`);
  return result;
}
function titleCase(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : value;
}
function normalizeTime(value) {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
async function removeUploadedFile(filePath) {
  await unlink(filePath).catch(() => undefined);
}
