import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  AdminMonitor,
  deleteMonitorApi,
  fetchMonitorsApi,
  updateMonitorApi,
} from '@/services/api';

const STATUS_FILTERS = ['All', 'Healthy', 'Warning', 'Critical', 'Offline'] as const;

export default function MonitorsListScreen() {
  const [monitors, setMonitors] = useState<AdminMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<string>('All');

  const loadMonitors = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchMonitorsApi();
      if (res && res.data) {
        setMonitors(res.data);
      } else if (Array.isArray(res)) {
        setMonitors(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch monitors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMonitors();
    }, [loadMonitors])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMonitors();
  };

  const handleToggleEnabled = async (monitor: AdminMonitor) => {
    const newEnabled = !monitor.enabled;
    try {
      await updateMonitorApi(monitor._id || monitor.monitorId, {
        enabled: newEnabled,
      });
      setMonitors((prev) =>
        prev.map((m) =>
          (m._id === monitor._id || m.monitorId === monitor.monitorId)
            ? { ...m, enabled: newEnabled }
            : m
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to toggle monitor state');
    }
  };

  const handleDelete = (monitor: AdminMonitor) => {
    Alert.alert(
      'Remove Monitor',
      `Are you sure you want to delete monitor "${monitor.serviceName}"? Telemetry metrics for this service will stop tracking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMonitorApi(monitor._id || monitor.monitorId);
              Alert.alert('Success', 'Monitor removed successfully.');
              loadMonitors();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete monitor');
            }
          },
        },
      ]
    );
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'Healthy':
        return { bg: AC.successLight, text: AC.successText, dot: AC.success };
      case 'Warning':
        return { bg: AC.warningLight, text: AC.warningText, dot: AC.warning };
      case 'Critical':
        return { bg: AC.dangerLight, text: AC.dangerText, dot: AC.danger };
      case 'Offline':
      default:
        return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
    }
  };

  const filtered = monitors.filter((m) => {
    if (filter === 'All') return true;
    return m.healthStatus === filter;
  });

  return (
    <View style={styles.screen}>
      <AdminHeader title="Monitor Management" showBack onBack={() => router.push('/admin')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header & Add Action */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>Monitored Services</Text>
            <Text style={styles.topSub}>
              {monitors.length} active service probes configured
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/admin/monitors/add')}
            accessibilityRole="button"
            accessibilityLabel="Add New Monitor"
          >
            <Text style={styles.addBtnText}>+ Add Monitor</Text>
          </Pressable>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((s) => {
            const active = filter === s;
            return (
              <Pressable
                key={s}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(s)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Loading / Error / Empty / List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={AC.primary} />
            <Text style={styles.loadingText}>Loading monitors...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Error Loading Monitors</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={loadMonitors}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🖥️</Text>
            <Text style={styles.emptyTitle}>No monitors found</Text>
            <Text style={styles.emptySub}>
              No configured monitors match this filter status.
            </Text>
            <Pressable style={styles.addBtn} onPress={() => router.push('/admin/monitors/add')}>
              <Text style={styles.addBtnText}>+ Configure Monitor</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((item) => {
            const badge = getHealthBadge(item.healthStatus);
            const targetId = item._id || item.monitorId;

            return (
              <Pressable
                key={targetId}
                style={styles.monitorCard}
                onPress={() => router.push(`/admin/monitors/${targetId}` as any)}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.serviceNameRow}>
                      <Text style={styles.serviceName}>{item.serviceName}</Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.serviceType}</Text>
                      </View>
                    </View>
                    <Text style={styles.endpointText} numberOfLines={1}>
                      {item.endpoint || 'Internal Engine Target'}
                    </Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {item.healthStatus}
                    </Text>
                  </View>
                </View>

                {/* Metrics Row */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>LATENCY</Text>
                    <Text style={styles.metricValue}>{item.responseTime || '1.0s'}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>INTERVAL</Text>
                    <Text style={styles.metricValue}>{item.interval || '30s'}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>STATUS</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: item.enabled ? AC.successText : AC.textTertiary },
                      ]}
                    >
                      {item.enabled ? 'ENABLED' : 'PAUSED'}
                    </Text>
                  </View>
                </View>

                {/* Footer Actions */}
                <View style={styles.cardFooter}>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Active Probing:</Text>
                    <Switch
                      value={item.enabled}
                      onValueChange={() => handleToggleEnabled(item)}
                      trackColor={{ false: '#CBD5E1', true: AC.primaryMid }}
                      thumbColor={item.enabled ? AC.primary : '#F1F5F9'}
                    />
                  </View>

                  <View style={styles.btnRow}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => router.push(`/admin/monitors/edit/${targetId}` as any)}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item)}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  content: { padding: AS.screenH, gap: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  topSub: {
    fontSize: 12,
    color: AC.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: {
    backgroundColor: AC.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: AR.pill,
    borderWidth: 1,
    borderColor: AC.border,
  },
  filterChipActive: {
    backgroundColor: AC.primary,
    borderColor: AC.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loadingText: { fontSize: 13, color: AC.textSecondary },
  errorIcon: { fontSize: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: AC.danger },
  errorSub: { fontSize: 13, color: AC.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: AC.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: AR.button,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700' },
  emptyCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AC.textPrimary },
  emptySub: { fontSize: 13, color: AC.textSecondary, textAlign: 'center', marginBottom: 8 },
  monitorCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  typeBadge: {
    backgroundColor: AC.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AC.primary,
  },
  endpointText: {
    fontSize: 11,
    color: AC.textTertiary,
    marginTop: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AR.chip,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: AC.bgApp,
    borderRadius: AR.button,
    padding: 10,
    alignItems: 'center',
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: 9, fontWeight: '800', color: AC.textTertiary, letterSpacing: 0.5 },
  metricValue: { fontSize: 13, fontWeight: '700', color: AC.textPrimary },
  metricDivider: { width: 1, height: 20, backgroundColor: AC.border },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: AC.borderLight,
    paddingTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 12,
    color: AC.textSecondary,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AR.chip,
    backgroundColor: AC.borderLight,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textPrimary,
  },
  deleteBtn: { backgroundColor: AC.dangerLight },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: AC.dangerText },
});
