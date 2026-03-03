import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function PaymentApprovalPendingChequesScreen({ navigation }: any) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    schoolCode: '',
    schoolName: '',
    mobileNo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'Pending');
      params.append('paymentMode', 'Cheque');
      if (filters.schoolCode) params.append('schoolCode', filters.schoolCode);
      if (filters.schoolName) params.append('schoolName', filters.schoolName);
      if (filters.mobileNo) params.append('mobileNo', filters.mobileNo);
      
      const data = await apiService.get(`/payments?${params.toString()}`);
      setPayments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load pending cheque payments');
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

  const formatAmount = (amount?: number) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading pending cheque payments...</Text>
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
          <Text style={styles.headerTitle}>Pending Cheque Payments</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.filterContainer}>
        <TextInput style={styles.filterInput} value={filters.schoolCode} onChangeText={(text: string) => setFilters((f) => ({ ...f, schoolCode: text }))} placeholder="School Code" placeholderTextColor={colors.textSecondary} />
        <TextInput style={styles.filterInput} value={filters.schoolName} onChangeText={(text: string) => setFilters((f) => ({ ...f, schoolName: text }))} placeholder="School Name" placeholderTextColor={colors.textSecondary} />
        <TextInput style={styles.filterInput} value={filters.mobileNo} onChangeText={(text: string) => setFilters((f) => ({ ...f, mobileNo: text }))} placeholder="Mobile No" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" />
        <TouchableOpacity style={styles.searchButton} onPress={loadData}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No pending cheque payments found</Text>
          </View>
        ) : (
          payments.map((payment) => (
            <TouchableOpacity
              key={payment._id}
              style={styles.card}
              onPress={() => navigation.navigate('PaymentApprovalPendingChequesDetail', { id: payment._id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>{payment.customerName || 'N/A'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.warning }]}>Pending</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount:</Text>
                  <Text style={[styles.infoValue, styles.amountText]}>{formatAmount(payment.amount)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(payment.paymentDate)}</Text>
                </View>
                {payment.chqDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Cheque Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(payment.chqDate)}</Text>
                  </View>
                )}
                {payment.refNo && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ref No:</Text>
                    <Text style={styles.infoValue}>{payment.refNo}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterInput: { flex: 1, minWidth: '45%', ...typography.body.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary },
  searchButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center' },
  searchButtonText: { ...typography.label.medium, color: colors.textLight, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customerName: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { ...typography.label.small, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { ...typography.body.medium, color: colors.textSecondary, width: 100 },
  infoValue: { ...typography.body.medium, color: colors.textPrimary, flex: 1 },
  amountText: { ...typography.heading.h3, color: colors.success, fontWeight: '600' },
});


