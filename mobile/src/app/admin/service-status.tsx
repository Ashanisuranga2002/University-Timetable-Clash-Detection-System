import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BottomAdminTabs } from '@/components/admin/BottomAdminTabs';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SectionHeader } from '@/components/admin/SectionHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  fetchSystemHealthApi,
  checkMonitorApi,
  checkAllMonitorsApi,
  SystemHealthData,
} from '@/services/api';

interface ServiceItem {
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
}

function OverallStatusCard({
  health,
  onRefresh,
  refreshing,
}: {
  health?: SystemHealthData | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const status = health?.overallStatus || 'Healthy';
  const isHealthy = status === 'Healthy';
  const isWarning = status === 'Warning';
  const statusColor = isHealthy ? AC.success : isWarning ? AC.warning : AC.danger;

  const fleetHealth = health ? `${health.uptime}%` : '--';
  const latency = health?.averageResponseTime || '--';
  const alertCount = health ? `${health.activeAlerts} Active` : '--';

  return (
    <View style={styles.overallCard}>
      <View style={styles.overallTop}>
        <View style={styles.overallLeft}>
          <View style={[styles.greenDotLg, { backgroundColor: statusColor }]} />
          <View>
            <Text style={styles.overallTitle}>Overall Status: {status}</Text>
            <Text style={styles.overallSub}>
              {health ? `${health.onlineMonitors}/${health.totalMonitors} probes operational` : 'Evaluating system health...'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onRefresh}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={AC.textSecondary} />
          ) : (
            <Text style={styles.refreshText}>{'\u21ba Run Probe'}</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Fleet Health</Text>
          <Text style={[styles.metricVal, { color: AC.success }]}>{fleetHealth}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Latency</Text>
          <Text style={[styles.metricVal, { color: AC.textPrimary }]}>{latency}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>System Alerts</Text>
          <Text style={[styles.metricVal, { color: isWarning ? AC.warning : isHealthy ? AC.success : AC.danger }]}>
            {alertCount}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ServiceCard({
  svc,
  onProbed,
}: {
  svc: ServiceItem;
  onProbed: () => void;
}) {
  const [probing, setProbing] = useState(false);
  const isWarning = svc.status === 'warning' || svc.healthStatus === 'Warning';
  const isOffline = svc.status === 'offline' || svc.healthStatus === 'Critical' || svc.healthStatus === 'Offline';

  async function handleProbe() {
    setProbing(true);
    try {
      const res = await checkMonitorApi(svc.id);
      Alert.alert('Probe Complete', res?.message || 'Service probe executed successfully.');
      onProbed();
    } catch (err: any) {
      Alert.alert('Probe Error', err?.message || 'Could not probe service endpoint.');
    } finally {
      setProbing(false);
    }
  }

  const iconMap: Record<string, string> = {
    'Engine': '⚙️',
    'Gateway': '🚪',
    'Database': '🗄️',
    'Queue': '🔔',
    'Service': '🖥️',
    'Worker': '⚡',
  };

  const icon = iconMap[svc.subtitle] || '🖥️';

  return (
    <View style={[styles.serviceCard, isWarning && styles.serviceCardWarning, isOffline && { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}>
      <View style={styles.serviceTop}>
        <View style={styles.serviceIcon}>
          <Text style={styles.serviceIconText}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{svc.name}</Text>
          <Text style={[styles.serviceSub, isWarning && { color: AC.warning }, isOffline && { color: AC.danger }]}>
            {svc.subtitle} {svc.enabled === false ? '• Disabled' : ''}
          </Text>
        </View>
        <StatusBadge variant={svc.status} />
      </View>
      <View style={styles.serviceMetrics}>
        <View>
          <Text style={styles.serviceMetLabel}>Response Time</Text>
          <Text style={[styles.serviceMetVal, isWarning && { color: AC.warning }, isOffline && { color: AC.danger }]}>
            {svc.latency || '--'}
          </Text>
        </View>
        <View>
          <Text style={styles.serviceMetLabel}>Availability</Text>
          <Text style={[styles.serviceMetVal, { color: isOffline ? AC.danger : AC.success }]}>
            {svc.availability}
          </Text>
        </View>
      </View>
      {svc.note ? <Text style={[styles.noteText, isOffline && { color: AC.danger }]}>{svc.note}</Text> : null}
      {svc.lastChecked ? (
        <Text style={{ fontSize: 10, color: AC.textTertiary }}>
          Last checked: {new Date(svc.lastChecked).toLocaleTimeString()}
        </Text>
      ) : null}
      <Pressable
        style={[styles.restartBtn, isOffline && { backgroundColor: AC.danger }]}
        onPress={handleProbe}
        disabled={probing}
        accessibilityRole="button"
        accessibilityLabel="Run Probe Check"
      >
        {probing ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.restartText}>{'\u26a1 Run Diagnostic Probe'}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function ServiceStatusScreen() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const res = await fetchSystemHealthApi();
      if (res && res.data) {
        setHealthData(res.data);
        if (res.data.services) {
          setServices(res.data.services as any);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load system health services:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  async function handleRefreshAll() {
    setRefreshing(true);
    try {
      await checkAllMonitorsApi();
    } catch {
      // probe fallback
    }
    await loadServices();
  }

  return (
    <View style={styles.screen}>
      <AdminHeader title="Service Status" showBack onBack={() => router.push('/admin')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshAll} />}
      >
        <View style={styles.section}>
          <OverallStatusCard
            health={healthData}
            onRefresh={handleRefreshAll}
            refreshing={refreshing}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Core Infrastructure Matrix"
            right={`${services.length} Probes Active`}
          />
          <View style={styles.gap}>
            {loading ? (
              <View style={{ padding: 32, alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="large" color={AC.primary} />
                <Text style={{ fontSize: 13, color: AC.textSecondary }}>Checking database monitor probes...</Text>
              </View>
            ) : services.length === 0 ? (
              <View style={[styles.overallCard, { alignItems: 'center', padding: 24 }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: AC.textPrimary }}>No Monitors Configured</Text>
                <Text style={{ fontSize: 12, color: AC.textSecondary, marginTop: 4 }}>Add monitors from Monitor Management to begin tracking.</Text>
                <Pressable onPress={() => router.push('/admin/monitors/add')} style={{ marginTop: 12, backgroundColor: AC.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>+ Add Monitor</Text>
                </Pressable>
              </View>
            ) : (
              services.map(svc => (
                <ServiceCard key={svc.id} svc={svc} onProbed={loadServices} />
              ))
            )}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 16 }]}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {`✅ Real database probes active • Host: ${healthData?.server || 'MSI'}`}
            </Text>
            <Pressable
              onPress={() => router.push('/admin/system-health')}
              accessibilityRole="link"
            >
              <Text style={styles.infoLink}>View System Health Metrics {'\u2192'}</Text>
            </Pressable>
          </View>
        </View>
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
  gap: { gap: 10 },
  overallCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 12,
  },
  overallTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overallLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  greenDotLg: { width: 14, height: 14, borderRadius: 7, backgroundColor: AC.success },
  overallTitle: { fontSize: 15, fontWeight: '700', color: AC.textPrimary },
  overallSub: { fontSize: 11, color: AC.textSecondary, marginTop: 2 },
  refreshBtn: {
    borderWidth: 1,
    borderColor: AC.border,
    borderRadius: AR.chip,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refreshText: { fontSize: 12, fontWeight: '600', color: AC.textSecondary },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: AC.border,
    paddingTop: 12,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: AC.border },
  metricLabel: { fontSize: 11, color: AC.textSecondary, marginBottom: 2 },
  metricVal: { fontSize: 16, fontWeight: '700' },
  serviceCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 10,
  },
  serviceCardWarning: { backgroundColor: AC.warningLight, borderColor: '#FCD34D' },
  serviceTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AC.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconText: { fontSize: 18 },
  serviceName: { fontSize: 15, fontWeight: '700', color: AC.textPrimary },
  serviceSub: { fontSize: 11, color: AC.textSecondary, marginTop: 1 },
  serviceMetrics: { flexDirection: 'row', gap: 32 },
  serviceMetLabel: { fontSize: 11, color: AC.textSecondary },
  serviceMetVal: { fontSize: 14, fontWeight: '700', color: AC.textPrimary, marginTop: 2 },
  noteText: { fontSize: 11, color: AC.warning, fontStyle: 'italic' },
  restartBtn: {
    backgroundColor: AC.warning,
    borderRadius: AR.button,
    paddingVertical: 10,
    alignItems: 'center',
  },
  restartText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  restartedBadge: {
    backgroundColor: AC.successLight,
    borderRadius: AR.chip,
    padding: 8,
    alignItems: 'center',
  },
  restartedText: { fontSize: 12, fontWeight: '600', color: AC.success },
  infoCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 14,
    gap: 8,
    alignItems: 'center',
  },
  infoText: { fontSize: 12, color: AC.textSecondary, textAlign: 'center' },
  infoLink: { fontSize: 13, fontWeight: '700', color: AC.primary },
});
