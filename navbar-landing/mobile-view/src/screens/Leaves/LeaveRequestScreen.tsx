import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

export default function LeaveRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Sick Leave',
    reason: '',
    days: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Compensatory Off', 'Other'];

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setForm((f) => ({ ...f, days: diffDays }));
    }
  }, [form.startDate, form.endDate]);

  const handleSubmit = async () => {
    clearMessages();
    if (!form.startDate?.trim()) {
      setErrorMessage('Start date is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.endDate?.trim()) {
      setErrorMessage('End date is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.reason?.trim()) {
      setErrorMessage('Reason is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        employeeId: user?._id,
        status: 'Pending',
      };
      await apiService.post('/leaves', payload);
      setSuccessMessage('Leave request submitted successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit leave request');
      setSuccessMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Leave</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="View My Leaves"
            onAction={() => navigation.navigate('LeaveList')}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <FormField label="Leave Type" value={form.leaveType} onChangeText={(text: string) => setForm((f) => ({ ...f, leaveType: text }))} placeholder="Select leave type" />
        <View style={styles.leaveTypeContainer}>
          {leaveTypes.map((type) => (
            <TouchableOpacity key={type} style={[styles.leaveTypeOption, form.leaveType === type && styles.leaveTypeOptionSelected]} onPress={() => setForm((f) => ({ ...f, leaveType: type }))}>
              <Text style={[styles.leaveTypeOptionText, form.leaveType === type && styles.leaveTypeOptionTextSelected]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FormField label="Start Date *" value={form.startDate} onChangeText={(text: string) => setForm((f) => ({ ...f, startDate: text }))} placeholder="YYYY-MM-DD" />
        <FormField label="End Date *" value={form.endDate} onChangeText={(text: string) => setForm((f) => ({ ...f, endDate: text }))} placeholder="YYYY-MM-DD" />
        {form.days > 0 && (
          <View style={styles.daysContainer}>
            <Text style={styles.daysText}>Total Days: {form.days}</Text>
          </View>
        )}
        <View style={styles.textAreaContainer}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput style={styles.textArea} value={form.reason} onChangeText={(text: string) => setForm((f) => ({ ...f, reason: text }))} placeholder="Enter reason for leave" multiline numberOfLines={4} />
        </View>
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Submit Request</Text>}
          </LinearGradient>
        </TouchableOpacity>
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
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  fieldContainer: { marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginBottom: 8 },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  leaveTypeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  leaveTypeOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  leaveTypeOptionSelected: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  leaveTypeOptionText: { ...typography.body.medium, color: colors.textPrimary },
  leaveTypeOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  daysContainer: { marginBottom: 16, padding: 12, backgroundColor: colors.primary + '10', borderRadius: 12 },
  daysText: { ...typography.body.medium, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  textAreaContainer: { marginBottom: 16 },
  textArea: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top' },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});

