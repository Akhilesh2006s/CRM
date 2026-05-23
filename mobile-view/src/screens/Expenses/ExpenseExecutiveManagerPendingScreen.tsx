import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { navigateRoot } from '../../navigation/navigationRef';

type Expense = {
  _id: string;
  title: string;
  amount: number;
  category: string;
  status: string;
  createdAt: string;
  employeeId?: { _id: string; name: string };
};

type Employee = { _id: string; name: string };

export default function ExpenseExecutiveManagerPendingScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeId, setEmployeeId] = useState('all');
  const [approving, setApproving] = useState<string | null>(null);
  const [sendBackId, setSendBackId] = useState<string | null>(null);
  const [sendBackRemarks, setSendBackRemarks] = useState('');

  const loadEmployees = useCallback(async () => {
    if (!user?._id) return;
    try {
      const data = await apiService.get(`/executive-managers/${user._id}/employees`);
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setEmployees([]);
    }
  }, [user?._id]);

  const loadExpenses = useCallback(async () => {
    try {
      const q = employeeId !== 'all' ? `?employeeId=${employeeId}` : '';
      const data = await apiService.get(`/expenses/executive-manager-pending${q}`);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const approve = async (id: string) => {
    setApproving(id);
    try {
      await apiService.put(`/expenses/${id}/approve`, { status: 'Executive Manager Approved' });
      loadExpenses();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Approve failed');
    } finally {
      setApproving(null);
    }
  };

  const confirmSendBack = async () => {
    if (!sendBackId || !sendBackRemarks.trim()) {
      Alert.alert('Error', 'Remarks are required');
      return;
    }
    setApproving(sendBackId);
    try {
      await apiService.put(`/expenses/${sendBackId}/approve`, {
        status: 'Needs Correction',
        managerRemarks: sendBackRemarks.trim(),
      });
      setSendBackId(null);
      setSendBackRemarks('');
      loadExpenses();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed');
    } finally {
      setApproving(null);
    }
  };

  const editExpense = (exp: Expense) => {
    const empId = exp.employeeId?._id;
    if (empId) {
      navigateRoot('ExpenseManagerUpdate', { employeeId: empId });
    } else {
      navigateRoot('ExpenseEdit', { id: exp._id });
    }
  };

  return (
    <ScreenShell title="Expense Executive Manager Pending"
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}>
      <PageSection title="Expense Executive Manager Pending">
<Text style={styles.title}>EM Pending Expenses</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={employeeId} onValueChange={setEmployeeId}>
          <Picker.Item label="All employees" value="all" />
          {employees.map((e) => (
            <Picker.Item key={e._id} label={e.name} value={e._id} />
          ))}
        </Picker>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExpenses(); }} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No pending expenses</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>₹{item.amount} · {item.category}</Text>
            <Text style={styles.meta}>{item.employeeId?.name || '—'}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => editExpense(item)}>
                <Text style={styles.btnSecondaryText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnWarn} onPress={() => setSendBackId(item._id)} disabled={!!approving}>
                <Text style={styles.btnText}>Send back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => approve(item._id)} disabled={approving === item._id}>
                {approving === item._id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={!!sendBackId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Send back for correction</Text>
            <WebInput
              style={styles.modalInput}
              placeholder="Remarks (required)"
              value={sendBackRemarks}
              onChangeText={setSendBackRemarks}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setSendBackId(null); setSendBackRemarks(''); }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSendBack}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.heading.h2, marginBottom: 12 },
  pickerWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 12 },
  card: { backgroundColor: colors.backgroundLight, padding: 14, borderRadius: 12, marginBottom: 10 },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  meta: { color: colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btnPrimary: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnWarn: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnSecondary: { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnSecondaryText: { fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.background, padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 80, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
});
