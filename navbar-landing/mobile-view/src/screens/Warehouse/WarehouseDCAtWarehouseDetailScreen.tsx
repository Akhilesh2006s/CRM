import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function WarehouseDCAtWarehouseDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const [dc, setDc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    dcDate: '',
    dcRemarks: '',
    dcCategory: '',
    dcNotes: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    cluster: '',
    remarks: '',
  });

  useEffect(() => {
    loadDC();
  }, [id]);

  const loadDC = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/dc/${id}`);
      setDc(data);
      const order = data.dcOrderId || {};
      setForm({
        dcDate: data.dcDate ? new Date(data.dcDate).toISOString().split('T')[0] : '',
        dcRemarks: data.dcRemarks || data.deliveryNotes || '',
        dcCategory: data.dcCategory || '',
        dcNotes: data.dcNotes || '',
        contactPerson: order.contact_person || data.customerName || '',
        contactMobile: order.contact_mobile || data.customerPhone || '',
        zone: order.zone || '',
        cluster: '',
        remarks: data.deliveryNotes || '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load DC details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    const deliverableQty = dc?.requestedQuantity ?? 0;
    setProcessing(true);
    try {
      await apiService.post(`/dc/${id}/warehouse-process`, {
        availableQuantity: dc?.requestedQuantity ?? deliverableQty,
        deliverableQuantity: deliverableQty,
        remarks: form.dcRemarks || form.remarks || undefined,
      });
      Alert.alert('Success', 'DC processed successfully', [
        { text: 'OK', onPress: () => navigation.navigate('WarehouseDCAtWarehouse') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process DC');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = async () => {
    setProcessing(true);
    try {
      await apiService.post(`/dc/${id}/hold`, {
        holdReason: form.remarks || form.dcRemarks || 'On hold',
      });
      Alert.alert('Success', 'DC put on hold', [
        { text: 'OK', onPress: () => navigation.navigate('WarehouseDCAtWarehouse') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to put DC on hold');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading DC details...</Text>
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
          <Text style={styles.headerTitle}>DC Details</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {dc && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{dc.customerName || dc.dcOrderId?.school_name || dc.saleId?.customerName || 'N/A'}</Text>
              <Text style={styles.infoText}>Product: {dc.product || (dc.productDetails?.[0]?.product) || dc.saleId?.product || '-'}</Text>
              <Text style={styles.infoText}>Quantity: {dc.requestedQuantity ?? dc.saleId?.quantity ?? '-'}</Text>
            </View>
            <FormField label="DC Date *" value={form.dcDate} onChangeText={(text: string) => setForm((f) => ({ ...f, dcDate: text }))} placeholder="YYYY-MM-DD" />
            <FormField label="DC Category" value={form.dcCategory} onChangeText={(text: string) => setForm((f) => ({ ...f, dcCategory: text }))} placeholder="Enter category" />
            <FormField label="Contact Person" value={form.contactPerson} onChangeText={(text: string) => setForm((f) => ({ ...f, contactPerson: text }))} placeholder="Enter contact person" />
            <FormField label="Contact Mobile" value={form.contactMobile} onChangeText={(text: string) => setForm((f) => ({ ...f, contactMobile: text }))} placeholder="Enter mobile" keyboardType="phone-pad" />
            <FormField label="Zone" value={form.zone} onChangeText={(text: string) => setForm((f) => ({ ...f, zone: text }))} placeholder="Enter zone" />
            <FormField label="Cluster" value={form.cluster} onChangeText={(text: string) => setForm((f) => ({ ...f, cluster: text }))} placeholder="Enter cluster" />
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>DC Remarks</Text>
              <TextInput style={styles.textArea} value={form.dcRemarks} onChangeText={(text: string) => setForm((f) => ({ ...f, dcRemarks: text }))} placeholder="Enter remarks" multiline numberOfLines={3} />
            </View>
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>DC Notes</Text>
              <TextInput style={styles.textArea} value={form.dcNotes} onChangeText={(text: string) => setForm((f) => ({ ...f, dcNotes: text }))} placeholder="Enter notes" multiline numberOfLines={3} />
            </View>
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput style={styles.textArea} value={form.remarks} onChangeText={(text: string) => setForm((f) => ({ ...f, remarks: text }))} placeholder="Enter remarks" multiline numberOfLines={3} />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.processButton, processing && styles.processButtonDisabled]} onPress={handleProcess} disabled={processing}>
                <LinearGradient colors={[colors.success, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                  {processing ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.buttonText}>Process DC</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.holdButton, processing && styles.holdButtonDisabled]} onPress={handleHold} disabled={processing}>
                <LinearGradient colors={[colors.warning, '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                  {processing ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.buttonText}>Hold DC</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  infoCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 20 },
  infoTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 12 },
  infoText: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 6 },
  fieldContainer: { marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginBottom: 8 },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  textAreaContainer: { marginBottom: 16 },
  textArea: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top' },
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 24 },
  processButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  processButtonDisabled: { opacity: 0.6 },
  holdButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  holdButtonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});


