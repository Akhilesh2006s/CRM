import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function SettingsBackupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [schedule, setSchedule] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBackup = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please provide an email for backup notifications.');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.post('/settings/backup', { email, schedule });
      Alert.alert('Success', 'Backup schedule saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save backup settings');
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
          <Text style={styles.headerTitle}>Backup Settings</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Notification Email *</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter email address" placeholderTextColor={colors.textSecondary} keyboardType="email-address" />
        <Text style={styles.label}>Schedule</Text>
        <TextInput
          style={styles.input}
          value={schedule}
          onChangeText={setSchedule}
          placeholder="e.g. Daily at 10:00 AM"
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleBackup} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Save Backup Settings</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 20, gap: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});


