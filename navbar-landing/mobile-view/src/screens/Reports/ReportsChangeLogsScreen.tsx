import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function ReportsChangeLogsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Change Logs</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>✨</Text>
          <Text style={styles.heroTitle}>Change Logs Coming Soon</Text>
          <Text style={styles.heroSubtitle}>
            We are building a detailed change log to help you track feature updates, bug fixes, and improvements to the CRM platform.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What to expect</Text>
          <Text style={styles.cardText}>• Version history for every release</Text>
          <Text style={styles.cardText}>• Feature additions and enhancements</Text>
          <Text style={styles.cardText}>• Fixes and performance updates</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need updates now?</Text>
          <Text style={styles.cardText}>
            Contact the product team for the latest deployment notes or subscribe to the release newsletter from the settings module.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { alignItems: 'center' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight },
  content: { padding: 20, gap: 16 },
  hero: { alignItems: 'center', padding: 24, borderRadius: 20, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  heroIcon: { fontSize: 48, marginBottom: 12 },
  heroTitle: { ...typography.heading.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { ...typography.body.medium, color: colors.textSecondary, textAlign: 'center' },
  card: { padding: 16, borderRadius: 16, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  cardTitle: { ...typography.heading.h4, color: colors.textPrimary, marginBottom: 8 },
  cardText: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 4 },
});


