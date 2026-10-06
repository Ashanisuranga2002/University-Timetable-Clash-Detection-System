import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BottomAdminTabs } from '@/components/admin/BottomAdminTabs';
import { ProgressBar } from '@/components/admin/ProgressBar';
import { SectionHeader } from '@/components/admin/SectionHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TelemetryChart } from '@/components/admin/TelemetryChart';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  systemHealth,
  topMetrics,
  coreServices,
  telemetryData6h,
  systemAlerts,
} from '@/constants/adminMonitoringData';

function OverallHealthCard() {
  return (
    <View style={styles.healthCard}>
      <View style={styles.healthTop}>
        <View style={styles.healthLeft}>
          <Text style={styles.healthTitle}>
            {'Overall System Health: '}
            <Text style={styles.healthyText}>{systemHealth.status}</Text>
          </Text>
          <View style={styles.serverRow}>
            <Text style={styles.serverIcon}>{'🖥'}</Text>
            <Text style={styles.serverText}>{systemHealth.server}</Text>
          </View>
        </View>
        <View style={styles.uptimeBadge}>
          <Text style={styles.uptimeText}>{systemHealth.uptime}% UPTIME</Text>
        </View>
      </View>
      <Text style={styles.updatedText}>Updated just now</Text>
    </View>
  );
}

function MetricCard({
  label,
  icon,
  value,
  sub,
  progress,
  progressColor,
}: {
  label: string;
  icon: string;
  value: string;
  sub: string;
  progress: number;
  progressColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricIcon}>{icon}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
      <View style={styles.metricBar}>
        <ProgressBar progress={progress} color={progressColor} height={3} />
      </View>
    </View>
  );
}

function InfraCard({
  name,
  pod,
  latency,
  status,
}: {
  name: string;
  pod?: string;
  latency: string;
  status: 'online' | 'warning' | 'offline';
}) {
  return (
    <View style={styles.infraItem}>
      <View style={styles.infraLeft}>
        <Text style={styles.infraIcon}>{'🖥'}</Text>
        <View>
          <Text style={styles.infraName}>{name}</Text>
          <Text style={styles.infraPod}>{pod}</Text>
        </View>
      </View>
      <View style={styles.infraRight}>
        <Text style={styles.infraLatency}>{latency}</Text>
        <StatusBadge variant={status} size="sm" />
      </View>
    </View>
  );
}

function WarningCard({
  title,
  sub,
  severity,
}: {
  title: string;
  sub: string;
  severity: 'high' | 'medium' | 'low';
}) {
  const borderColor = severity === 'high' ? AC.danger : AC.warning;
  return (
    <View style={[styles.warnCard, { borderLeftColor: borderColor }]}>
      <View style={styles.warnHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.warnTitle}>{title}</Text>
          <Text style={styles.warnSub}>{sub}</Text>
        </View>
        <StatusBadge variant={severity} size="sm" />
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const activeAlerts = systemAlerts.filter(a => a.state !== 'resolved');

  return (
    <View style={styles.screen}>
      <AdminHeader title="Dashboard" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <OverallHealthCard />
        </View>

        {/* Management Module Shortcuts */}
        <View style={styles.section}>
          <SectionHeader title="Management" right="Core Modules" />
          <View style={styles.managementGrid}>
            <Pressable
              style={styles.mgmtCard}
              onPress={() => router.push('/admin/users' as any)}
              accessibilityRole="button"
              accessibilityLabel="User Management"
            >
              <View style={[styles.mgmtIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.mgmtIcon}>👥</Text>
              </View>
              <View style={styles.mgmtContent}>
                <Text style={styles.mgmtTitle}>User Management</Text>
                <Text style={styles.mgmtSub}>Manage system users and roles</Text>
              </View>
              <Text style={styles.mgmtArrow}>→</Text>
            </Pressable>

            <Pressable
              style={styles.mgmtCard}
              onPress={() => router.push('/admin/monitors' as any)}
              accessibilityRole="button"
              accessibilityLabel="Monitor Management"
            >
              <View style={[styles.mgmtIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.mgmtIcon}>🖥️</Text>
              </View>
              <View style={styles.mgmtContent}>
                <Text style={styles.mgmtTitle}>Monitor Management</Text>
                <Text style={styles.mgmtSub}>Configure monitored services</Text>
              </View>
              <Text style={styles.mgmtArrow}>→</Text>
            </Pressable>

            <Pressable
              style={styles.mgmtCard}
              onPress={() => router.push('/admin/alerts')}
              accessibilityRole="button"
              accessibilityLabel="Alert Monitor"
            >
              <View style={[styles.mgmtIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Text style={styles.mgmtIcon}>⚠️</Text>
              </View>
              <View style={styles.mgmtContent}>
                <Text style={styles.mgmtTitle}>Alert Monitor</Text>
                <Text style={styles.mgmtSub}>Review system alerts</Text>
              </View>
              <Text style={styles.mgmtArrow}>→</Text>
            </Pressable>

            <Pressable
              style={styles.mgmtCard}
              onPress={() => router.push('/admin/service-status')}
              accessibilityRole="button"
              accessibilityLabel="System Monitoring"
            >
              <View style={[styles.mgmtIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Text style={styles.mgmtIcon}>📊</Text>
              </View>
              <View style={styles.mgmtContent}>
                <Text style={styles.mgmtTitle}>System Monitoring</Text>
                <Text style={styles.mgmtSub}>View current system health</Text>
              </View>
              <Text style={styles.mgmtArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, styles.metricsRow]}>
          <MetricCard
            label="LATENCY"
            icon="⏱"
            value={topMetrics.latency.value}
            sub={topMetrics.latency.label}
            progress={topMetrics.latency.progress}
            progressColor={AC.success}
          />
          <MetricCard
            label="SYS LOAD"
            icon="😊"
            value={topMetrics.sysLoad.value}
            sub={topMetrics.sysLoad.label}
            progress={topMetrics.sysLoad.progress}
            progressColor={AC.warning}
          />
          <MetricCard
            label="SESSIONS"
            icon="👥"
            value={topMetrics.sessions.value}
            sub={topMetrics.sessions.label}
            progress={topMetrics.sessions.progress}
            progressColor={AC.primary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.telemetryHeader}>
              <View>
                <Text style={styles.cardTitle}>Telemetry Dynamics</Text>
                <Text style={styles.cardSub}>6-Hour Load Gradient & Latency Trajectory</Text>
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: AC.primary }]} />
                  <Text style={styles.legendText}>Load</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDash, { backgroundColor: AC.success }]} />
                  <Text style={styles.legendText}>Latency</Text>
                </View>
              </View>
            </View>
            <View style={styles.chartWrap}>
              <TelemetryChart data={telemetryData6h} height={120} showSurge />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Core Infrastructure"
            right="View Details →"
            onRightPress={() => router.push('/admin/service-status')}
          />
          <View style={styles.card}>
            {coreServices.slice(0, 3).map((svc, idx) => (
              <View key={svc.id}>
                <InfraCard
                  name={svc.name}
                  pod={svc.pod}
                  latency={svc.latency}
                  status={svc.status}
                />
                {idx < 2 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Active Telemetry Warnings"
            right={`${activeAlerts.length} Unresolved`}
          />
          <View style={styles.warningsWrap}>
            {systemAlerts
              .filter(a => a.state !== 'resolved')
              .map(alert => (
                <WarningCard
                  key={alert.id}
                  title={alert.title}
                  sub={`${alert.service} \u2022 ${alert.time}`}
                  severity={alert.severity}
                />
              ))}
          </View>
        </View>

        <View style={[styles.section, styles.btnSection]}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push('/admin/alerts')}
            accessibilityRole="button"
            accessibilityLabel="View All Alerts"
          >
            <Text style={styles.primaryBtnText}>
              {'\u26a0 View All Alerts ('}{activeAlerts.length}{') \u2192'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push('/admin/service-status')}
            accessibilityRole="button"
            accessibilityLabel="Detailed Service Status"
          >
            <Text style={styles.secondaryBtnText}>Detailed Service Status</Text>
          </Pressable>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
      <BottomAdminTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  section: { paddingHorizontal: AS.screenH, marginTop: 12 },
  card: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    overflow: 'hidden',
  },
  healthCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
  },
  healthTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  healthLeft: { flex: 1, marginRight: 8 },
  healthTitle: { fontSize: 15, fontWeight: '700', color: AC.textPrimary, lineHeight: 22 },
  healthyText: { color: AC.success },
  serverRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  serverIcon: { fontSize: 12 },
  serverText: { fontSize: 11, color: AC.textSecondary, fontWeight: '500' },
  uptimeBadge: {
    backgroundColor: AC.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AR.chip,
  },
  uptimeText: { fontSize: 11, fontWeight: '700', color: AC.success },
  updatedText: { fontSize: 11, color: AC.textTertiary, marginTop: 6 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 10,
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 9, fontWeight: '700', color: AC.textSecondary, letterSpacing: 0.5 },
  metricIcon: { fontSize: 14 },
  metricValue: { fontSize: 20, fontWeight: '800', color: AC.textPrimary, marginTop: 4 },
  metricSub: { fontSize: 10, color: AC.textSecondary, marginTop: 2 },
  metricBar: { marginTop: 6 },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: AS.cardH,
    paddingBottom: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: AC.textPrimary },
  cardSub: { fontSize: 10, color: AC.textSecondary, marginTop: 2 },
  legend: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 14, height: 2, borderRadius: 1 },
  legendText: { fontSize: 10, color: AC.textSecondary, fontWeight: '600' },
  chartWrap: { paddingHorizontal: 8, paddingBottom: 8 },
  infraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  infraLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  infraIcon: { fontSize: 18 },
  infraName: { fontSize: 13, fontWeight: '600', color: AC.textPrimary },
  infraPod: { fontSize: 10, color: AC.textSecondary, marginTop: 1 },
  infraRight: { alignItems: 'flex-end', gap: 4 },
  infraLatency: { fontSize: 12, fontWeight: '700', color: AC.textSecondary },
  divider: { height: 1, backgroundColor: AC.border, marginHorizontal: 12 },
  warningsWrap: { gap: 8 },
  warnCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    borderLeftWidth: 3,
    padding: 12,
  },
  warnHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  warnTitle: { fontSize: 13, fontWeight: '700', color: AC.textPrimary },
  warnSub: { fontSize: 11, color: AC.textSecondary, marginTop: 2 },
  btnSection: { gap: 8, marginTop: 16 },
  primaryBtn: {
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AC.border,
  },
  secondaryBtnText: { color: AC.textPrimary, fontSize: 14, fontWeight: '600' },
  managementGrid: {
    gap: 10,
  },
  mgmtCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  mgmtIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mgmtIcon: {
    fontSize: 20,
  },
  mgmtContent: {
    flex: 1,
    gap: 2,
  },
  mgmtTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  mgmtSub: {
    fontSize: 12,
    color: AC.textSecondary,
  },
  mgmtArrow: {
    fontSize: 16,
    color: AC.textTertiary,
    fontWeight: '700',
  },
});
