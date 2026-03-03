import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

export default function LeadEditScreen({ navigation, route }: any) {
  const { id } = route.params;
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadLead();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      // Try dc-orders first (for follow-up leads), then leads API
      let lead: any;
      try {
        lead = await apiService.get(`/dc-orders/${id}`);
      } catch (err: any) {
        lead = await apiService.get(`/leads/${id}`);
      }
      setForm(lead);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load lead');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    clearMessages();
    setSubmitting(true);
    try {
      try {
        await apiService.put(`/dc-orders/${id}`, form);
      } catch (err: any) {
        await apiService.put(`/leads/${id}`, form);
      }
      setSuccessMessage('Lead updated successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update lead');
      setSuccessMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading lead...</Text>
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
          <Text style={styles.headerTitle}>Edit Lead</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="Back to Leads"
            onAction={() => navigation.goBack()}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <FormField label="School Name" value={form.school_name || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, school_name: text }))} placeholder="Enter school name" />
        <FormField label="Contact Person" value={form.contact_person || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, contact_person: text }))} placeholder="Enter contact person" />
        <FormField label="Contact Mobile" value={form.contact_mobile || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, contact_mobile: text }))} placeholder="Enter mobile" keyboardType="phone-pad" />
        <FormField label="Location" value={form.location || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, location: text }))} placeholder="Enter location" />
        <FormField label="Zone" value={form.zone || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, zone: text }))} placeholder="Enter zone" />
        <FormField label="Priority" value={form.priority || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, priority: text }))} placeholder="Hot/Warm/Cold" />
        <View style={styles.textAreaContainer}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={styles.textArea} value={form.remarks || ''} onChangeText={(text: string) => setForm((f: any) => ({ ...f, remarks: text }))} placeholder="Enter remarks" multiline numberOfLines={4} />
        </View>
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Update Lead</Text>}
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

