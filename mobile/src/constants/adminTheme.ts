// ===============================================================
// Admin UI Design Tokens
// Defines color palettes, border radii, and layout spacing for Admin screens
// ===============================================================

// Color palette constants for Admin dashboard and modules
export const AC = {
  // Screen and card backgrounds
  bgApp: '#F6F8FB',
  bgCard: '#FFFFFF',
  bgCardWarning: '#FFFBEB',

  // Typography text colors
  textPrimary: '#172033',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Brand / Primary action colors (Indigo palette)
  primary: '#4F46E5',
  primaryLight: '#EEF0FF',
  primaryMid: '#6366F1',

  // Success / Online operational status (Emerald green)
  success: '#10B981',
  successLight: '#ECFDF5',
  successText: '#065F46',

  // Warning / Degraded operational status (Amber)
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningText: '#92400E',

  // Danger / High severity incidents (Rose red)
  danger: '#EF4444',
  dangerLight: '#FFF1F2',
  dangerText: '#9F1239',

  // Dividers and border outlines
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Bottom navigation tab bar styling
  tabBg: '#FFFFFF',
  tabActive: '#4F46E5',
  tabInactive: '#94A3B8',
  tabActiveBg: '#EEF0FF',
} as const;

// Border radius presets for Admin UI elements
export const AR = {
  card: 12,     // Standard card container radius
  chip: 6,      // Small tag or chip radius
  button: 10,   // Action button radius
  pill: 20,     // Rounded status pill radius
} as const;

// Spacing scale for Admin layouts
export const AS = {
  screenH: 16,  // Horizontal padding for screens
  screenV: 12,  // Vertical margin between sections
  cardH: 14,    // Inner card horizontal padding
  cardV: 12,    // Inner card vertical padding
  gap: 8,       // Standard gap between inline items
} as const;

