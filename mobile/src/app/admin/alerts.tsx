import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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
import {
  deleteAlertApi,
  fetchAlertsApi,
  updateAlertStatusApi,
} from '@/services/api';

type FilterKey = 'all' | AlertSeverity;
type StateFilterKey = 'all' | 'active' | 'acknowledged' | 'resolved';

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
  onAcknowledge,
  onResolve,
  onReopen,
  onDismiss,
}: {
  alert: MonitoringAlert;
  onViewDetails?: () => void;
  onAcknowledge?: () => void;
  onResolve?: () => void;
  onReopen?: () => void;
  onDismiss?: () => void;
}) {
  const isHigh = alert.severity === 'high';
  const isMed = alert.severity === 'medium';
  const isResolved = alert.state === 'resolved';
  const isAck = alert.state === 'acknowledged';
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
              isResolved ? 'resolved' : isAck ? 'monitoring' : alert.state === 'active' ? 'active' : 'monitoring'
            }
            label={isResolved ? 'RESOLVED' : isAck ? 'ACKNOWLEDGED' : alert.state.toUpperCase()}
            size="sm"
          />
        </View>
        <Text style={aStyles.time}>{alert.time}</Text>
      </View>

      <Text style={aStyles.title}>{alert.title}</Text>
      <View style={aStyles.serviceRow}>
        <Text style={aStyles.serviceText}>
          {alert.service} • {alert.worker}
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

      {/* Admin Action Row */}
      <View style={aStyles.actions}>
        <Pressable
          style={aStyles.btnGhost}
          onPress={onViewDetails}
          accessibilityRole="button"
          accessibilityLabel="View Details"
        >
          <Text style={aStyles.btnGhostText}>Details</Text>
        </Pressable>

        {!isResolved && !isAck && (
          <Pressable
            style={aStyles.btnAck}
            onPress={onAcknowledge}
            accessibilityRole="button"
            accessibilityLabel="Acknowledge"
          >
            <Text style={aStyles.btnAckText}>Acknowledge</Text>
          </Pressable>
        )}

        {!isResolved ? (
          <Pressable
            style={aStyles.btnResolve}
            onPress={onResolve}
            accessibilityRole="button"
            accessibilityLabel="Resolve"
          >
            <Text style={aStyles.btnResolveText}>Resolve</Text>
          </Pressable>
        ) : (
          <Pressable
            style={aStyles.btnReopen}
            onPress={onReopen}
            accessibilityRole="button"
            accessibilityLabel="Reopen"
          >
            <Text style={aStyles.btnReopenText}>Reopen</Text>
          </Pressable>
        )}

        <Pressable
          style={aStyles.btnDismiss}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss Alert"
        >
          <Text style={aStyles.btnDismissText}>Dismiss</Text>
        </Pressable>
      </View>
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
  resolvedCard: { backgroundColor: '#F0FDF4' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badges: { flexDirection: 'row', gap: 6 },
  time: { fontSize: 11, color: AC.textSecondary, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '800', color: AC.textPrimary, marginTop: 2 },
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
  impactText: { fontSize: 11, color: AC.textSecondary, flex: 1 },
  resolvedInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resolvedNote: { fontSize: 11, color: AC.success, flex: 1 },
  ttr: { fontSize: 12, fontWeight: '700', color: AC.textSecondary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AC.borderLight,
    flexWrap: 'wrap',
  },
  btnGhost: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: AR.chip,
    backgroundColor: AC.borderLight,
  },
  btnGhostText: { fontSize: 11, fontWeight: '600', color: AC.textPrimary },
  btnAck: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: AR.chip,
    backgroundColor: AC.warningLight,
  },
  btnAckText: { fontSize: 11, fontWeight: '700', color: AC.warningText },
  btnResolve: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: AR.chip,
    backgroundColor: AC.successLight,
  },
  btnResolveText: { fontSize: 11, fontWeight: '700', color: AC.successText },
  btnReopen: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: AR.chip,
    backgroundColor: AC.primaryLight,
  },
  btnReopenText: { fontSize: 11, fontWeight: '700', color: AC.primary },
  btnDismiss: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: AR.chip,
    backgroundColor: AC.dangerLight,
  },
  btnDismissText: { fontSize: 11, fontWeight: '700', color: AC.dangerText },
});

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>(systemAlerts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [severityFilter, setSeverityFilter] = useState<FilterKey>('all');
  const [stateFilter, setStateFilter] = useState<StateFilterKey>('all');
  const [search, setSearch] = useState('');

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetchAlertsApi();
      if (res && res.data && res.data.length > 0) {
        // Map backend alerts to MonitoringAlert interface
        const mapped: MonitoringAlert[] = res.data.map((item: any) => ({
          id: item.alertId || item._id,
          title: item.title,
          service: item.service,
          worker: item.worker || 'Worker 01',
          time: item.time || 'Active',
          severity: (item.severity === 'critical' ? 'high' : item.severity) as AlertSeverity,
          state: item.state as any,
          metricLabel1: item.metricLabel1 || undefined,
          metricValue1: item.metricValue1 || undefined,
          metricLabel2: item.metricLabel2 || undefined,
          metricValue2: item.metricValue2 || undefined,
          impactNote: item.impactNote || undefined,
          resolvedNote: item.resolvedNote || undefined,
          ttr: item.ttr || undefined,
        }));
        setAlerts(mapped);
      }
    } catch {
      // Fallback to local default alerts
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await updateAlertStatusApi(alertId, 'acknowledged');
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, state: 'acknowledged' as any } : a))
      );
      Alert.alert('Acknowledged', `Incident ${alertId} has been acknowledged.`);
    } catch {
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, state: 'acknowledged' as any } : a))
      );
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await updateAlertStatusApi(alertId, 'resolved', 'Resolved by Administrator');
      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId
            ? { ...a, state: 'resolved', resolvedNote: 'Resolved by Administrator', ttr: 'Completed' }
            : a
        )
      );
      Alert.alert('Resolved', `Incident ${alertId} marked as resolved.`);
    } catch {
      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId
            ? { ...a, state: 'resolved', resolvedNote: 'Resolved by Administrator' }
            : a
        )
      );
    }
  };

  const handleReopenAlert = async (alertId: string) => {
    try {
      await updateAlertStatusApi(alertId, 'active');
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, state: 'active' } : a))
      );
      Alert.alert('Reopened', `Incident ${alertId} has been reopened.`);
    } catch {
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, state: 'active' } : a))
      );
    }
  };

  const handleDismissAlert = (alertId: string) => {
    Alert.alert(
      'Dismiss Alert',
      `Are you sure you want to dismiss incident ${alertId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlertApi(alertId);
            } catch {
              // local remove
            }
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            Alert.alert('Dismissed', `Alert ${alertId} has been removed.`);
          },
        },
      ]
    );
  };

  const handleAcknowledgeAll = () => {
    Alert.alert('Acknowledge All Alerts?', 'Mark all active alerts as acknowledged?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Acknowledge All',
        onPress: () => {
          setAlerts(prev =>
            prev.map(a => (a.state === 'active' ? { ...a, state: 'acknowledged' as any } : a))
          );
          Alert.alert('Success', 'All active alerts acknowledged.');
        },
      },
    ]);
  };

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (stateFilter !== 'all' && a.state !== stateFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.service.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const severityFilters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: alerts.length },
    { key: 'high', label: 'High', count: alerts.filter(a => a.severity === 'high').length },
    { key: 'medium', label: 'Med', count: alerts.filter(a => a.severity === 'medium').length },
    { key: 'low', label: 'Low', count: alerts.filter(a => a.severity === 'low').length },
  ];

  return (
    <View style={styles.screen}>
      <AdminHeader title="System Alerts" showBack onBack={() => router.push('/admin')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Incident Monitor Banner */}
        <View style={styles.section}>
          <View style={styles.monitorCard}>
            <View style={styles.monitorLeft}>
              <Text style={styles.monitorIcon}>INC</Text>
              <View>
                <Text style={styles.monitorTitle}>Incident Monitor</Text>
                <Text style={styles.monitorSub}>SLA Target: 99.98% • Live Watch</Text>
              </View>
            </View>
            <View style={styles.liveTailBtn}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTailText}>LIVE TAIL</Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search alerts by title or service..."
            placeholderTextColor={AC.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Severity Filters */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {severityFilters.map(f => (
                <Pressable
                  key={f.key}
                  style={[styles.filterTab, severityFilter === f.key ? styles.filterTabActive : null]}
                  onPress={() => setSeverityFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      severityFilter === f.key ? styles.filterTextActive : null,
                    ]}
                  >
                    {f.label} ({f.count})
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Status Pills */}
        <View style={styles.statusPillsRow}>
          {(['all', 'active', 'acknowledged', 'resolved'] as StateFilterKey[]).map(s => (
            <Pressable
              key={s}
              style={[styles.statusPill, stateFilter === s ? styles.statusPillActive : null]}
              onPress={() => setStateFilter(s)}
            >
              <Text
                style={[
                  styles.statusPillText,
                  stateFilter === s ? styles.statusPillTextActive : null,
                ]}
              >
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Incidents Count */}
        <View style={styles.section}>
          <Text style={styles.showingText}>Showing {filtered.length} recorded incidents</Text>
        </View>

        {/* Alert Cards */}
        <View style={[styles.section, styles.alertsGap]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>No matching alerts</Text>
              <Text style={styles.emptySub}>All systems operating within normal parameters.</Text>
            </View>
          ) : (
            filtered.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onViewDetails={() =>
                  router.push({
                    pathname: '/admin/issue-details',
                    params: { alertId: alert.id },
                  })
                }
                onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                onResolve={() => handleResolveAlert(alert.id)}
                onReopen={() => handleReopenAlert(alert.id)}
                onDismiss={() => handleDismissAlert(alert.id)}
              />
            ))
          )}
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
            style={styles.primaryBtn}
            onPress={handleAcknowledgeAll}
            accessibilityRole="button"
            accessibilityLabel="Acknowledge All Alerts"
          >
            <Text style={styles.primaryBtnText}>✓ Acknowledge All Active Alerts</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
      <BottomAdminTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  content: { padding: AS.screenH, gap: 12 },
  section: { gap: 8 },
  monitorCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monitorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monitorIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: AC.primary,
    backgroundColor: AC.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  monitorTitle: { fontSize: 14, fontWeight: '700', color: AC.textPrimary },
  monitorSub: { fontSize: 11, color: AC.textSecondary },
  liveTailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AC.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AR.chip,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.danger },
  liveTailText: { fontSize: 10, fontWeight: '800', color: AC.danger },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AC.bgCard,
    borderRadius: AR.button,
    borderWidth: 1,
    borderColor: AC.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 13, color: AC.textPrimary },
  clearIcon: { fontSize: 13, color: AC.textTertiary, paddingHorizontal: 4 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: AR.pill,
    backgroundColor: AC.bgCard,
    borderWidth: 1,
    borderColor: AC.border,
  },
  filterTabActive: { backgroundColor: AC.primary, borderColor: AC.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: AC.textSecondary },
  filterTextActive: { color: '#FFF', fontWeight: '700' },
  statusPillsRow: { flexDirection: 'row', gap: 6 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AR.chip,
    backgroundColor: AC.bgCard,
    borderWidth: 1,
    borderColor: AC.borderLight,
  },
  statusPillActive: { backgroundColor: AC.primaryLight, borderColor: AC.primaryMid },
  statusPillText: { fontSize: 10, fontWeight: '700', color: AC.textTertiary },
  statusPillTextActive: { color: AC.primary },
  showingText: { fontSize: 12, color: AC.textSecondary, fontWeight: '500' },
  alertsGap: { gap: 10 },
  emptyCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: AC.textPrimary },
  emptySub: { fontSize: 12, color: AC.textSecondary },
  cascadeCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 10,
  },
  cascadeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cascadeTitle: { fontSize: 13, fontWeight: '700', color: AC.textPrimary },
  elevatedBadge: {
    backgroundColor: AC.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  elevatedText: { fontSize: 10, fontWeight: '800', color: AC.warningText },
  nodeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cascadeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AC.borderLight,
    paddingTop: 8,
  },
  autoFailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.success },
  autoFailText: { fontSize: 11, color: AC.textSecondary },
  heartbeatText: { fontSize: 11, color: AC.textTertiary },
  btnSection: { gap: 8 },
  primaryBtn: {
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
