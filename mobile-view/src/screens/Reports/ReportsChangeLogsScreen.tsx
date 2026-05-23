import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { colors, radii, spacing } from '../../theme/colors';

/** Matches navbar-landing/app/dashboard/reports/change-logs/page.tsx */
export default function ReportsChangeLogsScreen() {
  return (
    <ScreenShell title="Change Logs" subtitle="Track all system changes and updates">
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>✨</Text>
        <Text style={styles.heroTitle}>Change Logs Coming Soon</Text>
        <Text style={styles.heroBody}>
          We're working on bringing you a comprehensive change log system to track all updates,
          improvements, and modifications to the CRM platform.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={[styles.feature, styles.featureBlue]}>
          <Text style={styles.featureTitle}>Version History</Text>
          <Text style={styles.featureDesc}>Track version updates</Text>
        </View>
        <View style={[styles.feature, styles.featurePurple]}>
          <Text style={styles.featureTitle}>Feature Updates</Text>
          <Text style={styles.featureDesc}>New features & improvements</Text>
        </View>
        <View style={[styles.feature, styles.featureGreen]}>
          <Text style={styles.featureTitle}>System Changes</Text>
          <Text style={styles.featureDesc}>All system modifications</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  heroBody: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  grid: { gap: spacing.sm },
  feature: { padding: spacing.md, borderRadius: radii.lg, borderWidth: 1 },
  featureBlue: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  featurePurple: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  featureGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  featureDesc: { fontSize: 12 },
});
