import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { getDocumentAsync, DocumentPickerAsset } from 'expo-document-picker'; // Requires development build
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService, getApiUrl } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function SettingsUploadScreen({ navigation }: any) {
  const [file, setFile] = useState<{ name: string } | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickFile = async () => {
    // Document picker requires a development build (not available in Expo Go)
    Alert.alert(
      'Development Build Required',
      'File picker functionality requires a custom development build. Please build the app using:\n\nnpx expo run:ios\n\nor\n\nnpx expo run:android',
      [{ text: 'OK' }]
    );
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }
    setSubmitting(true);
    try {
      // Simplified: Post metadata only; actual file upload would require FormData
      await apiService.post('/settings/upload', { fileName: file.name, description });
      Alert.alert('Success', 'File metadata uploaded.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload file info');
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
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.connectionBox}>
          <Text style={styles.connectionLabel}>API (this device)</Text>
          <Text style={styles.connectionUrl} selectable>{getApiUrl()}</Text>
          <Text style={styles.connectionHint}>If the phone can’t connect, set EXPO_PUBLIC_API_URL in .env to your laptop IP (see API_SETUP.md).</Text>
        </View>
        <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
          <Text style={styles.fileButtonText}>{file ? file.name : 'Select File'}</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description (optional)"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleUpload} disabled={submitting}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitButtonGradient}>
            {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitButtonText}>Upload</Text>}
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
  connectionBox: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  connectionLabel: { ...typography.label.small, color: colors.textSecondary, marginBottom: 6 },
  connectionUrl: { ...typography.body.medium, color: colors.primary, marginBottom: 8 },
  connectionHint: { ...typography.body.small, color: colors.textSecondary },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { padding: 20, gap: 16 },
  fileButton: { backgroundColor: colors.backgroundLight, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  fileButtonText: { ...typography.body.medium, color: colors.textPrimary },
  label: { ...typography.label.medium, color: colors.textPrimary },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});

