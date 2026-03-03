import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface Stats {
  total: number;
  byStatus: { Scheduled: number; Completed: number; Cancelled: number };
  zoneStats: { _id: string; total: number; completed: number }[];
  subjectStats: { _id: string; total: number; completed: number }[];
}

export default function ReportsTrainingServiceScreen({ navigation }: any) {
  const [trainingStats, setTrainingStats] = useState<Stats | null>(null);
  const [serviceStats, setServiceStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [zone, setZone] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (zone) params.append('zone', zone);
      const [training, service] = await Promise.all([
        apiService.get<Stats>(`/training/stats?${params.toString()}`),
        apiService.get<Stats>(`/services/stats?${params.toString()}`),
      ]);
      setTrainingStats(training);
      setServiceStats(service);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load training & service stats');
      setTrainingStats(null);
      setServiceStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading report...</Text>
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
          <Text style={styles.headerTitle}>Training & Service</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={styles.filterCard}>
          <Text style={styles.label}>From Date</Text>
          <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
          <Text style={[styles.label, { marginTop: 12 }]}>To Date</Text>
          <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
          <Text style={[styles.label, { marginTop: 12 }]}>Zone</Text>
          <TextInput style={styles.input} value={zone} onChangeText={setZone} placeholder="Optional" placeholderTextColor={colors.textSecondary} />
          <TouchableOpacity style={styles.searchButton} onPress={loadStats}>
            <Text style={styles.searchButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Trainings</Text>
            <Text style={styles.summaryValue}>{trainingStats?.total || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completed Trainings</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{trainingStats?.byStatus?.Completed || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Services</Text>
            <Text style={styles.summaryValue}>{serviceStats?.total || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completed Services</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{serviceStats?.byStatus?.Completed || 0}</Text>
          </View>
        </View>

        {trainingStats?.zoneStats?.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Zone-wise Training</Text>
            {trainingStats.zoneStats.map((zoneStat) => (
              <View key={zoneStat._id} style={styles.listRow}>
                <Text style={styles.listPrimary}>{zoneStat._id || 'Zone'}</Text>
                <Text style={styles.listSecondary}>
                  {zoneStat.completed}/{zoneStat.total} completed
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {trainingStats?.subjectStats?.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Subject-wise Training</Text>
            {trainingStats.subjectStats.map((subject) => (
              <View key={subject._id} style={styles.listRow}>
                <Text style={styles.listPrimary}>{subject._id || 'Subject'}</Text>
                <Text style={styles.listSecondary}>
                  {subject.completed}/{subject.total} completed
                </Text>
              </View>
            ))}
          </View>
        ) : null}
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
  content: { flex: 1 },
  filterCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary },
  input: { ...typography.body.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, color: colors.textPrimary, marginTop: 6 },
  searchButton: { marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  searchButtonText: { ...typography.label.medium, color: colors.textLight, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, minWidth: 150, padding: 12, borderRadius: 12, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { ...typography.label.medium, color: colors.textSecondary },
  summaryValue: { ...typography.heading.h3, color: colors.textPrimary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  sectionTitle: { ...typography.heading.h4, color: colors.textPrimary, marginBottom: 12 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  listPrimary: { ...typography.body.medium, color: colors.textPrimary },
  listSecondary: { ...typography.body.medium, color: colors.textSecondary },
});


