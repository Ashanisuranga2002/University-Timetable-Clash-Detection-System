// ===============================================================
// Admin Status Badge Component
// Compact status pill with color-coded dot indicator for operational states
// ===============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AC, AR } from '@/constants/adminTheme';
import { ServiceStatus, AlertSeverity, AlertState } from '@/constants/adminMonitoringData';

// Allowed variant keys for badges
type BadgeVariant =
  | ServiceStatus
  | AlertSeverity
  | AlertState
  | 'live'
  | 'failing'
  | 'live-tail'
  | 'uptime'
  | 'elevated'
  | 'auto-healed';

// Props for StatusBadge
interface StatusBadgeProps {
  variant: BadgeVariant;   // Status style variant key
  label?: string;          // Optional custom label text (defaults to uppercase variant)
  size?: 'sm' | 'md';      // Badge size option ('sm' or 'md')
}

// Maps a variant key to matching background, text, and dot indicator colors
function getColors(variant: BadgeVariant) {
  switch (variant) {
    case 'online':
    case 'resolved':
    case 'live':
      return { bg: AC.successLight, text: AC.success, dot: AC.success };
    case 'warning':
    case 'monitoring':
    case 'elevated':
      return { bg: AC.warningLight, text: AC.warning, dot: AC.warning };
    case 'offline':
    case 'high':
    case 'active':
    case 'failing':
      return { bg: AC.dangerLight, text: AC.danger, dot: AC.danger };
    case 'medium':
      return { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C' };
    case 'low':
      return { bg: AC.successLight, text: AC.success, dot: AC.success };
    case 'live-tail':
      return { bg: AC.primaryLight, text: AC.primary, dot: AC.primary };
    case 'uptime':
    case 'auto-healed':
      return { bg: AC.successLight, text: AC.success, dot: null as null };
    default:
      return { bg: AC.borderLight, text: AC.textSecondary, dot: null as null };
  }
}

export function StatusBadge({ variant, label, size = 'md' }: StatusBadgeProps) {
  const { bg, text, dot } = getColors(variant);
  // Default to formatted uppercase variant if no custom label provided
  const displayLabel = label ?? variant.toUpperCase().replace(/-/g, ' ');
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.sm]}>
      {/* Optional leading circular indicator dot */}
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Text style={[styles.label, { color: text }, isSmall && styles.smText]}>
        {displayLabel}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AR.chip,
    gap: 4,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  smText: { fontSize: 10 },
});
