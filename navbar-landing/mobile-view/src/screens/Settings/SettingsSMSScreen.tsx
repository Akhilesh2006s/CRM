import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function SettingsSMSScreen({ navigation }: any) {
  const [senderId, setSenderId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [template, setTemplate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!senderId.trim() || !apiKey.trim()) {
      Alert.alert('Error', 'Sender ID and API Key are required.');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.put('/settings/sms', { senderId, apiKey, template });
      Alert.alert('Success', 'SMS settings saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save SMS settings');
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
          <Text style={styles.headerTitle}>SMS Settings</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Sender ID *</Text>
        <TextInput style={styles.input} value={senderId} onChangeText={setSenderId} placeholder="Enter sender ID" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.label}>API Key *</Text>
        <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} placeholder="Enter SMS API key" placeholderTextColor={colors.textSecondary} secureTextEntry />
        <Text style={styles.label}>Default Template</Text>
        <TextInput
          style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
          value={template}
          onChangeText={setTemplate}
          placeholder="Enter default SMS template"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSave} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Save Settings</Text>}
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


