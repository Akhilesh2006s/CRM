import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

const DECISION_OPTIONS = ['Approve', 'Partial Approve', 'Reject', 'Send Back'];
const STOCK_BUCKET_OPTIONS = ['Sellable', 'Damaged', 'Expired', 'QC / Hold'];

export default function StockReturnWarehouseManagerReviewScreen({ navigation, route }: any) {
  const returnId = route?.params?.returnId as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [returnDoc, setReturnDoc] = useState<any>(null);
  const [productDecisions, setProductDecisions] = useState<Array<{
    product: string;
    returnQty: number;
    receivedQty: number;
    condition?: string;
    managerDecision: string;
    approvedQty: string;
    stockBucket: string;
    managerRemark: string;
  }>>([]);
  const [managerRemarks, setManagerRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!returnId) return;
    (async () => {
      try {
        setLoading(true);
        const doc = await apiService.get(`/stock-returns/warehouse-manager/${returnId}`);
        setReturnDoc(doc);
        setManagerRemarks(doc.managerRemarks || '');
        setRejectionReason(doc.rejectionReason || '');
        setProductDecisions((doc.products || []).map((p: any) => ({
          product: p.product || '',
          returnQty: Number(p.returnQty) || 0,
          receivedQty: Number(p.receivedQty) || 0,
          condition: p.condition,
          managerDecision: p.managerDecision || '',
          approvedQty: String(p.approvedQty ?? (p.managerDecision === 'Approve' ? p.receivedQty : p.managerDecision === 'Partial Approve' ? '' : '0')),
          stockBucket: p.stockBucket || '',
          managerRemark: p.managerRemark || '',
        })));
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load return');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [returnId, navigation]);

  const updateDecision = (index: number, field: string, value: string | number) => {
    setProductDecisions((prev) => {
      const next = [...prev];
      const p = next[index];
      if (!p) return prev;
      (p as any)[field] = value;
      if (field === 'managerDecision') {
        if (value === 'Approve') {
          p.approvedQty = String(p.receivedQty);
          if (!p.stockBucket) p.stockBucket = 'Sellable';
        } else if (value === 'Reject' || value === 'Send Back') {
          p.approvedQty = '0';
          p.stockBucket = '';
        } else if (value === 'Partial Approve' && !p.approvedQty) p.approvedQty = '';
      }
      return next;
    });
  };

  const canApprove = productDecisions.length > 0 && productDecisions.every((p) => {
    if (p.managerDecision === 'Approve' || p.managerDecision === 'Partial Approve') {
      const q = parseInt(p.approvedQty, 10);
      return p.stockBucket && !isNaN(q) && q > 0 && q <= p.receivedQty;
    }
    if (p.managerDecision === 'Reject' || p.managerDecision === 'Send Back') return true;
    return false;
  });
  const allDecided = productDecisions.length > 0 && productDecisions.every((p) => p.managerDecision);

  const submitAction = async (action: 'approve' | 'reject' | 'send_back') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      Alert.alert('Validation', 'Please enter rejection reason.');
      return;
    }
    if (action === 'approve' && (!allDecided || !canApprove)) {
      Alert.alert('Validation', 'Set decision, approved qty and stock bucket for each product. Approved/Partial must have qty ≤ received.');
      return;
    }
    setSubmitting(true);
    try {
      const products = productDecisions.map((p) => ({
        product: p.product,
        managerDecision: p.managerDecision,
        approvedQty: (p.managerDecision === 'Approve' || p.managerDecision === 'Partial Approve') ? (parseInt(p.approvedQty, 10) || 0) : 0,
        stockBucket: (p.managerDecision === 'Approve' || p.managerDecision === 'Partial Approve') ? p.stockBucket : '',
        managerRemark: p.managerRemark || '',
      }));
      await apiService.put(`/stock-returns/${returnId}/manager-action`, {
        action,
        products,
        managerRemarks: managerRemarks.trim() || undefined,
        rejectionReason: action === 'reject' ? (rejectionReason.trim() || managerRemarks) : undefined,
      });
      if (action === 'approve') Alert.alert('Done', 'Return approved. Stock updated.');
      else if (action === 'reject') Alert.alert('Done', 'Return rejected.');
      else Alert.alert('Done', 'Sent back to warehouse for re-verification.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const totalApprovedValue = 0; // Optional: could fetch Warehouse unitPrice by product and sum
  const writeOffAmount = 0;
  const returnToVendorAmount = 0;

  if (loading || !returnDoc) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const products = returnDoc.products || [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review return</Text>
          <LogoutButton />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Read-only: Executive request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive request (read-only)</Text>
          <Text style={styles.readOnlyLabel}>Return ID</Text>
          <Text style={styles.readOnlyValue}>{returnDoc.returnId || returnDoc._id}</Text>
          <Text style={styles.readOnlyLabel}>Customer</Text>
          <Text style={styles.readOnlyValue}>{returnDoc.customerName || '—'}</Text>
          <Text style={styles.readOnlyLabel}>Invoice / Sale ID</Text>
          <Text style={styles.readOnlyValue}>{returnDoc.saleId || '—'}</Text>
          <Text style={styles.readOnlyLabel}>Executive remarks</Text>
          <Text style={styles.readOnlyValue}>{returnDoc.executiveRemarks || '—'}</Text>
          <Text style={styles.readOnlyLabel}>Products requested</Text>
          {products.map((p: any, i: number) => (
            <Text key={i} style={styles.readOnlySmall}>{p.product} — Qty: {p.returnQty}, Reason: {p.reason || '—'}</Text>
          ))}
        </View>

        {/* Read-only: Warehouse verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse verification (read-only)</Text>
          {products.map((p: any, i: number) => (
            <View key={i} style={styles.readOnlyBlock}>
              <Text style={styles.readOnlyValue}>{p.product}: Received {p.receivedQty}, Condition: {p.condition || '—'}</Text>
              {p.batchLot && <Text style={styles.readOnlySmall}>Batch: {p.batchLot}</Text>}
              {p.quantityMismatch && <Text style={styles.warningText}>Mismatch: {p.mismatchRemark || '—'}</Text>}
            </View>
          ))}
        </View>

        {/* Photos */}
        {((returnDoc.evidencePhotos && returnDoc.evidencePhotos.length) || (returnDoc.warehousePhotos && returnDoc.warehousePhotos.length)) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {returnDoc.evidencePhotos && returnDoc.evidencePhotos.length > 0 && (
              <>
                <Text style={styles.readOnlyLabel}>Executive photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {returnDoc.evidencePhotos.map((url: string, i: number) => (
                    <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
                  ))}
                </ScrollView>
              </>
            )}
            {returnDoc.warehousePhotos && returnDoc.warehousePhotos.length > 0 && (
              <>
                <Text style={styles.readOnlyLabel}>Warehouse photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {returnDoc.warehousePhotos.map((url: string, i: number) => (
                    <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        {/* Decision per product */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision per product</Text>
          {productDecisions.map((p, index) => (
            <View key={index} style={styles.decisionBlock}>
              <Text style={styles.productName}>{p.product} (received: {p.receivedQty})</Text>
              <Text style={styles.label}>Decision</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={p.managerDecision}
                  onValueChange={(v) => updateDecision(index, 'managerDecision', v)}
                  style={styles.picker}
                  prompt="Decision"
                >
                  <Picker.Item label="Select" value="" />
                  {DECISION_OPTIONS.map((d) => (
                    <Picker.Item key={d} label={d} value={d} />
                  ))}
                </Picker>
              </View>
              {(p.managerDecision === 'Approve' || p.managerDecision === 'Partial Approve') && (
                <>
                  <Text style={styles.label}>Approved qty (≤ {p.receivedQty})</Text>
                  <TextInput
                    style={styles.input}
                    value={p.approvedQty}
                    onChangeText={(v) => /^\d*$/.test(v) && updateDecision(index, 'approvedQty', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.label}>Stock bucket</Text>
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={p.stockBucket}
                      onValueChange={(v) => updateDecision(index, 'stockBucket', v)}
                      style={styles.picker}
                      prompt="Bucket"
                    >
                      <Picker.Item label="Select" value="" />
                      {STOCK_BUCKET_OPTIONS.map((b) => (
                        <Picker.Item key={b} label={b} value={b} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}
              <Text style={styles.label}>Remark (optional)</Text>
              <TextInput
                style={styles.input}
                value={p.managerRemark}
                onChangeText={(v) => updateDecision(index, 'managerRemark', v)}
                placeholder="Manager remark"
              />
            </View>
          ))}
        </View>

        {/* Manager remarks (general) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manager remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={managerRemarks}
            onChangeText={setManagerRemarks}
            placeholder="Overall remarks"
            multiline
          />
        </View>

        {/* Financial impact (read-only placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impact (read-only)</Text>
          <View style={styles.impactRow}>
            <Text style={styles.readOnlyLabel}>Stock value impact</Text>
            <Text style={styles.readOnlyValue}>{totalApprovedValue !== 0 ? `₹${totalApprovedValue}` : '—'}</Text>
          </View>
          <View style={styles.impactRow}>
            <Text style={styles.readOnlyLabel}>Write-off amount</Text>
            <Text style={styles.readOnlyValue}>{writeOffAmount !== 0 ? `₹${writeOffAmount}` : '—'}</Text>
          </View>
          <View style={styles.impactRow}>
            <Text style={styles.readOnlyLabel}>Return-to-vendor (cost)</Text>
            <Text style={styles.readOnlyValue}>{returnToVendorAmount !== 0 ? `₹${returnToVendorAmount}` : '—'}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => submitAction('approve')}
            disabled={submitting || !canApprove || !allDecided}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Approve return</Text>}
          </TouchableOpacity>
          <Text style={styles.label}>Rejection reason (required for Reject)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Reason for rejection"
            multiline
          />
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => submitAction('reject')}
            disabled={submitting}
          >
            <Text style={styles.actionButtonText}>Reject return</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.sendBackButton]}
            onPress={() => submitAction('send_back')}
            disabled={submitting}
          >
            <Text style={styles.actionButtonText}>Send back to warehouse</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Send back: return appears again in warehouse exec queue for re-verification.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, ...typography.body.medium, color: colors.textSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h3, color: colors.textLight, flex: 1, textAlign: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 12 },
  readOnlyLabel: { ...typography.body.small, color: colors.textSecondary, marginBottom: 4 },
  readOnlyValue: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 8 },
  readOnlySmall: { ...typography.body.small, color: colors.textTertiary, marginBottom: 4 },
  readOnlyBlock: { backgroundColor: colors.backgroundLight, padding: 10, borderRadius: 8, marginBottom: 8 },
  warningText: { ...typography.body.small, color: colors.warning, marginTop: 4 },
  label: { ...typography.body.small, color: colors.textSecondary, marginBottom: 4 },
  input: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, ...typography.body.medium, color: colors.textPrimary, marginBottom: 8 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerWrap: { marginBottom: 8 },
  picker: { height: 44 },
  productName: { ...typography.body.medium, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  decisionBlock: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  photoRow: { flexDirection: 'row', marginBottom: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  impactRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.error },
  sendBackButton: { backgroundColor: colors.warning },
  actionButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  hint: { ...typography.body.small, color: colors.textSecondary },
});
