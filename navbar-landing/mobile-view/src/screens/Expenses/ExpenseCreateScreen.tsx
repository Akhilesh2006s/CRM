import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService, getApiUrl } from '../../services/api';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

interface DcItem {
  _id: string;
  saleId?: { customerName?: string };
  dcOrderId?: { school_name?: string; school_code?: string; zone?: string };
}

const expenseTypes = ['travel', 'food', 'accommodation', 'others'];
const transportTypes = ['Auto', 'Bike', 'Bus', 'Car', 'Flight', 'Train'];

export default function ExpenseCreateScreen({ navigation }: any) {
  const [form, setForm] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    receiptNumber: '',
    remarks: '',
    // Travel-specific fields
    transportType: '',
    travelFrom: '',
    travelTo: '',
    approxKms: '',
    dcId: '',
  });
  const [dcs, setDcs] = useState<DcItem[]>([]);
  const [loadingDcs, setLoadingDcs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [billUri, setBillUri] = useState<string | null>(null);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchDcs = async () => {
      try {
        setLoadingDcs(true);
        const data = await apiService.get<DcItem[]>('/dc/employee/my');
        setDcs(Array.isArray(data) ? data : []);
      } catch {
        setDcs([]);
      } finally {
        setLoadingDcs(false);
      }
    };
    fetchDcs();
  }, []);

  const handleBillUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos to upload bills.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBillUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image: ' + (error.message || 'Unknown error'));
    }
  };

  const uploadBillFile = async (uri: string): Promise<string | null> => {
    try {
      setUploadingBill(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'bill.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('bill', {
        uri,
        name: filename,
        type,
      } as any);

      const token = await AsyncStorage.getItem('authToken');
      const baseURL = getApiUrl();
      const response = await fetch(`${baseURL}/expenses/upload-bill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload bill');
      }

      const data = await response.json();
      return data.fileUrl || null;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload bill');
      return null;
    } finally {
      setUploadingBill(false);
    }
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    clearMessages();
    if (!form.type || !form.amount || !form.date) {
      setErrorMessage('Please fill in all required fields (Type, Date, Amount).');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (form.type === 'travel') {
      if (!form.transportType || !form.travelFrom || !form.travelTo) {
        setErrorMessage('Please fill in all required travel fields (Transport Type, From, To).');
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
    }
    if (dcs.length > 0 && !form.dcId) {
      setErrorMessage('Please select a School/DC for this expense.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      // Upload bill first if present
      let receiptUrl: string | null = null;
      if (billUri) {
        receiptUrl = await uploadBillFile(billUri);
        if (!receiptUrl) {
          setSubmitting(false);
          return;
        }
      }

      const payload: any = {
        title: `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} Expense`,
        category: form.type,
        amount: parseFloat(form.amount),
        date: form.date,
        receiptNumber: form.receiptNumber || undefined,
        employeeRemarks: form.remarks || undefined,
        dcId: form.dcId || undefined,
        status: 'Pending',
      };

      // Add travel-specific fields
      if (form.type === 'travel') {
        payload.transportType = form.transportType;
        payload.travelFrom = form.travelFrom;
        payload.travelTo = form.travelTo;
        if (form.approxKms) {
          payload.approxKms = parseFloat(form.approxKms);
        }
      }

      // Add receipt URL if uploaded
      if (receiptUrl) {
        payload.receipt = receiptUrl;
      }

      await apiService.post('/expenses/create', payload);
      setSuccessMessage('Expense created successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create expense');
      setSuccessMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSubmitting(false);
    }
  };

  const isTravelType = form.type === 'travel';

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Expense</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="View My Expenses"
            onAction={() => navigation.navigate('ExpenseMy')}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        {/* Type Dropdown */}
        <DropdownField
          label="Type *"
          options={expenseTypes}
          selected={form.type}
          onSelect={(value) => setForm((f) => ({ ...f, type: value, transportType: '', travelFrom: '', travelTo: '', approxKms: '' }))}
        />

        {/* Date */}
        <FormField 
          label="Date *" 
          value={form.date} 
          onChangeText={(text) => setForm((f) => ({ ...f, date: text }))} 
          placeholder="YYYY-MM-DD" 
        />

        {/* Amount */}
        <FormField 
          label="Amount *" 
          value={form.amount} 
          onChangeText={(text) => setForm((f) => ({ ...f, amount: text }))} 
          placeholder="0.00" 
          keyboardType="decimal-pad" 
        />

        {/* Receipt Number */}
        <FormField 
          label="Receipt No." 
          value={form.receiptNumber} 
          onChangeText={(text) => setForm((f) => ({ ...f, receiptNumber: text }))} 
          placeholder="Enter receipt number" 
        />

        {/* Remarks */}
        <TextAreaField 
          label="Remarks" 
          value={form.remarks} 
          onChangeText={(text) => setForm((f) => ({ ...f, remarks: text }))} 
          placeholder="Enter remarks" 
        />

        {/* Bill Upload */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Upload Bill</Text>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleBillUpload}
            disabled={submitting || uploadingBill}
          >
            <Text style={styles.uploadButtonText}>
              {billUri ? 'Bill Selected (Tap to change)' : 'Select Bill Image'}
            </Text>
          </TouchableOpacity>
          {billUri && (
            <Text style={styles.helperText}>Bill ready to upload</Text>
          )}
          {uploadingBill && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
          )}
        </View>

        {/* Travel-specific fields - shown conditionally */}
        {isTravelType && (
          <View style={styles.travelSection}>
            <Text style={[styles.label, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>Travel Details</Text>
            
            {/* Transport Type */}
            <DropdownField
              label="Transport Type *"
              options={transportTypes}
              selected={form.transportType}
              onSelect={(value) => setForm((f) => ({ ...f, transportType: value }))}
            />

            {/* From */}
            <FormField 
              label="From *" 
              value={form.travelFrom} 
              onChangeText={(text) => setForm((f) => ({ ...f, travelFrom: text }))} 
              placeholder="Enter origin location" 
            />

            {/* To */}
            <FormField 
              label="To *" 
              value={form.travelTo} 
              onChangeText={(text) => setForm((f) => ({ ...f, travelTo: text }))} 
              placeholder="Enter destination location" 
            />

            {/* Approx Kms */}
            <FormField 
              label="Approx Kms" 
              value={form.approxKms} 
              onChangeText={(text) => setForm((f) => ({ ...f, approxKms: text }))} 
              placeholder="Enter approximate kilometers" 
              keyboardType="decimal-pad" 
            />
          </View>
        )}

        {/* School/DC Selection */}
        {dcs.length > 0 && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Select School/DC *</Text>
            {loadingDcs ? (
              <Text style={styles.helperText}>Loading schools…</Text>
            ) : (
              dcs.map((dc) => {
                const display = dc.dcOrderId?.school_name || dc.saleId?.customerName || 'School';
                return (
                  <TouchableOpacity
                    key={dc._id}
                    style={[styles.option, form.dcId === dc._id && styles.optionSelected]}
                    onPress={() => setForm((f) => ({ ...f, dcId: dc._id }))}
                  >
                    <Text style={[styles.optionText, form.dcId === dc._id && styles.optionTextSelected]}>{display}</Text>
                    {dc.dcOrderId?.school_code && <Text style={styles.helperText}>{dc.dcOrderId.school_code}</Text>}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, (submitting || uploadingBill) && styles.submitButtonDisabled]} 
          onPress={handleSubmit} 
          disabled={submitting || uploadingBill}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitButtonGradient}>
            {(submitting || uploadingBill) ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Expense</Text>
            )}
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
      <TextInput 
        style={styles.input} 
        value={value} 
        onChangeText={onChangeText} 
        placeholder={placeholder} 
        placeholderTextColor={colors.textSecondary} 
        keyboardType={keyboardType} 
      />
    </View>
  );
}

function TextAreaField({ label, value, onChangeText, placeholder }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline
      />
    </View>
  );
}

function DropdownField({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.horizontalOption, selected === option && styles.horizontalOptionSelected]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.horizontalOptionText, selected === option && styles.horizontalOptionTextSelected]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  fieldContainer: { marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginBottom: 8 },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  horizontalOptions: { flexDirection: 'row' },
  horizontalOption: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  horizontalOptionSelected: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  horizontalOptionText: { ...typography.body.medium, color: colors.textPrimary },
  horizontalOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  option: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  optionText: { ...typography.body.medium, color: colors.textPrimary },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  helperText: { ...typography.body.small, color: colors.textSecondary },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
  uploadButton: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  uploadButtonText: { ...typography.body.medium, color: colors.primary },
  travelSection: { marginTop: 8, marginBottom: 16, padding: 16, backgroundColor: colors.primary + '10', borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '30' },
});
