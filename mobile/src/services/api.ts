import { Platform } from 'react-native';

// Use your machine IP for physical devices & Expo Go; localhost for web / iOS simulator
const LOCAL_IP = '10.243.34.145';
const PORT = '5001';

export const API_BASE_URL =
  Platform.OS === 'web'
    ? `http://localhost:${PORT}/api`
    : `http://${LOCAL_IP}:${PORT}/api`;

const fallback = (path: string) =>
  Platform.OS === 'web' ? null : `http://localhost:${PORT}/api${path}`;

async function apiFetch(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, options);
    return await res.json();
  } catch (e: any) {
    const fb = fallback(path);
    if (!fb) throw e;
    try {
      const res = await fetch(fb, options);
      return await res.json();
    } catch {
      throw new Error(e?.message || 'Network error');
    }
  }
}

export function loginStudentApi(studentId: string, password: string) {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password }),
  });
}

export function fetchDashboardApi(studentId: string) {
  return apiFetch(`/dashboard/${studentId}`);
}

export function fetchCoursesApi(semester?: number) {
  const q = semester ? `?semester=${semester}` : '';
  return apiFetch(`/courses${q}`);
}

export function submitRegistrationApi(
  studentId: string,
  courseIds: string[],
  selectedSlots?: Record<string, string>
) {
  return apiFetch('/registration/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, courseIds, selectedSlots: selectedSlots || {} }),
  });
}

// ─── Admin APIs ────────────────────────────────────────────────────────────────

export function loginAdminApi(adminId: string, password: string) {
  return apiFetch('/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId, password }),
  });
}

export function fetchAdminDashboardApi() {
  return apiFetch('/admin/dashboard');
}

export function fetchAdminCoursesApi() {
  return apiFetch('/admin/courses');
}

export function createCourseApi(course: {
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  type: string;
  lecturer?: string;
  description?: string;
  schedule?: Array<{ day: string; startTime: string; endTime: string; room: string; type: string }>;
}) {
  return apiFetch('/admin/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  });
}

export function deleteCourseApi(id: string) {
  return apiFetch(`/admin/courses/${id}`, { method: 'DELETE' });
}

export function updateCourseApi(
  id: string,
  updates: {
    courseCode?: string;
    courseName?: string;
    credits?: number;
    semester?: number;
    type?: string;
    lecturer?: string;
    description?: string;
  }
) {
  return apiFetch(`/admin/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}
