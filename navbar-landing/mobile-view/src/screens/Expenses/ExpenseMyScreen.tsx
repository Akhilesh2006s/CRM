import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';

export default function ExpenseMyScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/expenses?my=true');
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return colors.success;
      case 'Manager Approved':
        return colors.info;
      case 'Rejected':
        return colors.error || '#ef4444';
      default:
        return colors.warning;
    }
  };

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
          <Text style={styles.headerTitle}>My Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExpenseCreate')} style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>No expenses found</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('ExpenseCreate')}>
              <Text style={styles.emptyButtonText}>Create Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          expenses.map((expense) => (
            <View key={expense._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.expenseTitle}>{expense.title || 'Expense'}</Text>
                  <Text style={styles.expenseCategory}>{expense.category || 'General'}</Text>
                </View>
                <Text style={[styles.statusBadge, { color: getStatusColor(expense.status), borderColor: getStatusColor(expense.status) }]}>
                  {expense.status === 'Pending' ? 'Pending at Manager' : expense.status === 'Manager Approved' ? 'Pending at Finance' : expense.status}
                </Text>
              </View>
              <Text style={styles.amountText}>₹{expense.amount?.toFixed(2) || '0.00'}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{formatDate(expense.date || expense.createdAt)}</Text>
              </View>
              {expense.approvedAmount ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Approved Amount:</Text>
                  <Text style={styles.infoValue}>₹{expense.approvedAmount.toFixed(2)}</Text>
                </View>
              ) : null}
              {expense.employeeRemarks ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Remarks:</Text>
                  <Text style={styles.infoValue}>{expense.employeeRemarks}</Text>
                </View>
              ) : null}
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
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary, marginBottom: 12 },
  emptyButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  emptyButtonText: { ...typography.label.medium, color: colors.textLight },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.shadowDark, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  expenseTitle: { ...typography.heading.h3, color: colors.textPrimary },
  expenseCategory: { ...typography.body.small, color: colors.textSecondary },
  statusBadge: { ...typography.label.medium, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  amountText: { ...typography.heading.h2, color: colors.primary, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  infoLabel: { ...typography.body.medium, color: colors.textSecondary },
  infoValue: { ...typography.body.medium, color: colors.textPrimary },
});


