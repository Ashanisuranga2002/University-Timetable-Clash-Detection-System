import { Platform } from 'react-native';

// Use your machine IP for physical devices & Expo Go; localhost for web / iOS simulator
const LOCAL_IP = '10.243.34.145';
const PORT = '5001';

export const API_BASE_URL =
  Platform.OS === 'web'
    ? `http://localhost:${PORT}/api`
    : `http://${LOCAL_IP}:${PORT}/api`;

export async function loginStudentApi(studentId: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password }),
    });
    return await res.json();
  } catch (error: any) {
    // Fallback attempt to localhost if network IP fails
    try {
      const fallbackRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      });
      return await fallbackRes.json();
    } catch {
      throw new Error(error?.message || 'Unable to connect to server');
    }
  }
}

export async function fetchDashboardApi(studentId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/${studentId}`);
    return await res.json();
  } catch (error: any) {
    try {
      const fallbackRes = await fetch(`http://localhost:${PORT}/api/dashboard/${studentId}`);
      return await fallbackRes.json();
    } catch {
      throw new Error(error?.message || 'Unable to load dashboard');
    }
  }
}

export async function fetchCoursesApi(semester?: number) {
  try {
    const url = semester
      ? `${API_BASE_URL}/courses?semester=${semester}`
      : `${API_BASE_URL}/courses`;
    const res = await fetch(url);
    return await res.json();
  } catch (error: any) {
    try {
      const fallbackRes = await fetch(`http://localhost:${PORT}/api/courses`);
      return await fallbackRes.json();
    } catch {
      throw new Error(error?.message || 'Unable to load courses');
    }
  }
}

export async function submitRegistrationApi(
  studentId: string,
  courseIds: string[],
  selectedSlots?: Record<string, string>
) {
  try {
    const res = await fetch(`${API_BASE_URL}/registration/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        courseIds,
        selectedSlots: selectedSlots || {},
      }),
    });
    return await res.json();
  } catch (error: any) {
    try {
      const fallbackRes = await fetch(`http://localhost:${PORT}/api/registration/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseIds,
          selectedSlots: selectedSlots || {},
        }),
      });
      return await fallbackRes.json();
    } catch {
      throw new Error(error?.message || 'Unable to submit registration');
    }
  }
}
