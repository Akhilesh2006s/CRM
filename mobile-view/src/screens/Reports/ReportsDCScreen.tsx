import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, WebSelect, DataTable, WebLabel } from '../../ui/WebPrimitives';
import { apiService } from '../../services/api';

interface DcItem {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  product?: string;
  requestedQuantity?: number;
  status?: string;
  dcDate?: string;
  createdAt?: string;
  dcOrderId?: { school_name?: string; dc_code?: string };
}

const statuses = ['all', 'created', 'pending_dc', 'warehouse_processing', 'completed', 'hold'];

export default function ReportsDCScreen({ navigation }: any) {
  const [items, setItems] = useState<DcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadDc();
  }, []);

  const loadDc = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<any>('/dc');
      const entries = Array.isArray(data) ? data : data?.data || [];
      setItems(entries);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load DC data');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDc();
  };

  const summary = useMemo(() => {
    const total = items.length;
    const completed = items.filter((dc) => dc.status === 'completed').length;
    const pending = items.filter((dc) => dc.status !== 'completed' && dc.status !== 'hold').length;
    const hold = items.filter((dc) => dc.status === 'hold').length;
    return { total, completed, pending, hold };
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        !term ||
        item.customerName?.toLowerCase().includes(term) ||
        item.dcOrderId?.school_name?.toLowerCase().includes(term) ||
        item.customerPhone?.includes(term) ||
        item.dcOrderId?.dc_code?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, search]);

  return (
    <ScreenShell
      title="DC Report"
      loading={loading && !refreshing}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
<View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
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
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Hold</Text>
          <Text style={[styles.summaryValue, { color: colors.error || '#ef4444' }]}>{summary.hold}</Text>
        </View>
      </View>
      <View style={styles.filters}>
        <WebInput
          style={styles.searchInput}
          placeholder="Search DC by school, contact, or code" value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No DC records found</Text>
          </View>
        ) : (
          filtered.map((dc) => (
            <View key={dc._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dcTitle}>{dc.dcOrderId?.school_name || dc.customerName || 'DC'}</Text>
                <Text style={styles.badge}>{dc.status || 'Pending'}</Text>
              </View>
              <Text style={styles.infoLine}>DC Code: {dc.dcOrderId?.dc_code || '-'}</Text>
              <Text style={styles.infoLine}>Contact: {dc.customerPhone || '-'}</Text>
              <Text style={styles.infoLine}>Product: {dc.product || '-'}</Text>
              <Text style={styles.infoLine}>Quantity: {dc.requestedQuantity ?? 0}</Text>
              <Text style={styles.infoLine}>Date: {dc.dcDate ? new Date(dc.dcDate).toLocaleDateString('en-IN') : '-'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenShell>
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
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  summaryCard: { flex: 1, minWidth: 140, padding: 12, borderRadius: 12, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
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
  dcTitle: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  badge: { ...typography.label.small, color: colors.primary, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
});


