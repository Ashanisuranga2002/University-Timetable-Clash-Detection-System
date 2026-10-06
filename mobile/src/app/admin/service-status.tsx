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
import { coreServices, InfrastructureService } from '@/constants/adminMonitoringData';
import { fetchSystemHealthApi } from '@/services/api';

function OverallStatusCard({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={styles.overallCard}>
      <View style={styles.overallTop}>
        <View style={styles.overallLeft}>
          <View style={styles.greenDotLg} />
          <View>
            <Text style={styles.overallTitle}>Overall Status: Operational</Text>
            <Text style={styles.overallSub}>All critical systems functioning normally</Text>
          </View>
        </View>
        <Pressable
          onPress={onRefresh}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
        >
          <Text style={styles.refreshText}>{'\u21ba Refresh'}</Text>
        </Pressable>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Fleet Health</Text>
          <Text style={[styles.metricVal, { color: AC.success }]}>99.8%</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Latency</Text>
          <Text style={[styles.metricVal, { color: AC.textPrimary }]}>1.47s</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>System Alerts</Text>
          <Text style={[styles.metricVal, { color: AC.warning }]}>1 Warning</Text>
        </View>
      </View>
    </View>
  );
}

function ServiceCard({ svc }: { svc: InfrastructureService }) {
  const [restarting, setRestarting] = useState(false);
  const [restarted, setRestarted] = useState(false);
  const isWarning = svc.status === 'warning';

  function handleRestart() {
    Alert.alert('Restart Notification Worker?', 'This will temporarily interrupt notification delivery.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restart',
        style: 'destructive',
        onPress: () => {
          setRestarting(true);
          setTimeout(() => {
            setRestarting(false);
            setRestarted(true);
          }, 2000);
        },
      },
    ]);
  }

  const iconMap: Record<string, string> = {
    'clash-detection': '🔗',
    registration: '👤',
    database: '🗄',
    notification: '🔔',
  };

  return (
    <View style={[styles.serviceCard, isWarning && styles.serviceCardWarning]}>
      <View style={styles.serviceTop}>
        <View style={styles.serviceIcon}>
          <Text style={styles.serviceIconText}>{iconMap[svc.id] ?? '🖥'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{svc.name}</Text>
          <Text style={[styles.serviceSub, isWarning && { color: AC.warning }]}>
            {svc.subtitle}
          </Text>
        </View>
        <StatusBadge variant={restarted ? 'online' : svc.status} />
      </View>
      <View style={styles.serviceMetrics}>
        <View>
          <Text style={styles.serviceMetLabel}>Response Time</Text>
          <Text style={[styles.serviceMetVal, isWarning && { color: AC.warning }]}>
            {svc.latency}
            {isWarning ? ' (High)' : svc.id === 'database' ? ' (Optimal)' : ''}
          </Text>
        </View>
        <View>
          <Text style={styles.serviceMetLabel}>Availability</Text>
          <Text style={[styles.serviceMetVal, { color: AC.success }]}>{svc.availability}</Text>
        </View>
      </View>
      {isWarning && svc.note ? <Text style={styles.noteText}>{svc.note}</Text> : null}
      {isWarning && !restarted ? (
        <Pressable
          style={styles.restartBtn}
          onPress={handleRestart}
          disabled={restarting}
          accessibilityRole="button"
          accessibilityLabel="Restart Worker"
        >
          {restarting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.restartText}>{'\u26a1 Restart Worker'}</Text>
          )}
        </Pressable>
      ) : null}
      {restarted ? (
        <View style={styles.restartedBadge}>
          <Text style={styles.restartedText}>{'\u2713 Worker restarted successfully'}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ServiceStatusScreen() {
  const [services, setServices] = useState<InfrastructureService[]>(coreServices);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const res = await fetchSystemHealthApi();
      if (res && res.data && res.data.services && res.data.services.length > 0) {
        setServices(res.data.services as any);
      }
    } catch {
      // Fallback to coreServices
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadServices();
  }

  return (
    <View style={styles.screen}>
      <AdminHeader title="Service Status" showBack onBack={() => router.push('/admin')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.section}>
          <OverallStatusCard onRefresh={handleRefresh} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Core Infrastructure Matrix"
            right={`${services.length} Instances Monitored`}
          />
          <View style={styles.gap}>
            {services.map(svc => (
              <ServiceCard key={svc.id} svc={svc} />
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 16 }]}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {'\u2705 Automated Edge Synthetics active on 12 distributed regions'}
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
