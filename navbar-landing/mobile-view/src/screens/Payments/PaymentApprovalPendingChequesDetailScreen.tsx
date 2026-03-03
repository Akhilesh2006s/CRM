import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function PaymentApprovalPendingChequesDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    referenceNumber: '',
    adminRemarks: '',
    status: 'Pending',
  });

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/payments/${id}`);
      setPayment(data);
      setForm({
        referenceNumber: data.referenceNumber || data.refNo || '',
        adminRemarks: data.adminRemarks || data.rejectionReason || '',
        status: data.status || 'Pending',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load payment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (statusToSet?: string) => {
    const status = statusToSet || form.status;
    if ((status === 'Hold' || status === 'Rejected') && !form.adminRemarks?.trim()) {
      Alert.alert('Error', 'Please add remarks for Hold or Reject actions');
      return;
    }

    setSaving(true);
    try {
      await apiService.put(`/payments/${id}/approve`, {
        status: status,
        adminRemarks: form.adminRemarks || undefined,
        rejectionReason: status === 'Rejected' ? form.adminRemarks : undefined,
        referenceNumber: form.referenceNumber || undefined,
      });
      Alert.alert('Success', `Payment ${status.toLowerCase()} successfully`, [
        { text: 'OK', onPress: () => navigation.navigate('PaymentApprovalPendingCheques') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update payment');
    } finally {
      setSaving(false);
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

  const formatAmount = (amount?: number) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading payment details...</Text>
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
          <Text style={styles.headerTitle}>Cheque Payment Details</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {payment && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{payment.customerName || 'N/A'}</Text>
              <Text style={styles.amountText}>{formatAmount(payment.amount)}</Text>
              <Text style={styles.infoText}>Date: {formatDate(payment.paymentDate)}</Text>
              <Text style={styles.infoText}>Method: {payment.paymentMethod || '-'}</Text>
              {payment.chqDate && <Text style={styles.infoText}>Cheque Date: {formatDate(payment.chqDate)}</Text>}
              {payment.refNo && <Text style={styles.infoText}>Reference No: {payment.refNo}</Text>}
              {payment.schoolCode && <Text style={styles.infoText}>School Code: {payment.schoolCode}</Text>}
              {payment.mobileNumber && <Text style={styles.infoText}>Mobile: {payment.mobileNumber}</Text>}
            </View>
            <FormField label="Reference Number" value={form.referenceNumber} onChangeText={(text: string) => setForm((f) => ({ ...f, referenceNumber: text }))} placeholder="Enter reference number" />
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>Admin Remarks</Text>
              <TextInput style={styles.textArea} value={form.adminRemarks} onChangeText={(text: string) => setForm((f) => ({ ...f, adminRemarks: text }))} placeholder="Enter remarks (required for Hold/Reject)" multiline numberOfLines={4} />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.approveButton, saving && styles.buttonDisabled]} onPress={() => handleApprove('Approved')} disabled={saving}>
                <LinearGradient colors={[colors.success, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                  {saving ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.buttonText}>Approve</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.holdButton, saving && styles.buttonDisabled]} onPress={() => handleApprove('Hold')} disabled={saving}>
                <LinearGradient colors={[colors.warning, '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                  {saving ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.buttonText}>Hold</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rejectButton, saving && styles.buttonDisabled]} onPress={() => handleApprove('Rejected')} disabled={saving}>
                <LinearGradient colors={[colors.error || '#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                  {saving ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.buttonText}>Reject</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textSecondary} />
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
  contentContainer: { padding: 20, paddingBottom: 40 },
  infoCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 20 },
  infoTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 12 },
  amountText: { ...typography.heading.h1, color: colors.success, marginBottom: 12, fontWeight: 'bold' },
  infoText: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 6 },
  fieldContainer: { marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginBottom: 8 },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  textAreaContainer: { marginBottom: 16 },
  textArea: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top' },
  buttonContainer: { gap: 12, marginTop: 24 },
  approveButton: { borderRadius: 12, overflow: 'hidden' },
  holdButton: { borderRadius: 12, overflow: 'hidden' },
  rejectButton: { borderRadius: 12, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});


