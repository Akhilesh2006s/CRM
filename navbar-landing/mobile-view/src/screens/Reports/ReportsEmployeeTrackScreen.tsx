import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface TrackingData {
  _id: string;
  employeeName: string;
  mobileNo: string;
  zone: string;
  started: string;
  lastUsed: string;
  lastLocation: string;
  logCount: number;
}

export default function ReportsEmployeeTrackScreen({ navigation }: any) {
  const [records, setRecords] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTracking();
  }, []);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<TrackingData[]>('/employees/tracking');
      setRecords(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load tracking data');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTracking();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((rec) => {
      if (!term) return true;
      return rec.employeeName?.toLowerCase().includes(term) || rec.mobileNo?.includes(term) || rec.zone?.toLowerCase().includes(term);
    });
  }, [records, search]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading tracking report...</Text>
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
          <Text style={styles.headerTitle}>Employee Tracking</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, mobile, or zone"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛰️</Text>
            <Text style={styles.emptyText}>No tracking data found</Text>
          </View>
        ) : (
          filtered.map((rec) => (
            <View key={rec._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.employeeName}>{rec.employeeName || 'Employee'}</Text>
                <Text style={styles.zoneBadge}>{rec.zone || 'Unknown'}</Text>
              </View>
              <Text style={styles.infoLine}>Mobile: {rec.mobileNo || '-'}</Text>
              <Text style={styles.infoLine}>Logs: {rec.logCount || 0}</Text>
              <Text style={styles.infoLine}>Started: {rec.started ? new Date(rec.started).toLocaleString('en-IN') : '-'}</Text>
              <Text style={styles.infoLine}>Last Used: {rec.lastUsed ? new Date(rec.lastUsed).toLocaleString('en-IN') : '-'}</Text>
              <Text style={styles.infoLine}>Last Location: {rec.lastLocation || '-'}</Text>
            </View>
          ))
        )}
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
  filters: { padding: 16 },
  searchInput: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, color: colors.textPrimary },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  employeeName: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  zoneBadge: { ...typography.label.small, color: colors.primary, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
});


