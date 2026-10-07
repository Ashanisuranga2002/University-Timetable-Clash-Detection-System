import mongoose from 'mongoose';
import multer from 'multer';
import { HttpError } from '../utils/HttpError.js';
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} was not found.`
  });
};
export const errorHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  let statusCode = 500;
  let message = 'An unexpected server error occurred.';
  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'The submitted data is invalid.';
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'A supplied identifier or value is invalid.';
  } else if (isDuplicateKeyError(error)) {
    statusCode = 409;
    message = 'A record with one of these unique values already exists.';
  } else if (isBodyParserError(error)) {
    statusCode = 400;
    message = 'The request body is invalid or exceeds the configured limit.';
  } else if (error instanceof multer.MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'The uploaded file exceeds the 20 MB limit.' : 'Upload exactly one supported spreadsheet file.';
  }
  console.error(`[API ${statusCode}]`, error);
  res.status(statusCode).json({
    success: false,
    message
  });
};
function isDuplicateKeyError(error) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
function isBodyParserError(error) {
  return typeof error === 'object' && error !== null && 'type' in error && (error.type === 'entity.parse.failed' || error.type === 'entity.too.large');
}
