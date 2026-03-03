import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface Expense {
  _id: string;
  title: string;
  amount: number;
  approvedAmount?: number;
  category: string;
  date: string;
  description?: string;
  employeeRemarks?: string;
}

export default function ExpenseManagerUpdateScreen({ navigation, route }: any) {
  const { employeeId, employeeName } = route.params;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [formValues, setFormValues] = useState<Record<string, { approvedAmount: string; managerRemarks: string }>>({});

  useEffect(() => {
    loadExpenses();
  }, [employeeId, fromDate, toDate]);

  const loadExpenses = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      const data = await apiService.get<Expense[]>(`/expenses/employee/${employeeId}${params.toString() ? `?${params.toString()}` : ''}`);
      setExpenses(Array.isArray(data) ? data : []);
      const initial: Record<string, { approvedAmount: string; managerRemarks: string }> = {};
      (data || []).forEach((exp) => {
        initial[exp._id] = {
          approvedAmount: exp.approvedAmount?.toString() || exp.amount?.toString() || '0',
          managerRemarks: '',
        };
      });
      setFormValues(initial);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, field: 'approvedAmount' | 'managerRemarks', value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleApprove = async () => {
    if (!expenses.length) {
      Alert.alert('Info', 'No expenses to approve.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = expenses.map((exp) => ({
        id: exp._id,
        approvedAmount: formValues[exp._id]?.approvedAmount ? parseFloat(formValues[exp._id].approvedAmount) : exp.amount,
        managerRemarks: formValues[exp._id]?.managerRemarks || '',
      }));
      await apiService.post('/expenses/approve-multiple', { expenses: payload });
      Alert.alert('Success', 'Expenses approved successfully', [
        { text: 'OK', onPress: () => navigation.navigate('ExpensePending') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve expenses');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return '-';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{employeeName || 'Employee'} Expenses</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>From Date</Text>
          <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          <Text style={[styles.filterLabel, { marginTop: 12 }]}>To Date</Text>
          <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
          <TouchableOpacity style={styles.searchButton} onPress={loadExpenses}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading expenses...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <View key={expense._id} style={styles.card}>
              <Text style={styles.expenseTitle}>{expense.title || 'Expense'}</Text>
              <Text style={styles.expenseCategory}>{expense.category || 'General'}</Text>
              <Text style={styles.amountText}>₹{expense.amount?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.infoText}>Date: {formatDate(expense.date)}</Text>
              {expense.description ? <Text style={styles.infoText}>Note: {expense.description}</Text> : null}
              <Text style={styles.label}>Approved Amount</Text>
              <TextInput
                style={styles.input}
                value={formValues[expense._id]?.approvedAmount || ''}
                onChangeText={(text) => handleChange(expense._id, 'approvedAmount', text)}
                keyboardType="decimal-pad"
              />
              <Text style={styles.label}>Manager Remarks</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={formValues[expense._id]?.managerRemarks || ''}
                onChangeText={(text) => handleChange(expense._id, 'managerRemarks', text)}
                multiline
              />
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.approveButton, (submitting || !expenses.length) && styles.buttonDisabled]} onPress={handleApprove} disabled={submitting || !expenses.length}>
          {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.approveButtonText}>Approve Selected</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h2, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  filterCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  filterLabel: { ...typography.label.medium, color: colors.textPrimary },
  input: { ...typography.body.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary, marginTop: 8 },
  searchButton: { marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  searchButtonText: { ...typography.label.medium, color: colors.textLight, fontWeight: '600' },
  loadingInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  loadingText: { ...typography.body.medium, color: colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  expenseTitle: { ...typography.heading.h3, color: colors.textPrimary },
  expenseCategory: { ...typography.body.small, color: colors.textSecondary, marginBottom: 8 },
  amountText: { ...typography.heading.h2, color: colors.primary, marginBottom: 6 },
  infoText: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 4 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginTop: 10 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  approveButton: { paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  approveButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});


