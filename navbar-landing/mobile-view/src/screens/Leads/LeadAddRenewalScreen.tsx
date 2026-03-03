import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

export default function LeadAddRenewalScreen({ navigation }: any) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    school_type: 'Existing',
    school_name: '',
    contact_person: '',
    contact_mobile: '',
    location: '',
    zone: '',
    priority: 'Hot',
    remarks: '',
    follow_up_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    clearMessages();
    if (!form.school_name?.trim()) {
      setErrorMessage('School Name is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.contact_person?.trim()) {
      setErrorMessage('Contact Person is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.contact_mobile?.trim()) {
      setErrorMessage('Contact Mobile is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        status: 'Pending',
        createdBy: user?._id,
      };
      await apiService.post('/leads', payload);
      setSuccessMessage('Renewal lead created successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create lead');
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
          <Text style={styles.headerTitle}>Renewal Cross Sale</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="View Leads"
            onAction={() => navigation.navigate('LeadsList')}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <Text style={styles.mandatoryNote}>Fields marked with * are mandatory.</Text>
        <FormField label="School Name *" value={form.school_name} onChangeText={(text: string) => setForm((f) => ({ ...f, school_name: text }))} placeholder="Enter school name" />
        <FormField label="Contact Person *" value={form.contact_person} onChangeText={(text: string) => setForm((f) => ({ ...f, contact_person: text }))} placeholder="Enter contact person" />
        <FormField label="Contact Mobile *" value={form.contact_mobile} onChangeText={(text: string) => setForm((f) => ({ ...f, contact_mobile: text }))} placeholder="Enter mobile" keyboardType="phone-pad" />
        <FormField label="Location" value={form.location} onChangeText={(text: string) => setForm((f) => ({ ...f, location: text }))} placeholder="Enter location" />
        <FormField label="Zone" value={form.zone} onChangeText={(text: string) => setForm((f) => ({ ...f, zone: text }))} placeholder="Enter zone" />
        <FormField label="Priority" value={form.priority} onChangeText={(text: string) => setForm((f) => ({ ...f, priority: text }))} placeholder="Hot/Warm/Cold" />
        <View style={styles.textAreaContainer}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={styles.textArea} value={form.remarks} onChangeText={(text: string) => setForm((f) => ({ ...f, remarks: text }))} placeholder="Enter remarks" multiline numberOfLines={4} />
        </View>
        <FormField label="Follow-up Date" value={form.follow_up_date} onChangeText={(text: string) => setForm((f) => ({ ...f, follow_up_date: text }))} placeholder="YYYY-MM-DD" />
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Create Lead</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textSecondary} keyboardType={keyboardType} />
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
  mandatoryNote: { ...typography.body.small, color: colors.textSecondary, marginBottom: 16 },
  fieldContainer: { marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginBottom: 8 },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  textAreaContainer: { marginBottom: 16 },
  textArea: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top' },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});


