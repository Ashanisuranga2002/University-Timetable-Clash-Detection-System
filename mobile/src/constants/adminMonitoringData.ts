// ============================================================
// Admin Monitoring — Centralized Mock Data
// University Timetable Clash Detection System
// ============================================================

export type ServiceStatus = 'online' | 'warning' | 'offline';
export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertState = 'active' | 'monitoring' | 'resolved';
export type NodeState = 'healthy' | 'warning' | 'critical';

export interface InfrastructureService {
  id: string;
  name: string;
  subtitle: string;
  latency: string;
  availability: string;
  status: ServiceStatus;
  note?: string;
  pod?: string;
}

export interface MonitoringAlert {
  id: string;
  title: string;
  service: string;
  worker: string;
  time: string;
  severity: AlertSeverity;
  state: AlertState;
  metricLabel1?: string;
  metricValue1?: string;
  metricLabel2?: string;
  metricValue2?: string;
  impactNote?: string;
  resolvedNote?: string;
  ttr?: string;
}

export interface RegionalNode {
  id: string;
  label: string;
  state: NodeState;
}

export interface TelemetryPoint {
  label: string;
  load: number;
  latency: number;
}

export const systemHealth = {
  status: 'Healthy' as const,
  server: 'AU-CAMPUS-CORE-01',
  uptime: 99.98,
  campus: 'CAMPUS US-EAST',
  nodesSync: 32,
  latencyMs: 8,
};

export const topMetrics = {
  latency: { value: '1.2s', label: 'Optimal', progress: 0.4 },
  sysLoad: { value: '65%', label: 'Peak 71%', progress: 0.65 },
  sessions: { value: '1,240', label: 'Enrollment', progress: 0.62 },
};

export const coreServices: InfrastructureService[] = [
  {
    id: 'clash-detection',
    name: 'Clash Detection Service',
    subtitle: 'Timetable Conflict Engine',
    pod: 'Microservice \u2022 Pod AU-CL',
    latency: '1.2s',
    availability: '99.98%',
    status: 'online',
  },
  {
    id: 'registration',
    name: 'Registration Service',
    subtitle: 'Enrollment Gateway',
    pod: 'Gateway \u2022 Edge Proxy 04',
    latency: '1.5s',
    availability: '99.91%',
    status: 'online',
  },
  {
    id: 'database',
    name: 'Database Primary Cluster',
    subtitle: 'Primary Aurora Cluster',
    pod: 'PostgreSQL Multi-AZ \u2022 Re0',
    latency: '0.8s',
    availability: '100%',
    status: 'online',
  },
  {
    id: 'notification',
    name: 'Notification Service',
    subtitle: 'Event Dispatch SQS',
    pod: 'SQS Worker',
    latency: '2.4s',
    availability: '98.40%',
    status: 'warning',
    note: 'Elevated queue latency',
  },
];

export const telemetryData6h: TelemetryPoint[] = [
  { label: '12:00 PM', load: 28, latency: 15 },
  { label: '01:30 PM', load: 42, latency: 22 },
  { label: '03:00 PM', load: 58, latency: 35 },
  { label: '04:30 PM', load: 65, latency: 40 },
  { label: 'NOW', load: 63, latency: 38 },
];

export const telemetryData4h: TelemetryPoint[] = [
  { label: '10:00 AM', load: 18, latency: 10 },
  { label: '12:00 PM', load: 40, latency: 28 },
  { label: '02:00 PM', load: 65, latency: 42 },
];

export const systemAlerts: MonitoringAlert[] = [
  {
    id: 'alert-9042',
    title: 'High Traffic Detected',
    service: 'Clash Detection Service',
    worker: 'Worker Node 04',
    time: '10:32 AM',
    severity: 'high',
    state: 'active',
    metricLabel1: 'THROUGHPUT SPILL',
    metricValue1: '4,820 req/s (+240%)',
    impactNote: 'Impacts 4,200 active timetable queries',
  },
  {
    id: 'alert-9041',
    title: 'Response Time Increased',
    service: 'Notification Service',
    worker: 'Worker B',
    time: '10:10 AM',
    severity: 'medium',
    state: 'monitoring',
    metricLabel1: 'P99 LATENCY',
    metricValue1: '840ms',
    metricLabel2: 'QUEUE DEPTH',
    metricValue2: '312 msgs',
  },
  {
    id: 'alert-9040',
    title: 'Database Load Normalized',
    service: 'Database Service',
    worker: 'Read Replica 02',
    time: '09:45 AM',
    severity: 'low',
    state: 'resolved',
    resolvedNote: 'CPU dropped from 94% to 18% following connection reset',
    ttr: '14m',
  },
];

export const regionalNodes: RegionalNode[] = [
  { id: 'n01', label: 'N01', state: 'healthy' },
  { id: 'n02', label: 'N02', state: 'healthy' },
  { id: 'n03', label: 'N03', state: 'healthy' },
  { id: 'n04', label: 'N04', state: 'critical' },
  { id: 'n05', label: 'N05', state: 'warning' },
  { id: 'n06', label: 'N06', state: 'healthy' },
];

export const incidentDetail = {
  id: '#ALERT-9042',
  title: 'High Traffic Detected',
  detectedAt: 'Detected Today, 10:32 AM',
  ago: '24m ago',
  severity: 'HIGH SEVERITY' as const,
  state: 'Active \u2022 Triaging',
  affectedCluster: 'Clash Detection Service',
  clusterSub: 'Core Engine v2.4 / Worker Pool 04',
  clusterStatus: 'FAILING' as const,
  respTime: { value: '2.8s', sub: 'Base \u2264 1.5s', progress: 0.85 },
  sysLoad: { value: '88%', sub: 'Norm <75%', progress: 0.88 },
  activeUsers: { value: '2.35k', sub: 'Peak Surge', progress: 0.78 },
  summary:
    'A high number of users are accessing the registration system, causing increased response time.',
  automatedAction: 'Automated cluster scaling initiated 12 minutes ago.',
  impacts: [
    {
      id: 'impact-1',
      title: 'Algorithmic Latency',
      desc: 'Slow clash detection algorithm processing across active student timetable queries',
      color: '#EF4444',
      bgColor: '#FFF1F2',
    },
    {
      id: 'impact-2',
      title: 'Registration Gate Throttle',
      desc: 'Increased response time for registration requests (>2.5s threshold)',
      color: '#F43F5E',
      bgColor: '#FFF1F2',
    },
    {
      id: 'impact-3',
      title: 'Capacity Exhaustion',
      desc: 'High server load on main application worker pool',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
  ],
};
