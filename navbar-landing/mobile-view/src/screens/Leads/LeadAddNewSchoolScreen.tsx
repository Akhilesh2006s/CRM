import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

export default function LeadAddNewSchoolScreen({ navigation }: any) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    school_type: 'New',
    school_name: '',
    contact_person: '',
    contact_mobile: '',
    email: '',
    decision_maker_name: '',
    decision_maker_mobile: '',
    location: '',
    city: '',
    address: '',
    pincode: '',
    state: '',
    region: '',
    area: '',
    priority: 'Hot',
    zone: '',
    branches: '',
    strength: '',
    remarks: '',
    average_fee: '',
    follow_up_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [areas, setAreas] = useState<Array<{ name: string; district: string }>>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-fill zone from user profile
    const loadUserZone = async () => {
      if (user?._id) {
        try {
          const userProfile = await apiService.get('/auth/me');
          const employeeZone = userProfile.assignedCity || userProfile.zone || '';
          if (employeeZone && !form.zone) {
            setForm((f) => ({ ...f, zone: employeeZone }));
          }
        } catch (err) {
          console.error('Failed to load user zone:', err);
        }
      }
    };
    loadUserZone();
  }, [user?._id]);

  const handlePincodeChange = async (pincode: string) => {
    const cleanPincode = pincode.replace(/\D/g, '').slice(0, 6);
    setForm((f) => ({ ...f, pincode: cleanPincode }));

    if (cleanPincode.length === 6) {
      setLoadingPincode(true);
      try {
        const response = await apiService.get(`/location/get-town?pincode=${cleanPincode}`);
        if (response.success && response.town) {
          setForm((f) => ({
            ...f,
            city: response.district || '',
            state: response.state || '',
            region: response.region || '',
          }));
          if (response.postOffices && response.postOffices.length > 0) {
            setAreas(response.postOffices.map((po: any) => ({
              name: po.Name,
              district: po.District,
            })));
          } else {
            setAreas([{ name: response.town, district: response.district || '' }]);
          }
        }
      } catch (err: any) {
        console.error('Pincode lookup failed:', err);
        setAreas([]);
      } finally {
        setLoadingPincode(false);
      }
    } else {
      setAreas([]);
      setForm((f) => ({ ...f, city: '', state: '', region: '', area: '' }));
    }
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    clearMessages();
    if (!form.school_name?.trim()) {
      setErrorMessage('School Name is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.contact_person?.trim()) {
      setErrorMessage('Contact Person is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.contact_mobile?.trim()) {
      setErrorMessage('Contact Mobile is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.decision_maker_name?.trim()) {
      setErrorMessage('Decision Maker Name is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.decision_maker_mobile?.trim()) {
      setErrorMessage('Decision Maker Mobile Number is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.area?.trim()) {
      setErrorMessage('Area is required. Please enter pincode and select an area.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.average_fee?.trim()) {
      setErrorMessage('Average School Fee is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.branches?.trim()) {
      setErrorMessage('No. of Branches is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.strength?.trim()) {
      setErrorMessage('School Strength is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!form.remarks?.trim()) {
      setErrorMessage('Remarks is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        status: 'Pending',
        createdBy: user?._id,
      };

      await apiService.post('/leads', payload);
      setSuccessMessage('Lead created successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create lead');
      setSuccessMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New School</Text>
          <LogoutButton />
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="View Leads"
            onAction={() => navigation.navigate('LeadsList')}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <Text style={styles.mandatoryNote}>Fields marked with * are mandatory.</Text>
        <FormField
          label="School Name *"
          value={form.school_name}
          onChangeText={(text) => setForm((f) => ({ ...f, school_name: text }))}
          placeholder="Enter school name"
        />
        <FormField
          label="Contact Person *"
          value={form.contact_person}
          onChangeText={(text) => setForm((f) => ({ ...f, contact_person: text }))}
          placeholder="Enter contact person name"
        />
        <FormField
          label="Contact Mobile *"
          value={form.contact_mobile}
          onChangeText={(text) => setForm((f) => ({ ...f, contact_mobile: text }))}
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
        />
        <FormField
          label="Decision Maker Name *"
          value={form.decision_maker_name}
          onChangeText={(text) => setForm((f) => ({ ...f, decision_maker_name: text }))}
          placeholder="Enter decision maker name"
        />
        <FormField
          label="Decision Maker Mobile *"
          value={form.decision_maker_mobile}
          onChangeText={(text) => setForm((f) => ({ ...f, decision_maker_mobile: text }))}
          placeholder="Enter decision maker mobile"
          keyboardType="phone-pad"
        />
        <FormField
          label="Location/Landmark"
          value={form.location}
          onChangeText={(text) => setForm((f) => ({ ...f, location: text }))}
          placeholder="Enter location"
        />
        <FormField
          label="Pincode"
          value={form.pincode}
          onChangeText={handlePincodeChange}
          placeholder="Enter 6-digit pincode"
          keyboardType="number-pad"
        />
        {loadingPincode && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Looking up pincode...</Text>
          </View>
        )}
        {areas.length > 0 && (
          <View style={styles.areaContainer}>
            <Text style={styles.label}>Select Area *</Text>
            {areas.map((area, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.areaOption,
                  form.area === area.name && styles.areaOptionSelected,
                ]}
                onPress={() => setForm((f) => ({ ...f, area: area.name }))}
              >
                <Text
                  style={[
                    styles.areaOptionText,
                    form.area === area.name && styles.areaOptionTextSelected,
                  ]}
                >
                  {area.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <FormField
          label="City"
          value={form.city}
          onChangeText={(text) => setForm((f) => ({ ...f, city: text }))}
          placeholder="City (auto-filled from pincode)"
          editable={false}
        />
        <FormField
          label="State"
          value={form.state}
          onChangeText={(text) => setForm((f) => ({ ...f, state: text }))}
          placeholder="State (auto-filled from pincode)"
          editable={false}
        />
        <FormField
          label="Zone"
          value={form.zone}
          onChangeText={(text) => setForm((f) => ({ ...f, zone: text }))}
          placeholder="Enter zone"
        />
        <FormField
          label="Priority"
          value={form.priority}
          onChangeText={(text) => setForm((f) => ({ ...f, priority: text }))}
          placeholder="Hot/Warm/Cold"
        />
        <FormField
          label="No. of Branches *"
          value={form.branches}
          onChangeText={(text) => setForm((f) => ({ ...f, branches: text }))}
          placeholder="Enter number of branches"
          keyboardType="number-pad"
        />
        <FormField
          label="School Strength *"
          value={form.strength}
          onChangeText={(text) => setForm((f) => ({ ...f, strength: text }))}
          placeholder="Enter total strength"
          keyboardType="number-pad"
        />
        <FormField
          label="Average School Fee *"
          value={form.average_fee}
          onChangeText={(text) => setForm((f) => ({ ...f, average_fee: text }))}
          placeholder="Enter average fee"
          keyboardType="number-pad"
        />
        <View style={styles.textAreaContainer}>
          <Text style={styles.label}>Remarks *</Text>
          <TextInput
            style={styles.textArea}
            value={form.remarks}
            onChangeText={(text) => setForm((f) => ({ ...f, remarks: text }))}
            placeholder="Enter remarks"
            multiline
            numberOfLines={4}
          />
        </View>
        <FormField
          label="Follow-up Date"
          value={form.follow_up_date}
          onChangeText={(text) => setForm((f) => ({ ...f, follow_up_date: text }))}
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.submitButtonText}>Create Lead</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
}: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.heading.h1,
    color: colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  mandatoryNote: {
    ...typography.body.small,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    ...typography.label.medium,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    ...typography.body.medium,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    ...typography.body.medium,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    ...typography.body.small,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  areaContainer: {
    marginBottom: 16,
  },
  areaOption: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  areaOptionText: {
    ...typography.body.medium,
    color: colors.textPrimary,
  },
  areaOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.label.large,
    color: colors.textLight,
    fontWeight: '600',
  },
});


