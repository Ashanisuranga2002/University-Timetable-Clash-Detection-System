// Admin UI Design Tokens
// Matches the Hi-Fi light enterprise dashboard screenshots

export const AC = {
  // Backgrounds
  bgApp: '#F6F8FB',
  bgCard: '#FFFFFF',
  bgCardWarning: '#FFFBEB',

  // Text
  textPrimary: '#172033',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Brand / Primary
  primary: '#4F46E5',
  primaryLight: '#EEF0FF',
  primaryMid: '#6366F1',

  // Success / Online
  success: '#10B981',
  successLight: '#ECFDF5',
  successText: '#065F46',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningText: '#92400E',

  // Danger / High
  danger: '#EF4444',
  dangerLight: '#FFF1F2',
  dangerText: '#9F1239',

  // Border
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Tab bar
  tabBg: '#FFFFFF',
  tabActive: '#4F46E5',
  tabInactive: '#94A3B8',
  tabActiveBg: '#EEF0FF',
} as const;

export const AR = {
  card: 12,
  chip: 6,
  button: 10,
  pill: 20,
} as const;

export const AS = {
  screenH: 16,  // horizontal padding
  screenV: 12,  // vertical between sections
  cardH: 14,
  cardV: 12,
  gap: 8,
} as const;
