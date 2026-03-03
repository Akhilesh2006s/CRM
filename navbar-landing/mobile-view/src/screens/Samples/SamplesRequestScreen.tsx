import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBanner from '../../components/MessageBanner';
import LogoutButton from '../../components/LogoutButton';

type ProductSelection = {
  product_name: string;
  quantity: number;
};

export default function SamplesRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductSelection[]>([]);
  const [purpose, setPurpose] = useState('To show schools');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_name: '', quantity: 1 });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, productsData] = await Promise.all([
        apiService.get('/sample-requests/my').catch(() => []),
        apiService.get('/products').catch(() => [])
      ]);
      setMyRequests(Array.isArray(requestsData) ? requestsData : []);
      const prods = Array.isArray(productsData) ? productsData : [];
      setAvailableProducts(prods.map((p: any) => p.productName || '').filter(Boolean));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    if (newProduct.product_name && newProduct.quantity > 0) {
      setProducts([...products, { ...newProduct }]);
      setNewProduct({ product_name: '', quantity: 1 });
      setShowAddProductModal(false);
    }
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const submitRequest = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    if (products.length === 0) {
      setErrorMessage('Please add at least one product');
      return;
    }

    for (const product of products) {
      if (!product.product_name || !product.quantity || product.quantity < 1) {
        setErrorMessage('Please fill all product fields correctly');
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiService.post('/sample-requests', { products, purpose });
      setSuccessMessage('Sample request submitted successfully!');
      setProducts([]);
      setPurpose('To show schools');
      loadData();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return '-';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Accepted': return colors.success;
      case 'Rejected': return colors.error;
      default: return colors.warning;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Sample Requests</Text>
            <Text style={styles.headerSubtitle}>Request product samples</Text>
          </View>
          <LogoutButton />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner type="success" message={successMessage} onDismiss={clearMessages} />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Sample Request</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Purpose</Text>
            <TextInput
              style={styles.input}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. To show schools"
            />
          </View>

          <View style={styles.formSection}>
            <View style={styles.productsHeader}>
              <Text style={styles.label}>Products</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddProductModal(true)}
              >
                <Text style={styles.addButtonText}>+ Add Product</Text>
              </TouchableOpacity>
            </View>
            
            {products.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyProductsText}>No products added</Text>
              </View>
            ) : (
              products.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.product_name}</Text>
                    <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeProduct(index)}>
                    <Text style={styles.removeButton}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitRequest}
            disabled={submitting || products.length === 0}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>My Requests</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : myRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No requests yet</Text>
            </View>
          ) : (
            myRequests.map((request) => (
              <View key={request._id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestCode}>{request.request_code}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status || 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestPurpose}>{request.purpose}</Text>
                {request.products && request.products.length > 0 && (
                  <View style={styles.requestProducts}>
                    {request.products.map((p: any, idx: number) => (
                      <Text key={idx} style={styles.requestProductItem}>
                        {p.product_name} (Qty: {p.quantity})
                      </Text>
                    ))}
                  </View>
                )}
                <Text style={styles.requestDate}>Created: {formatDate(request.createdAt)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Product Name *</Text>
              <ScrollView style={styles.productsList}>
                {availableProducts.map((prod) => (
                  <TouchableOpacity
                    key={prod}
                    style={styles.productOption}
                    onPress={() => setNewProduct({ ...newProduct, product_name: prod })}
                  >
                    <Text style={styles.productOptionText}>{prod}</Text>
                    {newProduct.product_name === prod && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.modalLabel}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={String(newProduct.quantity)}
                onChangeText={(text) => setNewProduct({ ...newProduct, quantity: Number(text) || 1 })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddProductModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={addProduct}
                disabled={!newProduct.product_name || newProduct.quantity < 1}
              >
                <Text style={styles.modalButtonTextSubmit}>Add</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, marginBottom: 4 },
  headerSubtitle: { ...typography.body.small, color: colors.textLight + 'CC' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  formCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  formTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 16 },
  formSection: { marginBottom: 20 },
  label: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 12, ...typography.body.medium, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  productsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { ...typography.body.small, color: colors.textLight, fontWeight: '600' },
  emptyProducts: { padding: 20, alignItems: 'center', backgroundColor: colors.background, borderRadius: 12 },
  emptyProductsText: { ...typography.body.medium, color: colors.textSecondary },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: 12, borderRadius: 12, marginBottom: 8 },
  productInfo: { flex: 1 },
  productName: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '500' },
  productQuantity: { ...typography.body.small, color: colors.textSecondary, marginTop: 4 },
  removeButton: { fontSize: 24, color: colors.error, fontWeight: 'bold' },
  submitButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  listCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 20, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  listTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 16 },
  loader: { padding: 20 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { ...typography.body.medium, color: colors.textSecondary },
  requestCard: { backgroundColor: colors.background, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestCode: { ...typography.heading.h4, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { ...typography.body.small, fontWeight: '600' },
  requestPurpose: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 8 },
  requestProducts: { marginBottom: 8 },
  requestProductItem: { ...typography.body.small, color: colors.textSecondary, marginBottom: 4 },
  requestDate: { ...typography.body.small, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.heading.h2, color: colors.textPrimary },
  modalClose: { fontSize: 24, color: colors.textSecondary },
  modalBody: { padding: 20 },
  modalLabel: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 8, fontWeight: '600' },
  productsList: { maxHeight: 200, marginBottom: 16 },
  productOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.background, borderRadius: 8, marginBottom: 8 },
  productOptionText: { ...typography.body.medium, color: colors.textPrimary },
  checkmark: { fontSize: 18, color: colors.success },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalButtonSubmit: { backgroundColor: colors.primary },
  modalButtonTextCancel: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '600' },
  modalButtonTextSubmit: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
});


