import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  barColor?: string;
  valueFormatter?: (n: number) => string;
};

export default function SimpleBarChart({
  title,
  subtitle,
  labels,
  values,
  barColor = colors.primary,
  valueFormatter = (n) => String(n),
}: Props) {
  const max = Math.max(...values, 1);
  const show = labels.slice(0, 8);
  const vals = values.slice(0, 8);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {show.map((label, i) => {
        const v = vals[i] ?? 0;
        const pct = Math.max(4, (v / max) * 100);
        return (
          <View key={`${label}-${i}`} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={styles.val}>{valueFormatter(v)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  label: {
    width: 52,
    fontSize: 11,
    color: colors.textSecondary,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.backgroundMuted,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  val: {
    width: 48,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
});
