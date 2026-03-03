import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../context/AuthContext';

export default function DCClientScreen({ navigation }: any) {
  const { user } = useAuth();
  const [dcs, setDcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDC, setSelectedDC] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load on mount and whenever screen comes into focus (e.g. after closing a lead so new client appears)
  useFocusEffect(
    useCallback(() => {
      loadDCs();
    }, [])
  );

  const loadDCs = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/dc/employee/my');
      const dataArray = Array.isArray(data) ? data : [];
      setDcs(dataArray);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDCs();
  };

  const openDCModal = (dc: any) => {
    setSelectedDC(dc);
    setShowModal(true);
  };

  const getOrderId = (dc: any) => {
    if (dc._isConvertedLead && dc._id) return dc._id;
    const o = dc.dcOrderId;
    if (!o) return null;
    return typeof o === 'object' && o._id ? o._id : o;
  };

  const canRequestDC = (dc: any) => {
    const orderStatus = dc.dcOrderId?.status;
    if (orderStatus === 'dc_requested' || orderStatus === 'dc_accepted' || orderStatus === 'dc_approved' || orderStatus === 'dc_sent_to_senior') return false;
    const poChange = dc.dcOrderId?.poChangeRequest;
    if (poChange && poChange.status === 'PENDING_MANAGER_APPROVAL') return false;
    return true;
  };

  const isPoChangePending = (dc: any) => {
    const poChange = dc.dcOrderId?.poChangeRequest;
    return !!(poChange && poChange.status === 'PENDING_MANAGER_APPROVAL');
  };

  // NOT in DC Flow = status is 'saved' (DC not requested). IN DC Flow = dc_requested, closed_sales, pending_dc, etc. → PO change not allowed.
  const isInDcFlow = (dc: any) => {
    const orderStatus = dc.dcOrderId?.status;
    return orderStatus != null && orderStatus !== 'saved';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return '-';
    }
  };

  const filteredDCs = dcs.filter((dc) => {
    const customerName = dc.customerName || dc.dcOrderId?.school_name || '';
    return customerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading client DCs...</Text>
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
            <Text style={styles.headerTitle}>My Clients</Text>
            <Text style={styles.headerSubtitle}>Converted clients & DC</Text>
          </View>
          <LogoutButton />
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredDCs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Clients</Text>
            <Text style={styles.emptySubtitle}>Closed leads will appear here. Request DC when ready.</Text>
          </View>
        ) : (
          filteredDCs.map((dc) => {
            const orderId = getOrderId(dc);
            const orderStatus = dc.dcOrderId?.status;
            const statusLabel = orderStatus === 'dc_requested' || orderStatus === 'dc_accepted' ? 'Requested' : orderStatus === 'saved' || dc.status === 'created' ? 'Not requested' : (dc.status || 'Created');
            const lastDcDate = dc.updatedAt || dc.deliveryDate || dc.createdAt || dc.dcOrderId?.updatedAt;
            return (
              <View key={dc._id} style={styles.card}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => openDCModal(dc)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {dc.customerName || dc.dcOrderId?.school_name || 'Unknown Customer'}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last DC:</Text>
                      <Text style={styles.infoValue}>{formatDate(lastDcDate)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Product:</Text>
                      <Text style={styles.infoValue}>{dc.product || dc.dcOrderId?.products?.[0]?.product_name || 'N/A'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {isInDcFlow(dc) ? (
                  <View style={styles.cardDcFlowMessage}>
                    <Text style={styles.cardDcFlowMessageText}>
                      PO can only be changed before requesting DC. This client is already in the DC process.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.cardButton, styles.cardButtonEdit]}
                      onPress={() => orderId && navigation.navigate('ClientEditPO', { orderId })}
                      disabled={!orderId}
                    >
                      <Text style={styles.cardButtonTextEdit}>Edit PO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardButton, styles.cardButtonRequest, !canRequestDC(dc) && styles.cardButtonDisabled]}
                      onPress={() => orderId && canRequestDC(dc) && navigation.navigate('DCRequestSummary', { orderId, client: dc })}
                      disabled={!orderId || !canRequestDC(dc)}
                    >
                      <Text style={styles.cardButtonTextRequest}>
                        {isPoChangePending(dc) ? 'Waiting for Manager Approval' : 'Request DC'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>DC Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedDC && (
                <>
                  <Text style={styles.modalLabel}>Customer: {selectedDC.customerName || selectedDC.dcOrderId?.school_name}</Text>
                  <Text style={styles.modalLabel}>Product: {selectedDC.product || 'N/A'}</Text>
                  <Text style={styles.modalLabel}>Status: {selectedDC.status || 'Created'}</Text>
                  {selectedDC.poPhotoUrl && (
                    <Image source={{ uri: selectedDC.poPhotoUrl }} style={styles.previewImage} />
                  )}
                  {selectedDC.deliveryNotes && (
                    <>
                      <Text style={styles.modalLabel}>Delivery Notes:</Text>
                      <Text style={styles.modalText}>{selectedDC.deliveryNotes}</Text>
                    </>
                  )}
                </>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Close</Text>
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
  searchContainer: { padding: 16, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { backgroundColor: colors.background, borderRadius: 12, padding: 12, ...typography.body.medium, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { ...typography.heading.h2, color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...typography.body.medium, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, marginBottom: 16, padding: 16, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  customerName: { ...typography.heading.h3, color: colors.textPrimary, flex: 1, marginRight: 12 },
  statusBadge: { backgroundColor: colors.info + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { ...typography.body.small, color: colors.info, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { ...typography.body.small, color: colors.textSecondary, width: 80 },
  infoValue: { ...typography.body.medium, color: colors.textPrimary, flex: 1 },
  cardFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  viewDetailsText: { ...typography.body.small, color: colors.primary, textAlign: 'right', fontWeight: '500' },
  cardDcFlowMessage: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 8 },
  cardDcFlowMessageText: { ...typography.body.small, color: colors.textSecondary, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  cardButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardButtonEdit: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cardButtonRequest: { backgroundColor: colors.primary },
  cardButtonDisabled: { backgroundColor: colors.textSecondary + '40', opacity: 0.8 },
  cardButtonTextEdit: { ...typography.body.small, color: colors.textPrimary, fontWeight: '600' },
  cardButtonTextRequest: { ...typography.body.small, color: colors.textLight, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.heading.h2, color: colors.textPrimary },
  modalClose: { fontSize: 24, color: colors.textSecondary },
  modalBody: { padding: 20 },
  modalLabel: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 8, fontWeight: '600' },
  modalText: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalButtonTextCancel: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '600' },
});


