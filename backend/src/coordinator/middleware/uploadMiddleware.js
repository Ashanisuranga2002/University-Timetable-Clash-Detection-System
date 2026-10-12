const { randomUUID } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const { HttpError } = require('../utils/HttpError.js');
const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
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
const uploadSpreadsheet = multer({
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

module.exports = { uploadsDirectory, uploadSpreadsheet };
