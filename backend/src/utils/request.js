import { Types } from 'mongoose';
import { HttpError } from './HttpError.js';
export function bodyObject(request) {
  if (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body)) {
    throw new HttpError(400, 'A JSON object is required in the request body.');
  }
  return request.body;
}
export function requiredString(body, key, maxLength = 200) {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${key} is required and must be a non-empty string.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new HttpError(400, `${key} must be ${maxLength} characters or fewer.`);
  return normalized;
}
export function optionalString(body, key, maxLength = 200) {
  if (!(key in body)) return undefined;
  const value = body[key];
  if (value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new HttpError(400, `${key} must be a string.`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new HttpError(400, `${key} must be ${maxLength} characters or fewer.`);
  return normalized;
}
export function requiredNumber(body, key, minimum = 0) {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new HttpError(400, `${key} must be a number greater than or equal to ${minimum}.`);
  }
  return value;
}
export function optionalNumber(body, key, minimum = 0) {
  if (!(key in body)) return undefined;
  const value = body[key];
  if (value === null || value === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new HttpError(400, `${key} must be a number greater than or equal to ${minimum}.`);
  }
  return value;
}
export function routeObjectId(value, label = 'id') {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) throw new HttpError(400, `${label} is not a valid identifier.`);
  return new Types.ObjectId(value);
}
export function positiveInteger(value, fallback, maximum) {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}
export function optionalEnum(value, allowed, label) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new HttpError(400, `${label} must be one of: ${allowed.join(', ')}.`);
  }
  return value;
}
export function stringArray(value, label, maximum) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum || value.some(item => typeof item !== 'string')) {
    throw new HttpError(400, `${label} must be a non-empty array of at most ${maximum} strings.`);
  }
  return value.map(item => item.trim()).filter(Boolean);
}
