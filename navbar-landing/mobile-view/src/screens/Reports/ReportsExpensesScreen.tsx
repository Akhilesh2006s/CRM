import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface Expense {
  _id: string;
  amount: number;
  approvedAmount?: number;
  category: string;
  date: string;
  status: string;
  employeeId?: { name: string; zone?: string };
}

export default function ReportsExpensesScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<Expense[]>('/expenses/report');
      setExpenses(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const approved = expenses.reduce((sum, item) => sum + (item.approvedAmount || 0), 0);
    const pendingCount = expenses.filter((item) => item.status === 'Pending' || item.status === 'Manager Approved').length;
    return { total, approved, count: expenses.length, pendingCount };
  }, [expenses]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses.filter((exp) => {
      const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
      const matchesSearch =
        !term ||
        exp.category.toLowerCase().includes(term) ||
        exp.employeeId?.name?.toLowerCase().includes(term) ||
        exp.employeeId?.zone?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [expenses, statusFilter, search]);

  const statuses = ['all', 'Pending', 'Manager Approved', 'Approved', 'Rejected'];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
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
          <Text style={styles.headerTitle}>Expenses Report</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>₹{summary.total.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Approved Amount</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>₹{summary.approved.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.pendingCount}</Text>
        </View>
      </View>
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by employee, zone, or category"
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
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        ) : (
          filtered.map((exp) => (
            <View key={exp._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.expenseTitle}>{exp.category}</Text>
                <Text style={styles.badge}>{exp.status === 'Pending' ? 'Pending at Manager' : exp.status}</Text>
              </View>
              <Text style={styles.infoLine}>Amount: ₹{exp.amount?.toFixed(2) || '0.00'}</Text>
              {exp.approvedAmount ? <Text style={styles.infoLine}>Approved: ₹{exp.approvedAmount.toFixed(2)}</Text> : null}
              <Text style={styles.infoLine}>Employee: {exp.employeeId?.name || '-'}</Text>
              <Text style={styles.infoLine}>Zone: {exp.employeeId?.zone || '-'}</Text>
              <Text style={styles.infoLine}>Date: {new Date(exp.date).toLocaleDateString('en-IN')}</Text>
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
  summaryCard: { flex: 1, minWidth: 150, padding: 12, borderRadius: 12, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
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
  expenseTitle: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  badge: { ...typography.label.small, color: colors.primary, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
});


