import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Radius, Spacing } from '@/constants/theme';
import type { ProgressMetric, ProgressPoint } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate } from '@/lib/date';
import { formatNumber, formatVolume, formatWeight } from '@/lib/format';

type ProgressChartProps = {
  points: readonly ProgressPoint[];
  metric: ProgressMetric;
};

export function metricValue(point: ProgressPoint, metric: ProgressMetric): number {
  if (metric === 'volume') return point.volume;
  if (metric === 'est1rm') return point.est1rm;
  return point.maxWeight;
}

export function formatMetric(value: number, metric: ProgressMetric): string {
  return metric === 'volume' ? formatVolume(value) : formatWeight(value);
}

/** Legfeljebb ennyi dátumcímke fér ki olvashatóan az X tengelyen. */
const MAX_X_LABELS = 5;

export function ProgressChart({ points, metric }: ProgressChartProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const chartWidth = windowWidth - Spacing.three * 2 - Spacing.three * 2;

  const { data, yAxisOffset, maxValue } = useMemo(() => {
    const values = points.map((point) => metricValue(point, metric));
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const span = rawMax - rawMin;
    const padding = span > 0 ? span * 0.15 : Math.max(rawMax * 0.1, 1);

    const baseline = Math.max(0, Math.floor(rawMin - padding));
    const top = Math.ceil(rawMax + padding);

    // A csúcsokat kiemeljük: az a pont, ami az addigi legjobbat megdöntötte.
    let runningBest = -Infinity;
    const labelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));

    const items = points.map((point, index) => {
      const value = values[index];
      const isRecord = value > runningBest;
      if (isRecord) runningBest = value;

      return {
        value,
        label: index % labelStep === 0 ? formatShortDate(point.performedAt) : '',
        performedAt: point.performedAt,
        dataPointColor: isRecord ? theme.pr : theme.accent,
        dataPointRadius: isRecord ? 6 : 4,
      };
    });

    return {
      data: items,
      yAxisOffset: baseline,
      maxValue: Math.max(top - baseline, 1),
    };
  }, [points, metric, theme.accent, theme.pr]);

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={chartWidth}
        height={200}
        adjustToWidth
        disableScroll
        curved
        thickness={2.5}
        color={theme.accent}
        yAxisOffset={yAxisOffset}
        maxValue={maxValue}
        noOfSections={4}
        initialSpacing={16}
        endSpacing={16}
        rulesColor={theme.border}
        yAxisColor={theme.border}
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.textSecondary, fontSize: 11 }}
        xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
        yAxisLabelWidth={44}
        formatYLabel={(label: string) => formatNumber(Number(label), 0)}
        pointerConfig={{
          pointerColor: theme.accent,
          pointerStripColor: theme.border,
          pointerStripWidth: 1,
          radius: 5,
          pointerLabelWidth: 140,
          pointerLabelHeight: 62,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number; performedAt: string }[]) => {
            const item = items[0];
            if (!item) return null;

            return (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Text style={[styles.tooltipDate, { color: theme.textSecondary }]}>
                  {formatShortDate(item.performedAt)}
                </Text>
                <Text style={[styles.tooltipValue, { color: theme.text }]}>
                  {formatMetric(item.value, metric)}
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: Spacing.two,
  },
  tooltip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  tooltipDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
