import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BottomAdminTabs } from '@/components/admin/BottomAdminTabs';
import { ProgressBar } from '@/components/admin/ProgressBar';
import { TelemetryChart } from '@/components/admin/TelemetryChart';
import { AC, AR, AS } from '@/constants/adminTheme';
import { telemetryData4h } from '@/constants/adminMonitoringData';

export default function SystemHealthScreen() {
  const [refreshed, setRefreshed] = useState(false);

  function handleRefresh() {
    setRefreshed(true);
    Alert.alert('Diagnostics Refreshed', 'All metrics have been updated.');
    setTimeout(() => setRefreshed(false), 3000);
  }

  return (
    <View style={styles.screen}>
      <AdminHeader title="System Health" showBack onBack={() => router.push('/admin')} />

      {/* Health Banner */}
      <View style={styles.healthBanner}>
        <View style={styles.healthBannerLeft}>
          <Text style={styles.healthBannerIcon}>gear</Text>
          <View>
            <Text style={styles.healthBannerTitle}>Overall Health: Healthy</Text>
            <Text style={styles.healthBannerSub}>32 Nodes Synchronized - 8ms latency</Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* High Ingress Banner */}
        <View style={styles.section}>
          <View style={styles.ingressCard}>
            <View style={styles.ingressLeft}>
              <Text style={styles.ingressIcon}>flash</Text>
              <View>
                <Text style={styles.ingressLabel}>HIGH REGISTRATION INGRESS</Text>
                <Text style={styles.ingressDesc}>Auto-scaler active. Zero dropouts detected.</Text>
              </View>
            </View>
            <Text style={styles.ingressSeason}>Fall 2025</Text>
          </View>
        </View>

        {/* Infrastructure */}
        <View style={styles.section}>
          <View style={styles.infraHeader}>
            <Text style={styles.sectionTitle}>Core Infrastructure</Text>
            <Text style={styles.samplingText}>Sampling: 1s window</Text>
          </View>

          {/* CPU */}
          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricIcon}>CPU</Text>
                <View>
                  <Text style={styles.metricName}>CPU / System Load</Text>
                  <Text style={styles.metricMeta}>Peak 71% - Warning threshold 75%</Text>
                </View>
              </View>
              <Text style={[styles.metricPct, { color: AC.warning }]}>65%</Text>
            </View>
            <View style={styles.metricBarWrap}>
              <ProgressBar progress={0.65} color={AC.primary} height={6} />
            </View>
          </View>

          {/* Memory */}
          <View style={[styles.metricCard, { marginTop: 10 }]}>
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricIcon}>MEM</Text>
                <View>
                  <Text style={styles.metricName}>Memory Usage</Text>
                  <Text style={styles.metricMeta}>18.5 GB used of 32 GB Pool</Text>
                </View>
              </View>
              <Text style={[styles.metricPct, { color: AC.success }]}>58%</Text>
            </View>
            <View style={styles.metricBarWrap}>
              <ProgressBar progress={0.58} color={AC.success} height={6} />
            </View>
          </View>
        </View>

        {/* Mini metric cards */}
        <View style={[styles.section, styles.twoCol]}>
          <View style={styles.miniMetricCard}>
            <View style={styles.miniMetricTop}>
              <Text style={styles.miniMetricLabel}>RESPONSE</Text>
              <View style={styles.greenDot} />
            </View>
            <Text style={styles.miniMetricValue}>
              {'1.2'}
              <Text style={styles.miniMetricUnit}>s</Text>
            </Text>
            <Text style={styles.miniMetricSub}>Nominal</Text>
          </View>
          <View style={styles.miniMetricCard}>
            <View style={styles.miniMetricTop}>
              <Text style={styles.miniMetricLabel}>ACTIVE USERS</Text>
            </View>
            <Text style={styles.miniMetricValue}>1,240</Text>
            <Text style={[styles.miniMetricSub, { color: AC.primary }]}>Peak load</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.section}>
          <View style={styles.chartCard}>
            <View style={styles.chartTitleRow}>
              <Text style={styles.chartTitle}>Performance Telemetry</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: AC.primary }]} />
                  <Text style={styles.legendText}>Load (65%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDash, { backgroundColor: AC.success }]} />
                  <Text style={styles.legendText}>Latency (1.2s)</Text>
                </View>
              </View>
            </View>
            <Text style={styles.chartSub}>4-Hour Trend</Text>
            <View style={styles.chartWrap}>
              <TelemetryChart data={telemetryData4h} height={110} />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.section, styles.btnSection]}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push('/admin/alerts')}
            accessibilityRole="button"
            accessibilityLabel="View Alerts"
          >
            <Text style={styles.primaryBtnText}>View Alerts</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>2 Active</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Refresh Diagnostics"
          >
            <Text style={styles.secondaryBtnText}>
              {refreshed ? 'Refreshed' : 'Refresh Diagnostics'}
            </Text>
            <View style={styles.kbdHint}>
              <Text style={styles.kbdText}>Ctrl+R</Text>
            </View>
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
  healthBanner: {
    backgroundColor: AC.successLight,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthBannerIcon: { fontSize: 14, color: AC.success, fontWeight: '600' },
  healthBannerTitle: { fontSize: 15, fontWeight: '700', color: AC.textPrimary },
  healthBannerSub: { fontSize: 11, color: AC.textSecondary, marginTop: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AC.successLight,
    borderWidth: 1,
    borderColor: AC.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.success },
  liveText: { fontSize: 10, fontWeight: '800', color: AC.success, letterSpacing: 0.5 },
  ingressCard: {
    backgroundColor: AC.warningLight,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingressLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ingressIcon: { fontSize: 14, color: AC.warning, fontWeight: '700' },
  ingressLabel: { fontSize: 11, fontWeight: '800', color: AC.warning, letterSpacing: 0.5 },
  ingressDesc: { fontSize: 12, color: AC.textSecondary, marginTop: 2 },
  ingressSeason: { fontSize: 12, fontWeight: '600', color: AC.textSecondary },
  infraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AC.textPrimary },
  samplingText: { fontSize: 11, color: AC.textSecondary },
  metricCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 12,
  },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { fontSize: 11, color: AC.primary, fontWeight: '700', width: 28, textAlign: 'center' },
  metricName: { fontSize: 13, fontWeight: '700', color: AC.textPrimary },
  metricMeta: { fontSize: 10, color: AC.textSecondary, marginTop: 2 },
  metricPct: { fontSize: 18, fontWeight: '800' },
  metricBarWrap: { marginTop: 10 },
  twoCol: { flexDirection: 'row', gap: 10 },
  miniMetricCard: {
    flex: 1,
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 12,
  },
  miniMetricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniMetricLabel: { fontSize: 9, fontWeight: '700', color: AC.textSecondary, letterSpacing: 0.6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AC.success },
  miniMetricValue: { fontSize: 28, fontWeight: '800', color: AC.textPrimary, marginTop: 4 },
  miniMetricUnit: { fontSize: 16, fontWeight: '600', color: AC.textSecondary },
  miniMetricSub: { fontSize: 11, color: AC.success, marginTop: 2, fontWeight: '600' },
  chartCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 14,
    overflow: 'hidden',
  },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 14, fontWeight: '700', color: AC.textPrimary },
  chartSub: { fontSize: 11, color: AC.textSecondary, marginTop: 2, marginBottom: 8 },
  legendRow: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 12, height: 2, borderRadius: 1 },
  legendText: { fontSize: 9, color: AC.textSecondary, fontWeight: '600' },
  chartWrap: { marginTop: 4 },
  btnSection: { gap: 8, marginTop: 4 },
  primaryBtn: {
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', flex: 1 },
  activeBadge: {
    backgroundColor: AC.danger,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.button,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AC.border,
    gap: 10,
  },
  secondaryBtnText: { color: AC.textPrimary, fontSize: 13, fontWeight: '600' },
  kbdHint: {
    borderWidth: 1,
    borderColor: AC.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: AC.borderLight,
  },
  kbdText: { fontSize: 10, color: AC.textSecondary, fontWeight: '600' },
});
