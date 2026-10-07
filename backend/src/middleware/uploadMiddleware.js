import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { HttpError } from '../utils/HttpError.js';
export const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
mkdirSync(uploadsDirectory, {
  recursive: true
});
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  }
});
export const uploadSpreadsheet = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.csv'].includes(extension)) {
      callback(new HttpError(400, 'Only .xlsx and .csv files are supported.'));
      return;
    }
    callback(null, true);
  }
}).single('file');
