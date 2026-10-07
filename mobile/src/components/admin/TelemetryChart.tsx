import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TelemetryPoint } from '@/constants/adminMonitoringData';
import { AC } from '@/constants/adminTheme';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  height?: number;
  showSurge?: boolean;
}

export function TelemetryChart({ data, height = 120, showSurge = false }: TelemetryChartProps) {
  const maxLoad = 100;
  const maxLatency = 60;
  const padL = 8;
  const padT = 28;
  const padB = 20;
  const chartW = 280;
  const chartH = height - padT - padB;
  const step = data.length > 1 ? chartW / (data.length - 1) : chartW;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const loadPts = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + chartH - (d.load / maxLoad) * chartH,
  }));
  const latPts = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + chartH - (d.latency / maxLatency) * chartH,
  }));

  const surgeIdx = data.findIndex(d => d.load >= 63);

  return (
    <View style={[styles.chartOuter, { height: height + 20 }]}>
      {gridLines.map((ratio, i) => (
        <View
          key={i}
          style={[
            styles.gridLine,
            { top: padT + chartH - ratio * chartH, left: padL, width: chartW },
          ]}
        />
      ))}

      {loadPts.slice(0, -1).map((pt, i) => {
        const next = loadPts[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`load-${i}`}
            style={[
              styles.lineSegment,
              { width: len, left: pt.x, top: pt.y, transform: [{ rotate: `${angle}deg` }], backgroundColor: AC.primary },
            ]}
          />
        );
      })}

      {latPts.slice(0, -1).map((pt, i) => {
        const next = latPts[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const segs = Math.floor(len / 7);
        return Array.from({ length: segs }).map((_, s) => {
          if (s % 2 !== 0) return null;
          const t = s / segs;
          const t2 = Math.min((s + 0.65) / segs, 1);
          const segLen = (t2 - t) * len;
          return (
            <View
              key={`lat-${i}-${s}`}
              style={[
                styles.lineSegment,
                {
                  width: segLen,
                  left: pt.x + t * dx,
                  top: pt.y + t * dy,
                  transform: [{ rotate: `${angle}deg` }],
                  backgroundColor: AC.success,
                },
              ]}
            />
          );
        });
      })}

      {loadPts.map((pt, i) => (
        <View
          key={`ld-${i}`}
          style={[styles.dot, { left: pt.x - 4, top: pt.y - 4, backgroundColor: AC.primary }]}
        />
      ))}

      {showSurge && surgeIdx >= 0 ? (
        <>
          <View
            style={[
              styles.surgeLine,
              { left: loadPts[surgeIdx].x, top: padT, height: chartH },
            ]}
          />
          <View style={[styles.surgeBubble, { left: Math.max(0, loadPts[surgeIdx].x - 55) }]}>
            <Text style={styles.surgeBubbleText}>
              {'ENROLLMENT SURGE\n65% Load \u2022 1.2s'}
            </Text>
          </View>
        </>
      ) : null}

      <View style={[styles.xLabels, { top: padT + chartH + 4, left: padL, width: chartW }]}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[styles.xLabel, i === data.length - 1 && styles.xLabelNow]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartOuter: { position: 'relative', width: '100%', overflow: 'visible' },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: AC.border,
    opacity: 0.5,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    // @ts-ignore - RN supports transformOrigin on some platforms
    transformOrigin: '0 0',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  surgeLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: AC.warning,
    opacity: 0.6,
  },
  surgeBubble: {
    position: 'absolute',
    top: 4,
    backgroundColor: AC.textPrimary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  surgeBubbleText: { color: '#FFF', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  xLabels: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabel: { fontSize: 9, color: AC.textSecondary, fontWeight: '500' },
  xLabelNow: {
    color: AC.primary,
    fontWeight: '700',
    backgroundColor: AC.primaryLight,
    paddingHorizontal: 3,
    borderRadius: 3,
  },
});
