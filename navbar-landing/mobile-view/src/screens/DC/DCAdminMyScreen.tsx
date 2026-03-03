import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function DCAdminMyScreen({ navigation }: any) {
  const { user } = useAuth();
  const [dcs, setDcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [selectedDC, setSelectedDC] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [poPhotoUrl, setPoPhotoUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterEmployee]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dcsData, employeesData] = await Promise.all([
        apiService.get('/dc?status=created').catch(() => []),
        apiService.get('/employees?isActive=true').catch(() => [])
      ]);

      let filtered = Array.isArray(dcsData) ? dcsData : [];
      if (filterEmployee) {
        filtered = filtered.filter((dc: any) => {
          const empId = typeof dc.employeeId === 'object' ? dc.employeeId?._id : dc.employeeId;
          return empId === filterEmployee;
        });
      }

      setDcs(filtered);
      setEmployees((Array.isArray(employeesData) ? employeesData : []).map((e: any) => ({
        _id: e._id || e.id,
        name: e.name || 'Unknown'
      })).filter((e: any) => e.name !== 'Unknown'));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openSubmitDialog = (dc: any) => {
    setSelectedDC(dc);
    setPoPhotoUrl(dc.poPhotoUrl || '');
    setRemarks('');
    setShowModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPoPhotoUrl(result.assets[0].uri);
    }
  };

  const submitPO = async () => {
    if (!selectedDC || !poPhotoUrl) {
      Alert.alert('Error', 'Please provide a PO photo');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.put(`/dc/${selectedDC._id}`, {
        poPhotoUrl,
        poDocument: poPhotoUrl,
        deliveryNotes: remarks || selectedDC.deliveryNotes
      });
      Alert.alert('Success', 'PO photo updated successfully!');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update PO photo');
    } finally {
      setSubmitting(false);
    }
  };

  const getExecutiveName = (dc: any) => {
    if (typeof dc.employeeId === 'object' && dc.employeeId?.name) {
      return dc.employeeId.name;
    }
    return 'Not Assigned';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading DCs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>All Created DCs</Text>
            <Text style={styles.headerSubtitle}>Admin View</Text>
          </View>
          <LogoutButton />
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Executive:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !filterEmployee && styles.filterChipActive]}
            onPress={() => setFilterEmployee('')}
          >
            <Text style={[styles.filterChipText, !filterEmployee && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {employees.map((emp) => (
            <TouchableOpacity
              key={emp._id}
              style={[styles.filterChip, filterEmployee === emp._id && styles.filterChipActive]}
              onPress={() => setFilterEmployee(emp._id)}
            >
              <Text style={[styles.filterChipText, filterEmployee === emp._id && styles.filterChipTextActive]}>
                {emp.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {dcs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No DCs Found</Text>
            <Text style={styles.emptySubtitle}>No created DCs match your filters</Text>
          </View>
        ) : (
          dcs.map((dc) => (
            <TouchableOpacity
              key={dc._id}
              style={styles.card}
              onPress={() => openSubmitDialog(dc)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {dc.customerName || dc.saleId?.customerName || dc.dcOrderId?.school_name || 'Unknown Customer'}
                  </Text>
                  <Text style={styles.executiveName}>{getExecutiveName(dc)}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Created</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Product:</Text>
                  <Text style={styles.infoValue}>{dc.product || dc.saleId?.product || 'N/A'}</Text>
                </View>
                {dc.createdAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Created:</Text>
                    <Text style={styles.infoValue}>{formatDate(dc.createdAt)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.viewDetailsText}>Tap to Add PO Photo →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add PO Photo</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>PO Photo URL or Upload:</Text>
              {poPhotoUrl ? (
                <Image source={{ uri: poPhotoUrl }} style={styles.previewImage} />
              ) : null}
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadButtonText}>Pick Image</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Or enter PO Photo URL"
                value={poPhotoUrl}
                onChangeText={setPoPhotoUrl}
              />
              <Text style={styles.modalLabel}>Remarks:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter remarks"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={4}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={submitPO}
                disabled={submitting || !poPhotoUrl}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textLight} />
                ) : (
                  <Text style={styles.modalButtonTextSubmit}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, marginBottom: 4 },
  headerSubtitle: { ...typography.body.small, color: colors.textLight + 'CC' },
  placeholder: { width: 40 },
  filterContainer: { padding: 16, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterLabel: { ...typography.body.small, color: colors.textSecondary, marginBottom: 8 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { ...typography.body.small, color: colors.textPrimary },
  filterChipTextActive: { color: colors.textLight },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { ...typography.heading.h2, color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...typography.body.medium, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, marginBottom: 16, padding: 16, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flex: 1 },
  customerName: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 4 },
  executiveName: { ...typography.body.small, color: colors.textSecondary },
  statusBadge: { backgroundColor: colors.info + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { ...typography.body.small, color: colors.info, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { ...typography.body.small, color: colors.textSecondary, width: 80 },
  infoValue: { ...typography.body.medium, color: colors.textPrimary, flex: 1 },
  cardFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  viewDetailsText: { ...typography.body.small, color: colors.primary, textAlign: 'right', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.heading.h2, color: colors.textPrimary },
  modalClose: { fontSize: 24, color: colors.textSecondary },
  modalBody: { padding: 20 },
  modalLabel: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 12, ...typography.body.medium, color: colors.textPrimary, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  uploadButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  uploadButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalButtonSubmit: { backgroundColor: colors.primary },
  modalButtonTextCancel: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '600' },
  modalButtonTextSubmit: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
});


