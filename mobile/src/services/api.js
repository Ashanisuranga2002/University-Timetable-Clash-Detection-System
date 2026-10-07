/** Configurable client for the Coordinator API. Set EXPO_PUBLIC_API_URL at build time. */
import { clearSession, readSession, storeSession } from './sessionStorage';
import { File as ExpoFile, UploadType } from 'expo-file-system';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
let accessToken;
let unauthorizedHandler;
export const setAccessToken = token => {
  accessToken = token;
};
export const setUnauthorizedHandler = handler => {
  unauthorizedHandler = handler;
};
async function request(path, init = {}) {
  if (!API_BASE_URL) throw new Error('Set EXPO_PUBLIC_API_URL to the Mac backend URL before starting Expo.');
  if (!accessToken) accessToken = (await readSession())?.token;
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal
    });
  } catch (cause) {
    const message = controller.signal.aborted ? 'The request timed out. Check your connection and try again.' : 'Could not connect. Check your connection and try again.';
    const error = new Error(message);
    error.details = cause;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const responseText = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(responseText);
  } catch {
    if (responseText) payload = {
      message: responseText
    };
  }
  if (!response.ok) {
    await handleUnauthorized(response.status);
    throw createResponseError(response.status, payload);
  }
  return payload;
}
const json = (method, data) => ({
  method,
  ...(data === undefined ? {} : {
    body: JSON.stringify(data)
  })
});
export const api = {
  health: () => request('/health'),
  login: async (studentId, password, persist = true) => {
    const result = await request('/auth/login', json('POST', {
      studentId,
      password
    }));
    setAccessToken(result.token);
    if (persist) await storeSession(result.token, result.user);else await clearSession();
    return result;
  },
  logout: async () => {
    setAccessToken(undefined);
    await clearSession();
  },
  dashboard: () => request('/dashboard/stats'),
  recentUploads: () => request('/dashboard/recent-uploads'),
  timetables: (query = '') => request(`/timetables${query ? `?${query.replace(/^\?/, '')}` : ''}`),
  timetable: id => request(`/timetables/${encodeURIComponent(id)}`),
  timetableSessions: id => request(`/timetables/${encodeURIComponent(id)}/sessions`),
  createTimetable: data => request('/timetables', json('POST', data)),
  uploadTimetableFile: (asset, data) => uploadFile('/timetables/upload', asset, data),
  updateTimetable: (id, data) => request(`/timetables/${encodeURIComponent(id)}`, json('PUT', data)),
  deleteTimetable: id => request(`/timetables/${encodeURIComponent(id)}`, json('DELETE')),
  subgroups: (query = '') => request(`/subgroups${query ? `?${query.replace(/^\?/, '')}` : ''}`),
  subgroup: id => request(`/subgroups/${encodeURIComponent(id)}`),
  createSubgroup: data => request('/subgroups', json('POST', data)),
  bulkCreateSubgroups: (records, sourceFileName, sourceFileSize) => request('/subgroups/bulk', json('POST', {
    records,
    sourceFileName,
    sourceFileSize
  })),
  uploadSubgroupFile: (asset, timetableId) => uploadFile('/subgroups/upload', asset, {
    timetableId
  }),
  updateSubgroup: (id, data) => request(`/subgroups/${encodeURIComponent(id)}`, json('PUT', data)),
  deleteSubgroup: id => request(`/subgroups/${encodeURIComponent(id)}`, json('DELETE')),
  runValidation: timetableId => request(`/validation/run/${encodeURIComponent(timetableId)}`, json('POST')),
  validationRuns: timetableId => request(`/validation/runs${timetableId ? `?timetableId=${encodeURIComponent(timetableId)}` : ''}`),
  errors: (query = '') => request(`/errors${query ? `?${query.replace(/^\?/, '')}` : ''}`),
  error: id => request(`/errors/${encodeURIComponent(id)}`),
  updateError: (id, data) => request(`/errors/${encodeURIComponent(id)}`, json('PUT', data)),
  deleteError: id => request(`/errors/${encodeURIComponent(id)}`, json('DELETE')),
  resolveError: (id, data) => request(`/errors/${encodeURIComponent(id)}/resolve`, json('PUT', data)),
  batchResolveErrors: (errorIds, data) => request('/errors/batch-resolve', json('PUT', {
    errorIds,
    ...data
  }))
};
async function uploadFile(path, asset, fields) {
  if (!API_BASE_URL) throw new Error('Set EXPO_PUBLIC_API_URL to the Mac backend URL before starting Expo.');
  if (!accessToken) accessToken = (await readSession())?.token;
  const extension = asset.name.split('.').pop()?.toLowerCase();
  const mimeType = asset.mimeType ?? (extension === 'csv' ? 'text/csv' : extension === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/octet-stream');
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    // Use Expo's native file upload task: it streams the picked URI and creates
    // the multipart boundary itself, without passing a URI object to fetch/FormData.
    const result = await new ExpoFile(asset.uri).upload(`${API_BASE_URL}${path}`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      headers,
      parameters: fields,
      sessionType: 'foreground',
      signal: controller.signal
    });
    const payload = parseResponseBody(result.body);
    if (result.status < 200 || result.status >= 300) {
      const errorPayload = payload;
      await handleUnauthorized(result.status);
      throw createResponseError(result.status, errorPayload);
    }
    return payload;
  } catch (cause) {
    if (cause instanceof Error && 'status' in cause) throw cause;
    const message = controller.signal.aborted ? 'The request timed out. Check your connection and try again.' : 'Could not connect. Check your connection and try again.';
    const error = new Error(message);
    error.details = cause;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
function parseResponseBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body ? {
      message: body
    } : {};
  }
}
async function handleUnauthorized(status) {
  if (status !== 401) return;
  accessToken = undefined;
  await clearSession();
  unauthorizedHandler?.();
}
function createResponseError(status, payload) {
  const responseMessage = payload.message ?? payload.error;
  const statusMessage = {
    400: responseMessage ?? 'The uploaded file or its details are invalid.',
    401: 'Session expired. Please sign in again.',
    403: 'You do not have permission to upload this timetable.',
    404: 'This record is no longer available. Refresh and try again.',
    413: 'The uploaded file exceeds the 20 MB limit.',
    500: 'Could not save your changes. Please try again.'
  };
  const error = new Error(statusMessage[status] ?? responseMessage ?? `Request failed (${status}).`);
  error.status = status;
  error.details = payload.details;
  return error;
}

// Descriptive aliases keep screen integrations readable.
export const login = api.login;
export const getDashboardStats = api.dashboard;
export const getRecentUploads = api.recentUploads;
export const getTimetables = api.timetables;
export const getTimetable = api.timetable;
export const createTimetable = api.createTimetable;
export const updateTimetable = api.updateTimetable;
export const deleteTimetable = api.deleteTimetable;
export const getSubgroups = api.subgroups;
export const getSubgroup = api.subgroup;
export const createSubgroup = api.createSubgroup;
export const updateSubgroup = api.updateSubgroup;
export const deleteSubgroup = api.deleteSubgroup;
export const runValidation = api.runValidation;
export const getValidationRuns = api.validationRuns;
export const getValidationErrors = api.errors;
export const getValidationError = api.error;
export const resolveValidationError = api.resolveError;
export const batchResolveErrors = api.batchResolveErrors;
