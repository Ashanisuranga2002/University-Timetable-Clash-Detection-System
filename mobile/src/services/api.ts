import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = '5001';

// Automatically detect host machine IP when running Expo Go or native
const getDetectedHost = (): string => {
  if (Platform.OS === 'web') return 'localhost';

  // Expo Go debugger host (e.g. "192.168.1.100:8081" -> "192.168.1.100")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip.length > 3) return ip;
  }

  // Fallbacks if debuggerHost is undefined
  return '192.168.1.100';
};

let activeBaseUrl =
  Platform.OS === 'web'
    ? `http://localhost:${PORT}/api`
    : `http://${getDetectedHost()}:${PORT}/api`;

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  // Try primary detected endpoint first
  try {
    const res = await fetchWithTimeout(`${activeBaseUrl}${path}`, options, 3000);
    if (res.ok || res.status < 500) {
      return await res.json();
    }
  } catch {
    // Continue to fast candidates
  }

  // Fast fallbacks if primary failed
  const candidates = [
    `http://192.168.1.100:${PORT}/api`,
    `http://192.168.8.199:${PORT}/api`,
    `http://localhost:${PORT}/api`,
    `http://10.0.2.2:${PORT}/api`,
  ].filter((url) => url !== activeBaseUrl);

  for (const baseUrl of candidates) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}${path}`, options, 2000);
      if (res.ok || res.status < 500) {
        activeBaseUrl = baseUrl; // Remember working endpoint for instant subsequent loads
        return await res.json();
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error('Could not connect to server. Ensure backend is running.');
}

export const API_BASE_URL = activeBaseUrl;

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
