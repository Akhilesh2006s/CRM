import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, WebSelect, DataTable, WebLabel } from '../../ui/WebPrimitives';
import { apiService, getApiUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type UploadEntry = {
  _id: string;
  fileName: string;
  originalName: string;
  description: string;
  dataType: string;
  filePath: string;
  uploadedByName: string;
  createdAt: string;
};

const DATA_TYPES = [
  { label: 'Schools', value: 'schools' },
  { label: 'Employees', value: 'employees' },
  { label: 'Products', value: 'products' },
  { label: 'Other', value: 'other' },
];

/** Matches web `settings/upload` */
export default function SettingsUploadScreen({ navigation }: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState('other');

  const loadUploads = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/settings/uploads');
      setUploads(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load upload history');
      setUploads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access denied', 'Admin privileges required.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    loadUploads();
  }, [isAdmin]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setFile(result.assets[0]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not pick file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'upload',
        type: file.mimeType || 'application/octet-stream',
      } as any);
      formData.append('description', description);
      formData.append('dataType', dataType);
      await apiService.upload('/settings/upload', formData);
      Alert.alert('Success', 'File uploaded successfully');
      setFile(null);
      setDescription('');
      setDataType('other');
      loadUploads();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const openFile = (entry: UploadEntry) => {
    const base = getApiUrl().replace(/\/api$/, '');
    const path = entry.filePath?.startsWith('http') ? entry.filePath : `${base}${entry.filePath}`;
    Linking.openURL(path).catch(() => Alert.alert('Error', 'Could not open file'));
  };

  if (!isAdmin) {
    return (
      <ScreenShell title="Data upload">
        <PageSection title="Access denied">
          <Text>Admin privileges required.</Text>
        </PageSection>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Data upload" subtitle="Upload files and view history" loading={loading}>
      <PageSection title="Upload file">
        <WebButton
          title={file ? file.name : 'Select file'}
          variant="outline"
          onPress={pickFile}
        />
        <WebLabel>Data type</WebLabel>
        <WebSelect
          value={dataType}
          onValueChange={setDataType}
          items={DATA_TYPES}
        />
        <WebLabel>Description</WebLabel>
        <WebInput
          placeholder="Optional description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 80 }}
        />
        <WebButton title={uploading ? 'Uploading…' : 'Upload'} onPress={handleUpload} loading={uploading} disabled={uploading} />
      </PageSection>

      <PageSection title="Upload history">
        {uploads.length === 0 ? (
          <Text style={styles.empty}>No uploads yet</Text>
        ) : (
          <>
            <DataTable
              columns={['File', 'Type', 'By', 'Date']}
              rows={uploads.map((u) => [
                u.originalName || u.fileName,
                u.dataType,
                u.uploadedByName || '—',
                formatDate(u.createdAt),
              ])}
            />
            {uploads.map((u) => (
              <WebButton
                key={u._id}
                title={`Download ${u.originalName || u.fileName}`}
                variant="outline"
                onPress={() => openFile(u)}
              />
            ))}
          </>
        )}
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { ...typography.body.medium, color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
});
