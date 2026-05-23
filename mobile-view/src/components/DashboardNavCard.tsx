import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Accent = 'green' | 'blue' | 'orange' | 'purple' | 'rose' | 'teal' | 'amber';

const accentMap: Record<Accent, { bg: string; border: string; iconBg: string }> = {
  green: { bg: '#F0FDF4', border: '#BBF7D0', iconBg: '#DCFCE7' },
  blue: { bg: '#EFF6FF', border: '#BFDBFE', iconBg: '#DBEAFE' },
  orange: { bg: '#FFF7ED', border: '#FED7AA', iconBg: '#FFEDD5' },
  purple: { bg: '#F5F3FF', border: '#DDD6FE', iconBg: '#EDE9FE' },
  rose: { bg: '#FFF1F2', border: '#FECDD3', iconBg: '#FFE4E6' },
  teal: { bg: '#F0FDFA', border: '#99F6E4', iconBg: '#CCFBF1' },
  amber: { bg: '#FFFBEB', border: '#FDE68A', iconBg: '#FEF3C7' },
};

type Props = {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  accent?: Accent;
};

/** Web-style dashboard link card (neutral white / soft accent — not full gradient). */
export default function DashboardNavCard({ title, subtitle, icon, onPress, accent = 'green' }: Props) {
  const a = accentMap[accent];
  return (
    <TouchableOpacity style={styles.wrap} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.card, { backgroundColor: a.bg, borderColor: a.border }]}>
        <View style={[styles.iconBox, { backgroundColor: a.iconBg }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: { fontSize: 24 },
  textCol: { flex: 1 },
  title: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.body.small, color: colors.textSecondary },
  arrow: { fontSize: 22, color: colors.primary, fontWeight: '700', marginLeft: 8 },
});
