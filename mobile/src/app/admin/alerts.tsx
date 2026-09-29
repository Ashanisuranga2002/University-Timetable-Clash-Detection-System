import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BottomAdminTabs } from '@/components/admin/BottomAdminTabs';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  systemAlerts,
  MonitoringAlert,
  AlertSeverity,
  regionalNodes,
  RegionalNode,
} from '@/constants/adminMonitoringData';

type FilterKey = 'all' | AlertSeverity;

function MiniSparkline({ color }: { color: string }) {
  const points = [30, 45, 35, 55, 48, 70, 65];
  return (
    <View style={sparkStyles.container}>
      {points.map((h, i) => (
        <View key={i} style={[sparkStyles.bar, { height: h * 0.5, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 35 },
  bar: { width: 4, borderRadius: 2 },
});

function NodePill({ node }: { node: RegionalNode }) {
  const bg =
    node.state === 'healthy'
      ? AC.successLight
      : node.state === 'critical'
      ? AC.dangerLight
      : AC.warningLight;
  const color =
    node.state === 'healthy'
      ? AC.success
      : node.state === 'critical'
      ? AC.danger
      : AC.warning;
  const borderColor =
    node.state === 'healthy'
      ? '#A7F3D0'
      : node.state === 'critical'
      ? '#FCA5A5'
      : '#FCD34D';
  return (
    <View style={[nodeStyles.pill, { backgroundColor: bg, borderColor }]}>
      <Text style={[nodeStyles.label, { color }]}>{node.label}</Text>
    </View>
  );
}

const nodeStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: { fontSize: 11, fontWeight: '700' },
});

function AlertCard({
  alert,
  onViewDetails,
  onMute,
  muted,
}: {
  alert: MonitoringAlert;
  onViewDetails?: () => void;
  onMute?: () => void;
  muted?: boolean;
}) {
  const isHigh = alert.severity === 'high';
  const isMed = alert.severity === 'medium';
  const isResolved = alert.state === 'resolved';
  const borderColor = isHigh ? AC.danger : isMed ? AC.warning : AC.success;

  return (
    <View
      style={[
        aStyles.card,
        { borderLeftColor: borderColor },
        isResolved ? aStyles.resolvedCard : null,
      ]}
    >
      <View style={aStyles.headerRow}>
        <View style={aStyles.badges}>
          <StatusBadge variant={alert.severity} label={alert.severity.toUpperCase()} size="sm" />
          <StatusBadge
            variant={
              isResolved ? 'resolved' : alert.state === 'active' ? 'active' : 'monitoring'
            }
            label={isResolved ? 'RESOLVED' : alert.state === 'active' ? 'ACTIVE' : 'MONITORING'}
            size="sm"
          />
        </View>
        <Text style={aStyles.time}>{alert.time}</Text>
      </View>

      <Text style={aStyles.title}>{alert.title}</Text>
      <View style={aStyles.serviceRow}>
        <Text style={aStyles.serviceText}>
          {alert.service} - {alert.worker}
        </Text>
      </View>

      {!isResolved && alert.metricLabel1 ? (
        <View style={aStyles.metricsRow}>
          <View style={aStyles.metricBox}>
            <Text style={aStyles.metricLabel}>{alert.metricLabel1}</Text>
            <Text style={[aStyles.metricVal, { color: isHigh ? AC.danger : AC.warning }]}>
              {alert.metricValue1}
            </Text>
          </View>
          {isHigh ? <MiniSparkline color={AC.danger} /> : null}
          {alert.metricLabel2 ? (
            <View style={aStyles.metricBox}>
              <Text style={aStyles.metricLabel}>{alert.metricLabel2}</Text>
              <Text style={[aStyles.metricVal, { color: AC.warning }]}>{alert.metricValue2}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {alert.impactNote ? (
        <View style={aStyles.impactRow}>
          <View style={aStyles.impactDot} />
          <Text style={aStyles.impactText}>{alert.impactNote}</Text>
        </View>
      ) : null}

      {isResolved && alert.resolvedNote ? (
        <View style={aStyles.resolvedInfo}>
          <Text style={aStyles.resolvedNote}>Resolved: {alert.resolvedNote}</Text>
          {alert.ttr ? <Text style={aStyles.ttr}>TTR: {alert.ttr}</Text> : null}
        </View>
      ) : null}

      {!isResolved ? (
        <View style={aStyles.actions}>
          {isHigh ? (
            <Pressable
              style={aStyles.viewDetailsBtn}
              onPress={onViewDetails}
              accessibilityRole="button"
              accessibilityLabel="View Details"
            >
              <Text style={aStyles.viewDetailsText}>View Details</Text>
            </Pressable>
          ) : null}
          {isMed ? (
            <Pressable
              style={[aStyles.muteBtn, muted ? aStyles.mutedBtn : null]}
              onPress={onMute}
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            >
              <Text style={aStyles.muteText}>{muted ? 'Muted' : 'Mute'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const aStyles = StyleSheet.create({
  card: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    borderLeftWidth: 3,
    padding: 12,
    gap: 6,
  },
  resolvedCard: { backgroundColor: AC.successLight },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badges: { flexDirection: 'row', gap: 6 },
  time: { fontSize: 11, color: AC.textSecondary, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '800', color: AC.textPrimary, marginTop: 2 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceText: { fontSize: 11, color: AC.textSecondary },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricBox: { gap: 2 },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: AC.textSecondary,
    letterSpacing: 0.5,
  },
  metricVal: { fontSize: 18, fontWeight: '800' },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  impactDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.danger },
  impactText: { fontSize: 11, color: AC.textSecondary },
  resolvedInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resolvedNote: { fontSize: 11, color: AC.success, flex: 1 },
  ttr: { fontSize: 12, fontWeight: '700', color: AC.textSecondary },
  actions: { marginTop: 4 },
  viewDetailsBtn: {
    backgroundColor: AC.danger,
    borderRadius: AR.button,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  viewDetailsText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  muteBtn: {
    borderWidth: 1,
    borderColor: AC.border,
    borderRadius: AR.button,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  mutedBtn: { backgroundColor: AC.borderLight },
  muteText: { fontSize: 12, fontWeight: '600', color: AC.textSecondary },
});

export default function AlertsScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [acknowledged, setAcknowledged] = useState(false);

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: systemAlerts.length },
    {
      key: 'high',
      label: 'High',
      count: systemAlerts.filter(a => a.severity === 'high').length,
    },
    {
      key: 'medium',
      label: 'Med',
      count: systemAlerts.filter(a => a.severity === 'medium').length,
    },
    { key: 'low', label: 'Low', count: systemAlerts.filter(a => a.severity === 'low').length },
  ];

  const filtered =
    filter === 'all' ? systemAlerts : systemAlerts.filter(a => a.severity === filter);

  function toggleMute(id: string) {
    setMutedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleAcknowledge() {
    Alert.alert('Acknowledge All Alerts?', 'This will mark all active alerts as acknowledged.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Acknowledge', onPress: () => setAcknowledged(true) },
    ]);
  }

  function handleExport() {
    Alert.alert('Export', 'Incident log prepared for export. (CSV)');
  }

  return (
    <View style={styles.screen}>
      <AdminHeader title="System Alerts" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Incident Monitor */}
        <View style={styles.section}>
          <View style={styles.monitorCard}>
            <View style={styles.monitorLeft}>
              <Text style={styles.monitorIcon}>INC</Text>
              <View>
                <Text style={styles.monitorTitle}>Incident Monitor</Text>
                <Text style={styles.monitorSub}>SLA Target: 99.98%</Text>
              </View>
            </View>
            <Pressable style={styles.liveTailBtn} accessibilityRole="button" accessibilityLabel="Live Tail">
              <View style={styles.liveDot} />
              <Text style={styles.liveTailText}>LIVE TAIL</Text>
            </Pressable>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {filters.map(f => (
                <Pressable
                  key={f.key}
                  style={[styles.filterTab, filter === f.key ? styles.filterTabActive : null]}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: filter === f.key }}
                >
                  {f.key !== 'all' ? (
                    <View
                      style={[
                        styles.filterDot,
                        {
                          backgroundColor:
                            f.key === 'high'
                              ? AC.danger
                              : f.key === 'medium'
                              ? AC.warning
                              : AC.success,
                        },
                      ]}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.filterText,
                      filter === f.key ? styles.filterTextActive : null,
                    ]}
                  >
                    {f.label} {f.count}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.showingText}>Showing {filtered.length} recorded incidents today</Text>
        </View>

        {/* Alert Cards */}
        <View style={[styles.section, styles.alertsGap]}>
          {filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              muted={mutedIds.has(alert.id)}
              onMute={() => toggleMute(alert.id)}
              onViewDetails={() => router.push('/admin/issue-details')}
            />
          ))}
        </View>

        {/* Regional Cascade Risk */}
        <View style={styles.section}>
          <View style={styles.cascadeCard}>
            <View style={styles.cascadeHeader}>
              <Text style={styles.cascadeTitle}>Regional Cascade Risk</Text>
              <View style={styles.elevatedBadge}>
                <Text style={styles.elevatedText}>ELEVATED</Text>
              </View>
            </View>
            <View style={styles.nodeRow}>
              {regionalNodes.map(node => (
                <NodePill key={node.id} node={node} />
              ))}
            </View>
            <View style={styles.cascadeFooter}>
              <View style={styles.autoFailRow}>
                <View style={styles.greenDot} />
                <Text style={styles.autoFailText}>Auto-failover enabled</Text>
              </View>
              <Text style={styles.heartbeatText}>Next heartbeat: 4s</Text>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.section, styles.btnSection]}>
          <Pressable
            style={[styles.primaryBtn, acknowledged ? styles.primaryBtnAck : null]}
            onPress={handleAcknowledge}
            accessibilityRole="button"
            accessibilityLabel="Acknowledge All Alerts"
          >
            <Text style={styles.primaryBtnText}>
              {acknowledged ? 'All Alerts Acknowledged' : 'Acknowledge All Alerts'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={handleExport}
            accessibilityRole="button"
            accessibilityLabel="Export Incident Log"
          >
            <Text style={styles.secondaryBtnText}>Export Incident Log (.csv)</Text>
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
  content: { paddingBottom: 8 },
  section: { paddingHorizontal: AS.screenH, marginTop: 12 },
  alertsGap: { gap: 10 },
  monitorCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monitorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monitorIcon: { fontSize: 10, color: AC.warning, fontWeight: '800' },
  monitorTitle: { fontSize: 14, fontWeight: '700', color: AC.textPrimary },
  monitorSub: { fontSize: 11, color: AC.textSecondary },
  liveTailBtn: {
    backgroundColor: AC.primaryLight,
    borderRadius: AR.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.primary },
  liveTailText: { fontSize: 11, fontWeight: '700', color: AC.primary, letterSpacing: 0.5 },
  filterRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AC.border,
    backgroundColor: AC.bgCard,
  },
  filterTabActive: { borderColor: AC.textPrimary },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 12, fontWeight: '600', color: AC.textSecondary },
  filterTextActive: { color: AC.textPrimary, fontWeight: '700' },
  showingText: { fontSize: 11, color: AC.textSecondary },
  cascadeCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 12,
    gap: 10,
  },
  cascadeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cascadeTitle: { fontSize: 14, fontWeight: '700', color: AC.textPrimary },
  elevatedBadge: {
    backgroundColor: AC.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AR.chip,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  elevatedText: { fontSize: 10, fontWeight: '700', color: AC.warning, letterSpacing: 0.5 },
  nodeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cascadeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoFailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: AC.success },
  autoFailText: { fontSize: 11, color: AC.textSecondary },
  heartbeatText: { fontSize: 11, color: AC.textSecondary, fontWeight: '600' },
  btnSection: { gap: 8, marginTop: 4 },
  primaryBtn: {
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnAck: { backgroundColor: AC.success },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AC.border,
  },
  secondaryBtnText: { color: AC.textPrimary, fontSize: 13, fontWeight: '600' },
});
