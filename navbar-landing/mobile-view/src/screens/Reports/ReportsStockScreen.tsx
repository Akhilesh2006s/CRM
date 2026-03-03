import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface StockItem {
  _id: string;
  productName: string;
  category?: string;
  level?: string;
  currentStock?: number;
  status?: string;
  location?: string;
}

export default function ReportsStockScreen({ navigation }: any) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<any>('/warehouse');
      const entries = Array.isArray(data) ? data : data?.data || [];
      setItems(entries);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load stock');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStocks();
  };

  const summary = useMemo(() => {
    const total = items.length;
    const inStock = items.filter((item) => item.status === 'In Stock').length;
    const lowStock = items.filter((item) => item.status === 'Low Stock').length;
    const outStock = items.filter((item) => item.status === 'Out of Stock').length;
    return { total, inStock, lowStock, outStock };
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        !term ||
        item.productName?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, search]);

  const statuses = ['all', 'In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading stock report...</Text>
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
          <Text style={styles.headerTitle}>Stock Report</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{summary.total}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>In Stock</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.inStock}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Low Stock</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.lowStock}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Out of Stock</Text>
          <Text style={[styles.summaryValue, { color: colors.error || '#ef4444' }]}>{summary.outStock}</Text>
        </View>
      </View>
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search product, category, or location"
          placeholderTextColor={colors.textSecondary}
          value={search}
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
            <Text style={styles.emptyText}>No stock items found</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemTitle}>{item.productName || 'Item'}</Text>
                <Text style={styles.statusBadge}>{item.status || 'Unknown'}</Text>
              </View>
              <Text style={styles.infoLine}>Category: {item.category || '-'}</Text>
              <Text style={styles.infoLine}>Level: {item.level || '-'}</Text>
              <Text style={styles.infoLine}>Location: {item.location || '-'}</Text>
              <Text style={styles.infoLine}>Current Stock: {item.currentStock ?? 0}</Text>
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
  itemTitle: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  statusBadge: { ...typography.label.small, color: colors.primary, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
});


