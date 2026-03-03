import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface Visit {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  dcDate?: string;
  createdAt?: string;
  dcOrderId?: { school_name?: string; zone?: string; contact_mobile?: string };
  employeeId?: { name?: string };
  status?: string;
}

export default function ReportsSalesVisitScreen({ navigation }: any) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<any>('/dc');
      const entries = Array.isArray(data) ? data : data?.data || [];
      setVisits(entries);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load sales visits');
      setVisits([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVisits();
  };

  const zones = useMemo(() => {
    const set = new Set<string>();
    visits.forEach((visit) => {
      const zone = visit.dcOrderId?.zone;
      if (zone) set.add(zone);
    });
    return Array.from(set).sort();
  }, [visits]);

  const filteredVisits = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visits.filter((visit) => {
      const zone = visit.dcOrderId?.zone || '';
      const matchesZone = zoneFilter === 'all' || zone.toLowerCase() === zoneFilter.toLowerCase();
      const matchesSearch =
        !term ||
        visit.customerName?.toLowerCase().includes(term) ||
        visit.dcOrderId?.school_name?.toLowerCase().includes(term) ||
        visit.customerPhone?.includes(term) ||
        visit.dcOrderId?.contact_mobile?.includes(term);
      return matchesZone && matchesSearch;
    });
  }, [visits, zoneFilter, search]);

  const summary = useMemo(() => {
    const completed = visits.filter((v) => v.status === 'completed').length;
    const pending = visits.filter((v) => v.status !== 'completed').length;
    return { total: visits.length, completed, pending };
  }, [visits]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading sales visits...</Text>
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
          <Text style={styles.headerTitle}>Sales Visit Report</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Visits</Text>
          <Text style={styles.summaryValue}>{summary.total}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.completed}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.pending}</Text>
        </View>
      </View>
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by school or contact"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, zoneFilter === 'all' && styles.filterChipActive]}
            onPress={() => setZoneFilter('all')}
          >
            <Text style={[styles.filterChipText, zoneFilter === 'all' && styles.filterChipTextActive]}>All Zones</Text>
          </TouchableOpacity>
          {zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.filterChip, zoneFilter === zone && styles.filterChipActive]}
              onPress={() => setZoneFilter(zone)}
            >
              <Text style={[styles.filterChipText, zoneFilter === zone && styles.filterChipTextActive]}>{zone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredVisits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚚</Text>
            <Text style={styles.emptyText}>No visits found</Text>
          </View>
        ) : (
          filteredVisits.map((visit) => (
            <View key={visit._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.visitTitle}>{visit.dcOrderId?.school_name || visit.customerName || 'Visit'}</Text>
                <Text style={styles.badge}>{visit.status || 'Pending'}</Text>
              </View>
              <Text style={styles.infoLine}>Contact: {visit.customerPhone || visit.dcOrderId?.contact_mobile || '-'}</Text>
              <Text style={styles.infoLine}>Zone: {visit.dcOrderId?.zone || '-'}</Text>
              <Text style={styles.infoLine}>Assigned To: {visit.employeeId?.name || '-'}</Text>
              <Text style={styles.infoLine}>
                Date: {visit.dcDate ? new Date(visit.dcDate).toLocaleDateString('en-IN') : visit.createdAt ? new Date(visit.createdAt).toLocaleDateString('en-IN') : '-'}
              </Text>
              {visit.customerAddress ? <Text style={styles.infoLine}>Address: {visit.customerAddress}</Text> : null}
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
  summaryRow: { flexDirection: 'row', padding: 16, gap: 10 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { ...typography.label.medium, color: colors.textSecondary },
  summaryValue: { ...typography.heading.h3, color: colors.textPrimary },
  filters: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, color: colors.textPrimary },
  filterScroll: { marginTop: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterChipText: { ...typography.body.medium, color: colors.textPrimary },
  filterChipTextActive: { color: colors.primary, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  visitTitle: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  badge: { ...typography.label.small, color: colors.primary, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
});


