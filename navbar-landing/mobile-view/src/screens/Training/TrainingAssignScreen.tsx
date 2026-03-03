import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

export default function TrainingAssignScreen({ navigation }: any) {
  const [form, setForm] = useState({
    schoolCode: '',
    schoolName: '',
    zone: '',
    town: '',
    subject: '',
    trainerId: '',
    employeeId: '',
    trainingDate: '',
    term: '',
    trainingLevel: '',
    remarks: '',
  });
  const [trainers, setTrainers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const [trainersData, employeesData] = await Promise.all([
        apiService.get('/trainers?status=active'),
        apiService.get('/employees?isActive=true'),
      ]);
      setTrainers(Array.isArray(trainersData) ? trainersData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load options');
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
    if (!form.schoolName?.trim()) {
      setErrorMessage('School Name is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.trainerId?.trim()) {
      setErrorMessage('Trainer is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.trainingDate?.trim()) {
      setErrorMessage('Training Date is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.subject?.trim()) {
      setErrorMessage('Subject is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        status: 'Scheduled',
      };
      await apiService.post('/training', payload);
      setSuccessMessage('Training assigned successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to assign training');
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
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.headerTitle}>Assign Training</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="View Trainings"
            onAction={() => navigation.navigate('TrainingList')}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <FormField label="School Code" value={form.schoolCode} onChangeText={(text: string) => setForm((f) => ({ ...f, schoolCode: text }))} placeholder="Enter school code" />
        <FormField label="School Name *" value={form.schoolName} onChangeText={(text: string) => setForm((f) => ({ ...f, schoolName: text }))} placeholder="Enter school name" />
        <FormField label="Zone" value={form.zone} onChangeText={(text: string) => setForm((f) => ({ ...f, zone: text }))} placeholder="Enter zone" />
        <FormField label="Town" value={form.town} onChangeText={(text: string) => setForm((f) => ({ ...f, town: text }))} placeholder="Enter town" />
        <FormField label="Subject *" value={form.subject} onChangeText={(text: string) => setForm((f) => ({ ...f, subject: text }))} placeholder="Enter subject" />
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Trainer *</Text>
          <ScrollView style={styles.optionsContainer}>
            {trainers.map((trainer) => (
              <TouchableOpacity key={trainer._id} style={[styles.option, form.trainerId === trainer._id && styles.optionSelected]} onPress={() => setForm((f) => ({ ...f, trainerId: trainer._id }))}>
                <Text style={[styles.optionText, form.trainerId === trainer._id && styles.optionTextSelected]}>{trainer.name || trainer.email}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Employee</Text>
          <ScrollView style={styles.optionsContainer}>
            {employees.map((emp) => (
              <TouchableOpacity key={emp._id} style={[styles.option, form.employeeId === emp._id && styles.optionSelected]} onPress={() => setForm((f) => ({ ...f, employeeId: emp._id }))}>
                <Text style={[styles.optionText, form.employeeId === emp._id && styles.optionTextSelected]}>{emp.name || emp.email}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <FormField label="Training Date *" value={form.trainingDate} onChangeText={(text: string) => setForm((f) => ({ ...f, trainingDate: text }))} placeholder="YYYY-MM-DD" />
        <FormField label="Term" value={form.term} onChangeText={(text: string) => setForm((f) => ({ ...f, term: text }))} placeholder="Enter term" />
        <FormField label="Training Level" value={form.trainingLevel} onChangeText={(text: string) => setForm((f) => ({ ...f, trainingLevel: text }))} placeholder="Enter level" />
        <View style={styles.textAreaContainer}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={styles.textArea} value={form.remarks} onChangeText={(text: string) => setForm((f) => ({ ...f, remarks: text }))} placeholder="Enter remarks" multiline numberOfLines={4} />
        </View>
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Assign Training</Text>}
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
  optionsContainer: { maxHeight: 150 },
  option: { padding: 12, marginBottom: 8, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  optionSelected: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  optionText: { ...typography.body.medium, color: colors.textPrimary },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  textAreaContainer: { marginBottom: 16 },
  textArea: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top' },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});


