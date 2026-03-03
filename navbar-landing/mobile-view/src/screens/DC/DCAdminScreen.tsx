import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';

type DCEmployee =
  | {
      _id?: string;
      name?: string;
      email?: string;
    }
  | string
  | null
  | undefined;

type DCItem = {
  _id: string;
  saleId?: {
    _id: string;
    customerName?: string;
    product?: string;
    quantity?: number;
  };
  dcOrderId?: {
    _id: string;
    school_name?: string;
    contact_person?: string;
    contact_mobile?: string;
    email?: string;
    products?: any;
  };
  customerName?: string;
  customerPhone?: string;
  product?: string;
  status?: string;
  poPhotoUrl?: string;
  createdAt?: string;
  employeeId?: DCEmployee;
  deliveryNotes?: string;
};

type EmployeeOption = {
  _id: string;
  name: string;
};

export default function DCAdminScreen({ navigation }: any) {
  const [items, setItems] = useState<DCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDC, setSelectedDC] = useState<DCItem | null>(null);
  const [poPhotoUrl, setPoPhotoUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, [filterEmployee]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadDCs(), loadEmployees()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDCs = async () => {
    try {
      const data = await apiService.get('/dc?status=created');
      const list: DCItem[] = Array.isArray(data) ? data : [];

      if (!filterEmployee) {
        setItems(list);
        return;
      }

      const filtered = list.filter((dc) => {
        const empId =
          typeof dc.employeeId === 'object'
            ? dc.employeeId?._id
            : typeof dc.employeeId === 'string'
            ? dc.employeeId
            : undefined;
        return empId === filterEmployee;
      });

      setItems(filtered);
    } catch (error: any) {
      console.error('Failed to load DCs:', error);
      Alert.alert('Error', error.message || 'Failed to load DCs');
      setItems([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await apiService.get('/employees?isActive=true');
      const list = Array.isArray(data) ? data : [];
      const mapped: EmployeeOption[] = list
        .map((u: any) => ({
          _id: u._id || u.id,
          name: u.name || 'Unknown',
        }))
        .filter((e) => e._id && e.name !== 'Unknown');
      setEmployees(mapped);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const getExecutiveName = (dc: DCItem) => {
    if (typeof dc.employeeId === 'object' && dc.employeeId?.name) {
      return dc.employeeId.name;
    }
    return 'Not Assigned';
  };

  const getCustomerName = (dc: DCItem) =>
    dc.customerName ||
    dc.saleId?.customerName ||
    dc.dcOrderId?.school_name ||
    '-';

  const getCustomerPhone = (dc: DCItem) =>
    dc.customerPhone || dc.dcOrderId?.contact_mobile || '-';

  const getProductText = (dc: DCItem) => {
    if (dc.product) return dc.product;
    if (dc.saleId?.product) return dc.saleId.product;

    const products = dc.dcOrderId?.products;
    if (Array.isArray(products) && products.length > 0) {
      return products
        .map((p: any) => p.product_name || p.product || '')
        .filter(Boolean)
        .join(', ');
    }
    return '-';
  };

  const getStatusColors = (status?: string) => {
    if (status === 'created') {
      return { bg: '#DBEAFE', text: '#1D4ED8' };
    }
    if (status === 'po_submitted') {
      return { bg: '#FEF3C7', text: '#B45309' };
    }
    return { bg: '#E5E7EB', text: '#374151' };
  };

  const openModal = (dc: DCItem) => {
    setSelectedDC(dc);
    setPoPhotoUrl(dc.poPhotoUrl || '');
    setRemarks('');
    setModalVisible(true);
  };

  const submitPO = async () => {
    if (!selectedDC || !poPhotoUrl) {
      Alert.alert(
        'Missing Information',
        'Please enter a PO photo URL before submitting.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiService.put(`/dc/${selectedDC._id}`, {
        poPhotoUrl,
        poDocument: poPhotoUrl,
        deliveryNotes: remarks || selectedDC.deliveryNotes,
      });
      Alert.alert('Success', 'PO photo updated successfully!');
      setModalVisible(false);
      loadDCs();
    } catch (error: any) {
      console.error('Failed to update PO photo:', error);
      Alert.alert('Error', error.message || 'Failed to update PO photo');
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = 'All Created DCs - Admin View';

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
      <LinearGradient
        colors={gradients.primary as any}
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle}>
              Admin view of all created DCs
            </Text>
          </View>
          <TouchableOpacity onPress={loadAll} style={styles.refreshButton}>
            <Text style={styles.refreshText}>⟳</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter by Executive */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Executive:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterEmployee && styles.filterChipActive,
            ]}
            onPress={() => setFilterEmployee('')}
          >
            <Text
              style={[
                styles.filterChipText,
                !filterEmployee && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {employees.map((emp) => (
            <TouchableOpacity
              key={emp._id}
              style={[
                styles.filterChip,
                filterEmployee === emp._id && styles.filterChipActive,
              ]}
              onPress={() => setFilterEmployee(emp._id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterEmployee === emp._id && styles.filterChipTextActive,
                ]}
              >
                {emp.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          items.length === 0 ? styles.emptyContentContainer : undefined
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>
              No DCs found with status "created"
            </Text>
            <Text style={styles.emptySubtitle}>
              DCs are automatically created when a deal is created and assigned
              to an employee.
            </Text>
          </View>
        ) : (
          items.map((dc) => {
            const statusColors = getStatusColors(dc.status);
            return (
              <View key={dc._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardTitle}>{getCustomerName(dc)}</Text>
                    <Text style={styles.cardSubtitle}>
                      Executive: {getExecutiveName(dc)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusColors.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: statusColors.text },
                      ]}
                    >
                      {dc.status || 'created'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>
                      {getCustomerPhone(dc)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Product:</Text>
                    <Text style={styles.infoValue}>{getProductText(dc)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Created:</Text>
                    <Text style={styles.infoValue}>
                      {dc.createdAt
                        ? new Date(dc.createdAt).toLocaleDateString()
                        : '-'}
                    </Text>
                  </View>
                </View>

                <View style={styles.photoRow}>
                  <Text style={styles.infoLabel}>PO Photo:</Text>
                  {dc.poPhotoUrl ? (
                    <Image
                      source={{ uri: dc.poPhotoUrl }}
                      style={styles.photoThumb}
                    />
                  ) : (
                    <Text style={styles.noPhotoText}>No photo</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => openModal(dc)}
                >
                  <Text style={styles.primaryButtonText}>
                    {dc.poPhotoUrl ? 'Update Photo' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDC?.poPhotoUrl ? 'Update' : 'Add'} Purchase Order (PO){' '}
              Photo
            </Text>
            <Text style={styles.modalSubtitle}>
              {getCustomerName(selectedDC || ({} as DCItem))}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://example.com/po.jpg"
              placeholderTextColor={colors.textSecondary}
              value={poPhotoUrl}
              onChangeText={setPoPhotoUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Remarks (optional)"
              placeholderTextColor={colors.textSecondary}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmit,
                  (!poPhotoUrl || submitting) && styles.modalSubmitDisabled,
                ]}
                onPress={submitPO}
                disabled={!poPhotoUrl || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textLight} />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {selectedDC?.poPhotoUrl ? 'Update Photo' : 'Add Photo'}
                  </Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    ...typography.body.medium,
    color: colors.textSecondary,
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
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    ...typography.heading.h2,
    color: colors.textLight,
  },
  headerSubtitle: {
    ...typography.body.small,
    color: colors.textLight + 'CC',
    marginTop: 4,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  refreshText: {
    fontSize: 20,
    color: colors.textLight,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  filterLabel: {
    ...typography.body.small,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterChips: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.body.small,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.heading.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.body.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    ...typography.heading.h3,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.body.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    ...typography.label.small,
    textTransform: 'capitalize',
  },
  cardBody: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    ...typography.body.small,
    color: colors.textSecondary,
    width: 80,
  },
  infoValue: {
    ...typography.body.small,
    color: colors.textPrimary,
    flex: 1,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  photoThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noPhotoText: {
    ...typography.body.small,
    color: colors.textTertiary,
    marginLeft: 8,
  },
  primaryButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.label.medium,
    color: colors.textLight,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    ...typography.heading.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.body.small,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    ...typography.body.medium,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  modalTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.label.medium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSubmitDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    ...typography.label.medium,
    color: colors.textLight,
    fontWeight: '600',
  },
});

