import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function TrainingDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduled, completed, cancelled] = await Promise.all([
        apiService.get('/training?status=Scheduled').catch(() => []),
        apiService.get('/training?status=Completed').catch(() => []),
        apiService.get('/training?status=Cancelled').catch(() => []),
      ]);
      setStats({
        scheduled: Array.isArray(scheduled) ? scheduled.length : 0,
        completed: Array.isArray(completed) ? completed.length : 0,
        cancelled: Array.isArray(cancelled) ? cancelled.length : 0,
        total: (Array.isArray(scheduled) ? scheduled.length : 0) + (Array.isArray(completed) ? completed.length : 0) + (Array.isArray(cancelled) ? cancelled.length : 0),
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load training dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Training Dashboard</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Trainings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.info + '20' }]}>
            <Text style={[styles.statValue, { color: colors.info }]}>{stats.scheduled || 0}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.completed || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: (colors.error || '#ef4444') + '20' }]}>
            <Text style={[styles.statValue, { color: colors.error || '#ef4444' }]}>{stats.cancelled || 0}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TrainingList')}>
          <Text style={styles.actionCardTitle}>View All Trainings</Text>
          <Text style={styles.actionCardSubtitle}>See complete training list</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TrainingAssign')}>
          <Text style={styles.actionCardTitle}>Assign New Training</Text>
          <Text style={styles.actionCardSubtitle}>Schedule a new training</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, ...typography.body.medium, color: colors.textSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 20, alignItems: 'center' },
  statValue: { ...typography.heading.h1, color: colors.primary, marginBottom: 8 },
  statLabel: { ...typography.body.medium, color: colors.textSecondary },
  actionCard: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 12 },
  actionCardTitle: { ...typography.heading.h3, color: colors.textLight, marginBottom: 6 },
  actionCardSubtitle: { ...typography.body.medium, color: colors.textLight, opacity: 0.9 },
});


