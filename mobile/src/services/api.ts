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
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-role': 'Administrator',
      'x-user-role': 'Administrator',
      ...(options?.headers || {}),
    },
  };

  // Try primary detected endpoint first
  try {
    const res = await fetchWithTimeout(`${activeBaseUrl}${path}`, mergedOptions, 3000);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      return data;
    }
    if (data && data.message) {
      throw new Error(data.message);
    }
    if (res.status >= 400 && res.status < 500) {
      throw new Error(`Request failed with status ${res.status}`);
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('fetch') && !err.message.includes('abort') && !err.message.includes('Network request failed')) {
      throw err;
    }
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
      const res = await fetchWithTimeout(`${baseUrl}${path}`, mergedOptions, 2000);
      const data = await res.json().catch(() => null);
      if (res.ok) {
        activeBaseUrl = baseUrl; // Remember working endpoint for instant subsequent loads
        return data;
      }
      if (data && data.message) {
        throw new Error(data.message);
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch') && !err.message.includes('abort') && !err.message.includes('Network request failed')) {
        throw err;
      }
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

// ─── Admin User Management APIs ────────────────────────────────────────────────

export interface AdminUser {
  _id?: string;
  userId: string;
  name: string;
  email: string;
  role: 'Student' | 'Academic Advisor' | 'Monitor' | 'Coordinator' | 'Administrator';
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt?: string;
  updatedAt?: string;
}

export function fetchUsersApi(params?: { search?: string; role?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.role && params.role !== 'All') query.append('role', params.role);
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/admin/users${qStr}`);
}

export function fetchUserByIdApi(id: string) {
  return apiFetch(`/admin/users/${id}`);
}

export function createUserApi(userData: Partial<AdminUser>) {
  return apiFetch('/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
}

export function updateUserApi(id: string, userData: Partial<AdminUser>) {
  return apiFetch(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
}

export function deleteUserApi(id: string, deactivateOnly = false) {
  const q = deactivateOnly ? '?deactivateOnly=true' : '';
  return apiFetch(`/admin/users/${id}${q}`, {
    method: 'DELETE',
  });
}

// ─── Admin Monitor Management APIs ─────────────────────────────────────────────

export interface AdminMonitor {
  _id?: string;
  monitorId: string;
  serviceName: string;
  serviceType: 'Service' | 'Database' | 'Gateway' | 'Queue' | 'Engine' | 'Worker';
  description?: string;
  endpoint?: string;
  interval: string;
  status: 'online' | 'warning' | 'offline';
  healthStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  enabled: boolean;
  responseTime?: string;
  lastChecked?: string;
  createdAt?: string;
}

export function fetchMonitorsApi() {
  return apiFetch('/admin/monitors');
}

export function fetchMonitorByIdApi(id: string) {
  return apiFetch(`/admin/monitors/${id}`);
}

export function createMonitorApi(monitorData: Partial<AdminMonitor>) {
  return apiFetch('/admin/monitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(monitorData),
  });
}

export function updateMonitorApi(id: string, monitorData: Partial<AdminMonitor>) {
  return apiFetch(`/admin/monitors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(monitorData),
  });
}

export function deleteMonitorApi(id: string) {
  return apiFetch(`/admin/monitors/${id}`, {
    method: 'DELETE',
  });
}

// ─── Admin Alert Management APIs ───────────────────────────────────────────────

export interface AdminAlertItem {
  _id?: string;
  alertId: string;
  title: string;
  service: string;
  worker?: string;
  time?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  state: 'new' | 'active' | 'acknowledged' | 'monitoring' | 'resolved';
  metricLabel1?: string;
  metricValue1?: string;
  metricLabel2?: string;
  metricValue2?: string;
  impactNote?: string;
  resolvedNote?: string;
  ttr?: string;
  createdAt?: string;
}

export function fetchAlertsApi(filter?: { status?: string; severity?: string }) {
  const query = new URLSearchParams();
  if (filter?.status && filter.status !== 'all') query.append('status', filter.status);
  if (filter?.severity && filter.severity !== 'all') query.append('severity', filter.severity);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/admin/alerts${qStr}`);
}

export function fetchAlertByIdApi(id: string) {
  return apiFetch(`/admin/alerts/${id}`);
}

export function updateAlertStatusApi(id: string, state: string, note?: string) {
  return apiFetch(`/admin/alerts/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, note }),
  });
}

export function deleteAlertApi(id: string) {
  return apiFetch(`/admin/alerts/${id}`, {
    method: 'DELETE',
  });
}

export function acknowledgeAlertApi(id: string) {
  return apiFetch(`/admin/alerts/${id}/acknowledge`, {
    method: 'PATCH',
  });
}

export function resolveAlertApi(id: string, note?: string) {
  return apiFetch(`/admin/alerts/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
}

export function reopenAlertApi(id: string) {
  return apiFetch(`/admin/alerts/${id}/reopen`, {
    method: 'PATCH',
  });
}

export function patchUserStatusApi(id: string, status: string) {
  return apiFetch(`/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function patchMonitorStatusApi(id: string, updates: { status?: string; healthStatus?: string; enabled?: boolean }) {
  return apiFetch(`/admin/monitors/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

// ─── Admin System Health API ───────────────────────────────────────────────────

export interface SystemHealthData {
  overallStatus: 'Healthy' | 'Warning' | 'Critical';
  server: string;
  campus: string;
  uptime: number;
  nodesSync: number;
  latencyMs: number;
  averageResponseTime: string;
  totalUsers: number;
  activeUsers: number;
  totalMonitors: number;
  onlineMonitors: number;
  warningMonitors: number;
  criticalMonitors: number;
  activeAlerts: number;
  memoryPercent?: number;
  heapUsedMB?: number;
  services: Array<{
    id: string;
    name: string;
    subtitle: string;
    latency: string;
    availability: string;
    status: 'online' | 'warning' | 'offline';
    healthStatus?: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
    enabled?: boolean;
    note?: string;
    pod?: string;
    lastChecked?: string;
  }>;
  lastUpdated: string;
}

export function fetchSystemHealthApi(): Promise<{ success: boolean; data: SystemHealthData }> {
  return apiFetch('/admin/system-health');
}

// ─── Admin Dashboard Stats API ─────────────────────────────────────────────────

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  monitors: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
  };
  alerts: {
    total: number;
    active: number;
    critical: number;
    acknowledged: number;
    resolved: number;
  };
  systemHealth: {
    status: 'Healthy' | 'Warning' | 'Critical' | 'No Data';
    percentage: number | null;
    averageResponseTime: string | null;
    server: string;
    uptimePercentage: number | null;
    lastUpdated: string;
  };
  systemLoad?: {
    memoryUsagePercentage: number;
    loadAverage: number;
    uptimeSeconds: number;
    processMemoryMB: number;
  };
  recentMonitors?: Array<{
    id: string;
    name: string;
    pod: string;
    latency: string;
    status: 'online' | 'warning' | 'offline';
    healthStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
    enabled: boolean;
  }>;
  recentAlerts?: Array<{
    id: string;
    title: string;
    service: string;
    time: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    state: 'new' | 'active' | 'acknowledged' | 'monitoring' | 'resolved';
    createdAt?: string;
  }>;
}

export function fetchAdminDashboardStatsApi(): Promise<{ success: boolean; data: AdminDashboardStats }> {
  return apiFetch('/admin/dashboard/stats');
}

// ─── Monitor Health Probe Checks ───────────────────────────────────────────────

export function checkMonitorApi(id: string) {
  return apiFetch(`/admin/monitors/${id}/check`, {
    method: 'POST',
  });
}

export function checkAllMonitorsApi() {
  return apiFetch('/admin/monitors/check-all', {
    method: 'POST',
  });
}

// ─── Admin Profile APIs ────────────────────────────────────────────────────────

export interface AdminProfileData {
  id: string;
  adminId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  createdAt?: string;
  lastLogin?: string;
}

export function fetchAdminProfileApi(adminId?: string): Promise<{ success: boolean; admin: AdminProfileData; data: AdminProfileData }> {
  const path = adminId ? `/admin/auth/profile/${adminId}` : '/admin/auth/profile';
  return apiFetch(path);
}

export function updateAdminProfileApi(
  adminId: string,
  updates: { name?: string; department?: string }
): Promise<{ success: boolean; admin: AdminProfileData; data: AdminProfileData }> {
  return apiFetch(`/admin/auth/profile/${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}


