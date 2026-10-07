import path from 'node:path';
import ExcelJS from 'exceljs';
import { HttpError } from '../utils/HttpError.js';
import { uploadsDirectory } from '../middleware/uploadMiddleware.js';
export async function readTimetableSessions(timetable) {
  if (timetable.sessions !== undefined) return timetable.sessions;
  const match = timetable.fileUrl ? /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(timetable.fileUrl) : null;
  if (!match) throw new HttpError(404, 'The uploaded master timetable file is unavailable.');
  const filePath = path.resolve(uploadsDirectory, match[1]);
  if (!filePath.startsWith(`${uploadsDirectory}${path.sep}`)) throw new HttpError(400, 'The timetable file path is invalid.');
  const workbook = new ExcelJS.Workbook();
  if (timetable.fileName.toLowerCase().endsWith('.csv')) await workbook.csv.readFile(filePath);else if (timetable.fileName.toLowerCase().endsWith('.xlsx')) await workbook.xlsx.readFile(filePath);else throw new HttpError(400, 'The stored timetable must be a CSV or XLSX file.');
  const sessions = [];
  for (const worksheet of workbook.worksheets) {
    let columnMap;
    worksheet.eachRow((row, rowNumber) => {
      const values = Array.from({
        length: row.cellCount
      }, (_unused, index) => row.getCell(index + 1).text.trim());
      if (rowNumber === 1) {
        const headers = values.map(normalizeHeader);
        columnMap = {
          moduleCode: findHeader(headers, ['modulecode', 'subjectcode', 'coursecode']),
          moduleName: findHeader(headers, ['modulename', 'subjectname', 'coursename']),
          day: findHeader(headers, ['day', 'weekday']),
          startTime: findHeader(headers, ['starttime', 'from', 'start']),
          endTime: findHeader(headers, ['endtime', 'to', 'end']),
          subgroup: findHeader(headers, ['subgroup', 'slot', 'slotcode', 'group']),
          venue: findHeader(headers, ['venue', 'room', 'location', 'classroom']),
          lecturerName: findHeader(headers, ['lecturername', 'lecturer', 'tutor', 'instructor'])
        };
        return;
      }
      if (!columnMap || values.every(value => !value)) return;
      const value = key => columnMap[key] < 0 ? '' : values[columnMap[key]] ?? '';
      const moduleCode = value('moduleCode').toUpperCase();
      const subgroup = canonicalSlotCode(value('subgroup'));
      const day = titleCase(value('day'));
      const startTime = normalizeTime(value('startTime'));
      const endTime = normalizeTime(value('endTime'));
      const venue = value('venue');
      if (!moduleCode || !subgroup || !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day) || !startTime || !endTime || endTime <= startTime || !venue) throw new HttpError(400, `Timetable row ${rowNumber} has missing fields, an invalid day or an invalid time range.`);
      sessions.push({
        moduleCode,
        moduleName: value('moduleName'),
        day,
        startTime,
        endTime,
        subgroup,
        venue,
        ...(value('lecturerName') ? {
          lecturerName: value('lecturerName')
        } : {})
      });
    });
  }
  return sessions;
}
export function canonicalSlotCode(value) {
  const normalized = value.trim().toUpperCase();
  return normalized.startsWith('SLOT-') ? normalized : normalized ? `SLOT-${normalized}` : '';
}
function normalizeHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function findHeader(headers, aliases) {
  return headers.findIndex(header => aliases.includes(header));
}
function titleCase(value) {
  const normalized = value.trim().toLowerCase();
  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : '';
}
function normalizeTime(value) {
  const normalized = value.trim();
  const twentyFourHour = /^(?:([01]\d|2[0-3])):([0-5]\d)$/.exec(normalized);
  if (twentyFourHour) return normalized;
  const twelveHour = /^(1[0-2]|0?[1-9]):([0-5]\d)\s*([ap])\.?m\.?$/i.exec(normalized);
  if (!twelveHour) return '';
  let hours = Number(twelveHour[1]) % 12;
  if (twelveHour[3].toLowerCase() === 'p') hours += 12;
  return `${String(hours).padStart(2, '0')}:${twelveHour[2]}`;
}
