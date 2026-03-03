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
  Modal,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../context/AuthContext';

const TERM_OPTIONS = ['Term 1', 'Term 2', 'Both'];

type ProductDetail = {
  id: string;
  product: string;
  class: string;
  fromClass?: string;
  toClass?: string;
  category: string;
  quantity: number;
  strength: number;
  price: number;
  total: number;
  level: string;
  specs: string;
  subject?: string;
  term?: string;
  isParentRow?: boolean;
  sameRateForAllClasses?: boolean;
  selectedSubjects?: string[];
  selectedSpecs?: string[];
};

export default function LeadCloseScreen({ navigation, route }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [poPhotoUrl, setPoPhotoUrl] = useState<string>('');
  const [uploadingPO, setUploadingPO] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [pickingFor, setPickingFor] = useState<{id: string, field: 'fromClass' | 'toClass'} | null>(null);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [loadedAsDcOrder, setLoadedAsDcOrder] = useState(false);

  const [form, setForm] = useState({
    school_name: '',
    contact_person: '',
    email: '',
    contact_mobile: '',
    contact_person2: '',
    contact_mobile2: '',
    delivery_date: '',
    year: '2025-26',
  });

  const availableClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const availableCategories = ['New Students', 'Existing Students', 'Both'];
  const availableYears = ['2024-25', '2025-26', '2026-27', '2027-28'];

  useEffect(() => {
    loadLead();
    loadProducts();
  }, [id]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      // Use /products/active first (no auth required, works for executives; /products requires Admin)
      let data: any;
      try {
        data = await apiService.get('/products/active');
      } catch (err: any) {
        // Fallback to /products for admin users if /active fails
        try {
          data = await apiService.get('/products');
        } catch (err2: any) {
          console.error('Failed to load products:', err2?.message || err2);
          throw err2;
        }
      }
      
      // Handle different response structures
      let productsList: any[] = [];
      if (Array.isArray(data)) {
        productsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        productsList = data.data;
      } else if (data?.products && Array.isArray(data.products)) {
        productsList = data.products;
      }
      
      console.log('Products list after parsing:', productsList.length, 'products');
      
      // Filter for active products - be more lenient with the filter
      // Only filter if prodStatus exists and is explicitly 0 or false
      const activeProducts = productsList.filter((p: any) => {
        // If prodStatus exists, check it's not 0 or false
        if (p.prodStatus !== undefined && p.prodStatus !== null) {
          return p.prodStatus !== 0 && p.prodStatus !== false && p.prodStatus !== '0';
        }
        // If status exists, check it's not 0 or false
        if (p.status !== undefined && p.status !== null) {
          return p.status !== 0 && p.status !== false && p.status !== '0';
        }
        // If no status field, include it (assume active)
        return true;
      });
      
      console.log('Active products after filtering:', activeProducts.length);
      
      // If no products after filtering, show all products (maybe they don't have status field)
      const finalProducts = activeProducts.length > 0 ? activeProducts : productsList;
      
      setProducts(finalProducts);
      
      if (finalProducts.length === 0) {
        console.warn('No products found at all');
        Alert.alert('Info', 'No products found. Please ensure products are created in the system.');
      } else {
        console.log('Successfully loaded', finalProducts.length, 'products');
      }
    } catch (error: any) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', `Failed to load products: ${error.message || 'Unknown error'}\n\nPlease check your connection and try again.`);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadLead = async () => {
    try {
      setLoading(true);
      setLoadedAsDcOrder(false);
      let data: any;
      try {
        data = await apiService.get(`/dc-orders/${id}`);
        if (data) setLoadedAsDcOrder(true);
      } catch (err: any) {
        data = await apiService.get(`/leads/${id}`);
      }
      
      if (data) {
        setLead(data);
        const deliveryDate = data.estimated_delivery_date 
          ? new Date(data.estimated_delivery_date).toISOString().split('T')[0]
          : '';
        setForm({
          school_name: data.school_name || '',
          contact_person: data.contact_person || '',
          email: data.email || '',
          contact_mobile: data.contact_mobile || '',
          contact_person2: data.decision_maker || data.contact_person2 || '',
          contact_mobile2: data.contact_mobile2 || '',
          delivery_date: deliveryDate,
          year: '2025-26',
        });
        
        // Pre-fill products if they exist
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          const validProducts = data.products
            .map((p: any) => p.product_name || p.product || p)
            .filter((name: string) => typeof name === 'string' && name.trim())
            .map((name: string) => name.trim());
          setSelectedProducts(validProducts);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load lead');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getProductLevels = (productName: string): string[] => {
    const product = products.find((p: any) => p.productName === productName);
    return product?.productLevels || ['L1'];
  };

  const getDefaultLevel = (productName: string): string => {
    const levels = getProductLevels(productName);
    return levels[0] || 'L1';
  };

  const getProductSpecs = (productName: string): string[] => {
    const product = products.find((p: any) => p.productName === productName);
    if (product?.hasSpecs && product.specs) {
      return Array.isArray(product.specs) ? product.specs : [product.specs];
    }
    return ['Regular'];
  };

  const getProductSubjects = (productName: string): string[] => {
    const product = products.find((p: any) => p.productName === productName);
    if (product?.hasSubjects && product.subjects) {
      return Array.isArray(product.subjects) ? product.subjects : [];
    }
    return [];
  };

  const hasProductSubjects = (productName: string): boolean => {
    const product = products.find((p: any) => p.productName === productName);
    return product?.hasSubjects === true && product?.subjects && Array.isArray(product.subjects) && product.subjects.length > 0;
  };

  const addProductWithSpec = (product: string) => {
    if (!selectedProducts.includes(product)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    
    const parentId = Date.now().toString() + Math.random().toString();
    const productSpecs = getProductSpecs(product);
    const newRow: ProductDetail = {
      id: parentId,
      product: product,
      class: '1',
      fromClass: '1',
      toClass: '10',
      category: lead?.school_type === 'Existing' ? 'Existing Students' : 'New Students',
      quantity: 1,
      strength: 0,
      price: 0,
      total: 0,
      level: getDefaultLevel(product),
      specs: 'Regular',
      term: 'Term 1',
      isParentRow: true,
      sameRateForAllClasses: false,
      selectedSubjects: [],
      selectedSpecs: productSpecs.length > 0 ? productSpecs : ['Regular'],
    };
    
    setProductDetails([...productDetails, newRow]);
    
    setTimeout(() => {
      generateRowsFromRange(parentId, '1', '10');
    }, 0);
  };

  const generateRowsFromRange = (parentId: string, fromClass: string, toClass: string) => {
    setProductDetails(currentDetails => {
      const parentRow = currentDetails.find(p => p.id === parentId);
      if (!parentRow || !parentRow.isParentRow) return currentDetails;
      
      const from = parseInt(fromClass) || 1;
      const to = parseInt(toClass) || 10;
      const selectedSpecs = parentRow.selectedSpecs || [];
      const specsToUse = selectedSpecs.length > 0 ? selectedSpecs : ['Regular'];
      const selectedSubjects = parentRow.selectedSubjects || [];
      const hasSubjects = hasProductSubjects(parentRow.product) && selectedSubjects.length > 0;
      const subjectsToUse = hasSubjects ? selectedSubjects : [undefined];
      
      const otherParentRows = currentDetails.filter(p => p.isParentRow && p.id !== parentId);
      const otherChildRows = currentDetails.filter(p => !p.isParentRow && !p.id.startsWith(parentId + '_'));
      
      const newRows: ProductDetail[] = [];
      for (let classNum = from; classNum <= to; classNum++) {
        specsToUse.forEach((spec, specIdx) => {
          // Create one row per class × spec combination
          // Combine all selected subjects into a single string or use first subject
          const subjectDisplay = hasSubjects && selectedSubjects.length > 0 
            ? selectedSubjects.join(', ') 
            : undefined;
          newRows.push({
            id: parentId + '_' + classNum + '_' + specIdx,
            product: parentRow.product,
            class: classNum.toString(),
            category: parentRow.category,
            quantity: 1,
            strength: 0,
            price: 0,
            total: 0,
            level: parentRow.level,
            specs: spec,
            subject: subjectDisplay,
            term: parentRow.term || 'Term 1',
            isParentRow: false,
            sameRateForAllClasses: false,
          });
        });
      }
      
      const updatedParent = { ...parentRow, fromClass, toClass };
      return [...otherParentRows, updatedParent, ...otherChildRows, ...newRows];
    });
  };

  const updateProductDetail = (id: string, field: string, value: any) => {
    setProductDetails(currentDetails => {
      const rowToUpdate = currentDetails.find(p => p.id === id);
      if (!rowToUpdate) {
        console.warn('Row not found for update:', id);
        return currentDetails;
      }
      
      const updated = { ...rowToUpdate, [field]: value };
      
      // Handle From/To class changes on parent rows - regenerate rows immediately
      if (rowToUpdate.isParentRow && (field === 'fromClass' || field === 'toClass' || field === 'selectedSubjects' || field === 'selectedSpecs')) {
        // Update the parent row first
        const updatedDetails = currentDetails.map(p => p.id === id ? updated : p);
        
        // Regenerate rows with the new values after state update
        setTimeout(() => {
          const fromClass = field === 'fromClass' ? value : (updated.fromClass || '1');
          const toClass = field === 'toClass' ? value : (updated.toClass || '10');
          console.log('Regenerating rows for', id, 'from', fromClass, 'to', toClass);
          generateRowsFromRange(id, fromClass, toClass);
        }, 150);
        
        return updatedDetails;
      }
      
      if (field === 'price' || field === 'strength') {
        updated.total = (Number(updated.strength) || 0) * (Number(updated.price) || 0);
        
        // If this is a child row and sameRateForAllClasses is enabled for this product/spec/level combo
        // Apply to both PRICE and STRENGTH for all classes
        if (!rowToUpdate.isParentRow && (field === 'price' || field === 'strength')) {
          const parentRow = currentDetails.find(p => 
            p.isParentRow && 
            p.product === rowToUpdate.product &&
            p.id === rowToUpdate.id.split('_')[0]
          );
          
          if (parentRow?.sameRateForAllClasses) {
            // Update price or strength for all rows with same product, class, and level
            // This applies the same value across all specs for that class
            return currentDetails.map(p => {
              if (!p.isParentRow && 
                  p.product === updated.product && 
                  p.class === updated.class && 
                  p.level === updated.level) {
                const newStrength = field === 'strength' ? value : p.strength;
                const newPrice = field === 'price' ? value : p.price;
                return {
                  ...p,
                  strength: newStrength, // Apply same strength to all specs of this class
                  price: newPrice, // Apply same price to all specs of this class
                  total: (Number(newStrength) || 0) * (Number(newPrice) || 0) // Recalculate total
                };
              }
              if (p.id === id) return updated;
              return p;
            });
          }
        }
      }
      
      return currentDetails.map(p => p.id === id ? updated : p);
    });
  };

  const removeProductDetail = (id: string) => {
    const rowToRemove = productDetails.find(p => p.id === id);
    
    if (rowToRemove?.isParentRow) {
      setProductDetails(productDetails.filter(p => 
        p.id !== id && !p.id.startsWith(id + '_')
      ));
      setSelectedProducts(selectedProducts.filter(p => p !== rowToRemove.product));
    } else {
      setProductDetails(productDetails.filter(p => p.id !== id));
    }
  };

  const pickPOPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file type - only PDFs
        if (!file.mimeType || file.mimeType !== 'application/pdf') {
          Alert.alert('Error', 'Please upload a PDF file only');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be less than 5MB');
          return;
        }
        
        setUploadingPO(true);
        try {
          // Upload to backend
          const formData = new FormData();
          formData.append('poPhoto', {
            uri: file.uri,
            type: 'application/pdf',
            name: file.name || 'po.pdf',
          } as any);
          
          // Store the URI for display
          setPoPhotoUrl(file.uri);
          Alert.alert('Success', 'PO document selected');
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to process PO document');
        } finally {
          setUploadingPO(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick document');
    }
  };

  const handleTurnToClient = async () => {
    if (!lead || !user?._id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    const actualProductDetails = productDetails.filter(pd => !pd.isParentRow);
    
    if (actualProductDetails.length === 0) {
      Alert.alert('Error', 'Please add at least one product and set class range to generate rows');
      return;
    }
    
    const invalidProducts = actualProductDetails.filter(p => !p.product || p.strength == null || p.strength === '' || p.price == null);
    if (invalidProducts.length > 0) {
      Alert.alert('Error', 'Please fill in Quantity (Strength) * and Unit Price * for all product rows');
      return;
    }
    
    if (!form.delivery_date?.trim()) {
      Alert.alert('Error', 'Delivery date is required');
      return;
    }
    
    if (!poPhotoUrl || poPhotoUrl.trim() === '') {
      Alert.alert('Error', 'PO document is required. Please upload a PDF file.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const assignedEmployeeId = user._id;
      // Use loadedAsDcOrder so we never call convert-to-client with a DcOrder id (which would 404). Lead → convert-to-client; DcOrder → PUT dc-orders.
      const isDcOrder = loadedAsDcOrder;
      
      // Per spec: Close (Won) → record moves to My Clients only. Closed Sales happens only after Request DC.
      if (isDcOrder) {
        let podProofUrl = poPhotoUrl;
        if (poPhotoUrl && (poPhotoUrl.startsWith('file://') || !poPhotoUrl.startsWith('http'))) {
          try {
            const formData = new FormData();
            formData.append('poPhoto', { uri: poPhotoUrl, type: 'application/pdf', name: 'po.pdf' } as any);
            const uploadRes = await apiService.upload('/dc/upload-po', formData);
            podProofUrl = uploadRes.poPhotoUrl || uploadRes.url || poPhotoUrl;
          } catch (uploadErr: any) {
            Alert.alert('Error', uploadErr?.message || 'Failed to upload PO.');
            setSubmitting(false);
            return;
          }
        }
        const updatePayload: any = {
          school_name: form.school_name || lead?.school_name,
          contact_person: form.contact_person || lead?.contact_person,
          contact_mobile: form.contact_mobile || lead?.contact_mobile,
          email: form.email || lead?.email,
          contact_person2: form.contact_person2,
          contact_mobile2: form.contact_mobile2,
          estimated_delivery_date: new Date(form.delivery_date).toISOString(),
          assigned_to: assignedEmployeeId,
          products: actualProductDetails.map(p => ({
            product_name: p.product,
            quantity: p.strength,
            unit_price: p.price,
          })),
          status: 'saved',
        };
        if (podProofUrl) updatePayload.pod_proof_url = podProofUrl;
        await apiService.put(`/dc-orders/${id}`, updatePayload);
        Alert.alert('Success', 'Lead converted to client. You can request DC from My Clients when ready.', [
          { text: 'OK', onPress: () => navigation.navigate('DCClient') },
        ]);
        return;
      }
      
      // Lead: convert to client (DcOrder with status 'saved') — no DC raised yet
      let podProofUrl = poPhotoUrl;
      if (poPhotoUrl && (poPhotoUrl.startsWith('file://') || !poPhotoUrl.startsWith('http'))) {
        try {
          const formData = new FormData();
          formData.append('poPhoto', {
            uri: poPhotoUrl,
            type: 'application/pdf',
            name: 'po.pdf',
          } as any);
          const uploadRes = await apiService.upload('/dc/upload-po', formData);
          podProofUrl = uploadRes.poPhotoUrl || uploadRes.url || poPhotoUrl;
        } catch (uploadErr: any) {
          Alert.alert('Error', uploadErr?.message || 'Failed to upload PO. Please try again.');
          setSubmitting(false);
          return;
        }
      }
      
      const productsPayload = actualProductDetails.map(p => ({
        product_name: p.product,
        quantity: Number(p.strength) || 1,
        unit_price: Number(p.price) || 0,
      }));
      await apiService.post(`/leads/${id}/convert-to-client`, {
        school_name: form.school_name || lead?.school_name,
        contact_person: form.contact_person || lead?.contact_person,
        contact_mobile: form.contact_mobile || lead?.contact_mobile,
        email: form.email || lead?.email,
        contact_person2: form.contact_person2,
        contact_mobile2: form.contact_mobile2,
        zone: lead?.zone,
        school_type: lead?.school_type,
        estimated_delivery_date: form.delivery_date ? new Date(form.delivery_date).toISOString() : undefined,
        products: productsPayload,
        pod_proof_url: podProofUrl,
      });
      
      Alert.alert('Success', 'Lead converted to client. You can request DC from My Clients when ready.', [
        { text: 'OK', onPress: () => navigation.navigate('DCClient') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to convert lead to client');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading lead...</Text>
      </View>
    );
  }

  const actualProductDetails = productDetails.filter(pd => !pd.isParentRow);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Close Lead</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <FormField label="School Name *" value={form.school_name} onChangeText={(text: string) => setForm({ ...form, school_name: text })} placeholder="Enter school name" />
        <FormField label="Person 1 *" value={form.contact_person} onChangeText={(text: string) => setForm({ ...form, contact_person: text })} placeholder="Enter contact person" />
        <FormField label="Email 1" value={form.email} onChangeText={(text: string) => setForm({ ...form, email: text })} placeholder="Enter email" keyboardType="email-address" />
        <FormField label="Mob 1 *" value={form.contact_mobile} onChangeText={(text: string) => setForm({ ...form, contact_mobile: text })} placeholder="Enter mobile" keyboardType="phone-pad" />
        <FormField label="Decision Maker" value={form.contact_person2} onChangeText={(text: string) => setForm({ ...form, contact_person2: text })} placeholder="Enter decision maker name" />
        <FormField label="Email" value={form.contact_mobile2} onChangeText={(text: string) => setForm({ ...form, contact_mobile2: text })} placeholder="Enter decision maker email" keyboardType="email-address" />
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Delivery Date *</Text>
          <TouchableOpacity
            style={styles.dateTouchable}
            onPress={() => setShowDeliveryDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateTouchableText, !form.delivery_date && styles.datePlaceholder]}>
              {form.delivery_date || 'Tap to pick date'}
            </Text>
            <Text style={styles.dateCalendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
        {showDeliveryDatePicker && (
          <Modal visible transparent animationType="slide">
            <TouchableOpacity
              style={styles.datePickerOverlay}
              activeOpacity={1}
              onPress={() => setShowDeliveryDatePicker(false)}
            />
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Delivery Date</Text>
                <TouchableOpacity onPress={() => setShowDeliveryDatePicker(false)}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={form.delivery_date ? new Date(form.delivery_date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                minimumDate={new Date()}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setForm((f) => ({
                      ...f,
                      delivery_date: selectedDate.toISOString().split('T')[0],
                    }));
                    if (Platform.OS === 'android') {
                      setShowDeliveryDatePicker(false);
                    }
                  }
                }}
                style={Platform.OS === 'ios' ? styles.datePickerIos : undefined}
              />
            </View>
          </Modal>
        )}

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Select Year *</Text>
          <Picker
            selectedValue={form.year}
            onValueChange={(itemValue) => setForm({ ...form, year: itemValue })}
            style={styles.picker}
          >
            {availableYears.map(year => (
              <Picker.Item key={year} label={year} value={year} />
            ))}
          </Picker>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>PO Document *</Text>
          {poPhotoUrl ? (
            <View style={styles.poPhotoContainer}>
              <View style={[styles.poPhoto, { backgroundColor: colors.errorLight, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.error }}>PDF</Text>
              </View>
              <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPoPhotoUrl('')}>
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickPOPhoto} disabled={uploadingPO}>
              <Text style={styles.uploadButtonText}>{uploadingPO ? 'Uploading...' : '📄 Upload PO Document (PDF)'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.addProductsButton} onPress={() => setShowProductModal(true)}>
          <Text style={styles.addProductsButtonText}>📦 ADD PRODUCTS {actualProductDetails.length > 0 && `(${actualProductDetails.length})`}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
          onPress={handleTurnToClient} 
          disabled={submitting}
        >
          <LinearGradient colors={[colors.success, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitButtonGradient}>
            {submitting ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.submitButtonText}>✅ Turn Lead to Client</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Products & Details</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Product Selection */}
              <View style={styles.productSelectionContainer}>
                <Text style={styles.sectionTitle}>Add Products</Text>
                {loadingProducts ? (
                  <View style={styles.productsLoadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.productsLoadingText}>Loading products...</Text>
                  </View>
                ) : products.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyText}>No products available</Text>
                    <Text style={styles.emptySubtext}>Please contact admin to add products</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={loadProducts}>
                      <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView style={styles.productList}>
                    {products.map((product: any) => {
                      const productName = product.productName || product.name || product.product || 'Unknown';
                      return (
                        <TouchableOpacity
                          key={product._id || product.id || productName}
                          style={styles.productItem}
                          onPress={() => addProductWithSpec(productName)}
                        >
                          <Text style={styles.productItemText}>{productName}</Text>
                          <Text style={styles.productItemAdd}>+ Add</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Product Range Configuration */}
              {productDetails.filter(pd => pd.isParentRow).length > 0 && (
                <View style={styles.rangeConfigContainer}>
                  <Text style={styles.sectionTitle}>Set Class Range for Products</Text>
                  {productDetails
                    .filter(pd => pd.isParentRow)
                    .map((pd) => {
                      const productSubjects = getProductSubjects(pd.product);
                      const hasSubjects = hasProductSubjects(pd.product);
                      const selectedSubjects = pd.selectedSubjects || [];
                      const productSpecs = getProductSpecs(pd.product);
                      const selectedSpecs = pd.selectedSpecs || productSpecs;
                      
                      return (
                        <View key={pd.id} style={styles.parentRowContainer}>
                          <View style={styles.parentRowHeader}>
                            <Text style={styles.parentRowProduct}>{pd.product}</Text>
                            <TouchableOpacity onPress={() => removeProductDetail(pd.id)}>
                              <Text style={styles.removeButton}>✕</Text>
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.rangeControls}>
                            <View style={styles.rangeControl}>
                              <Text style={styles.rangeLabel}>From:</Text>
                              <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => {
                                  setPickingFor({ id: pd.id, field: 'fromClass' });
                                  setShowClassPicker(true);
                                }}
                              >
                                <Text style={styles.dropdownButtonText}>{pd.fromClass || '1'}</Text>
                                <Text style={styles.dropdownArrow}>▼</Text>
                              </TouchableOpacity>
                            </View>
                            
                            <View style={styles.rangeControl}>
                              <Text style={styles.rangeLabel}>To:</Text>
                              <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => {
                                  setPickingFor({ id: pd.id, field: 'toClass' });
                                  setShowClassPicker(true);
                                }}
                              >
                                <Text style={styles.dropdownButtonText}>{pd.toClass || '10'}</Text>
                                <Text style={styles.dropdownArrow}>▼</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.subjectsContainer}>
                            <Text style={styles.subjectsLabel}>Select Specs:</Text>
                            <View style={styles.checkboxList}>
                              {productSpecs && productSpecs.length > 0 ? (
                                productSpecs.map((spec) => {
                                  const isSelected = selectedSpecs.includes(spec);
                                  return (
                                    <TouchableOpacity
                                      key={spec}
                                      style={styles.checkboxItem}
                                      onPress={() => {
                                        const newSpecs = isSelected
                                          ? selectedSpecs.filter(s => s !== spec)
                                          : [...selectedSpecs, spec];
                                        updateProductDetail(pd.id, 'selectedSpecs', newSpecs);
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected
                                      ]}>
                                        {isSelected && (
                                          <Text style={styles.checkboxCheck}>✓</Text>
                                        )}
                                      </View>
                                      <Text style={styles.checkboxLabel}>{spec}</Text>
                                    </TouchableOpacity>
                                  );
                                })
                              ) : (
                                <Text style={styles.emptyText}>No specs available</Text>
                              )}
                            </View>
                          </View>

                          {hasSubjects && productSubjects.length > 0 && (
                            <View style={styles.subjectsContainer}>
                              <Text style={styles.subjectsLabel}>Select Subjects:</Text>
                              <View style={styles.subjectsList}>
                                {productSubjects.map((subject) => (
                                  <TouchableOpacity
                                    key={subject}
                                    style={[
                                      styles.subjectChip,
                                      selectedSubjects.includes(subject) && styles.subjectChipSelected
                                    ]}
                                    onPress={() => {
                                      const newSubjects = selectedSubjects.includes(subject)
                                        ? selectedSubjects.filter(s => s !== subject)
                                        : [...selectedSubjects, subject];
                                      updateProductDetail(pd.id, 'selectedSubjects', newSubjects);
                                    }}
                                  >
                                    <Text style={[
                                      styles.subjectChipText,
                                      selectedSubjects.includes(subject) && styles.subjectChipTextSelected
                                    ]}>
                                      {subject}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              )}

              {/* Product Details Table */}
              {actualProductDetails.length > 0 && (
                <View style={styles.detailsTableContainer}>
                  <Text style={styles.sectionTitle}>Product Details ({actualProductDetails.length} rows)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={styles.tableWrapper}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colProduct]}>Product</Text>
                        <Text style={[styles.tableHeaderText, styles.colClass]}>Class</Text>
                        <Text style={[styles.tableHeaderText, styles.colCategory]}>Category</Text>
                        <Text style={[styles.tableHeaderText, styles.colSpecs]}>Specs</Text>
                        <Text style={[styles.tableHeaderText, styles.colSubject]}>Subject</Text>
                        <Text style={[styles.tableHeaderText, styles.colStrength]}>Quantity (Strength) *</Text>
                        <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price *</Text>
                        <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                        <Text style={[styles.tableHeaderText, styles.colLevel]}>Level</Text>
                        <Text style={[styles.tableHeaderText, styles.colTerm]}>Term</Text>
                        <Text style={[styles.tableHeaderText, styles.colAction]}>Action</Text>
                      </View>
                      {actualProductDetails.map((pd) => (
                        <View key={pd.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.colProduct]} numberOfLines={1}>{pd.product}</Text>
                          <Text style={[styles.tableCell, styles.colClass]}>{pd.class}</Text>
                          <View style={[styles.tableCell, styles.tdPickerWrap, styles.colCategory]}>
                            <Picker
                              selectedValue={pd.category}
                              onValueChange={(v) => updateProductDetail(pd.id, 'category', v)}
                              style={styles.tablePicker}
                              color="#111827"
                            >
                              {availableCategories.map(c => (
                                <Picker.Item key={c} label={c} value={c} />
                              ))}
                            </Picker>
                          </View>
                          <Text style={[styles.tableCell, styles.colSpecs]} numberOfLines={1}>{pd.specs}</Text>
                          <Text style={[styles.tableCell, styles.colSubject]} numberOfLines={1}>{pd.subject || '-'}</Text>
                          <TextInput
                            style={[styles.tableInput, styles.colStrength]}
                            value={pd.strength.toString()}
                            onChangeText={(text) => updateProductDetail(pd.id, 'strength', Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                          <TextInput
                            style={[styles.tableInput, styles.colPrice]}
                            value={pd.price.toString()}
                            onChangeText={(text) => updateProductDetail(pd.id, 'price', Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                          <Text style={[styles.tableCell, styles.colTotal]}>{pd.total ?? (Number(pd.strength) || 0) * (Number(pd.price) || 0)}</Text>
                          <View style={[styles.tableCell, styles.tdPickerWrap, styles.colLevel]}>
                            <Picker
                              selectedValue={pd.level}
                              onValueChange={(v) => updateProductDetail(pd.id, 'level', v)}
                              style={styles.tablePicker}
                              color="#111827"
                            >
                              {getProductLevels(pd.product).map(l => (
                                <Picker.Item key={l} label={l} value={l} />
                              ))}
                            </Picker>
                          </View>
                          <View style={[styles.tableCell, styles.tdPickerWrap, styles.colTerm]}>
                            <Picker
                              selectedValue={pd.term || 'Term 1'}
                              onValueChange={(v) => updateProductDetail(pd.id, 'term', v)}
                              style={styles.tablePicker}
                              color="#111827"
                            >
                              {TERM_OPTIONS.map(t => (
                                <Picker.Item key={t} label={t} value={t} />
                              ))}
                            </Picker>
                          </View>
                          <View style={[styles.tableCell, styles.colAction]}>
                            <TouchableOpacity onPress={() => removeProductDetail(pd.id)}>
                              <Text style={styles.removeButton}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <View style={styles.tableFooter}>
                        <View style={styles.tableFooterRow}>
                          <Text style={styles.tableFooterLabel}>Total Strength:</Text>
                          <Text style={styles.tableFooterValue}>
                            {actualProductDetails.reduce((sum, pd) => sum + (Number(pd.strength) || 0), 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowProductModal(false)}>
                <Text style={styles.modalButtonText}>Done ({actualProductDetails.length} products)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Class Picker Dropdown Modal */}
      <Modal visible={showClassPicker} transparent animationType="fade" onRequestClose={() => setShowClassPicker(false)}>
        <View style={styles.classPickerOverlay}>
          <TouchableOpacity 
            style={styles.classPickerOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowClassPicker(false);
              setPickingFor(null);
            }}
          />
          <View style={styles.classPickerContainer}>
            <View style={styles.classPickerHeader}>
              <Text style={styles.classPickerTitle}>
                Select {pickingFor?.field === 'fromClass' ? 'From' : 'To'} Class
              </Text>
              <TouchableOpacity onPress={() => {
                setShowClassPicker(false);
                setPickingFor(null);
              }}>
                <Text style={styles.classPickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.classPickerList} showsVerticalScrollIndicator={true}>
              {availableClasses.map((classNum) => {
                const currentValue = pickingFor?.field === 'fromClass' 
                  ? productDetails.find(p => p.id === pickingFor?.id)?.fromClass
                  : productDetails.find(p => p.id === pickingFor?.id)?.toClass;
                const isSelected = currentValue === classNum;
                
                return (
                  <TouchableOpacity
                    key={classNum}
                    style={[styles.classPickerItem, isSelected && styles.classPickerItemSelected]}
                    onPress={() => {
                      if (pickingFor) {
                        console.log('Selecting class:', classNum, 'for', pickingFor.field, 'of product', pickingFor.id);
                        // Update immediately using the updateProductDetail function
                        updateProductDetail(pickingFor.id, pickingFor.field, classNum);
                      }
                      // Close modal after a small delay to ensure state updates
                      setTimeout(() => {
                        setShowClassPicker(false);
                        setPickingFor(null);
                      }, 100);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.classPickerItemText, isSelected && styles.classPickerItemTextSelected]}>
                      Class {classNum}
                    </Text>
                    {isSelected && (
                      <Text style={styles.classPickerCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  fieldContainer: { marginBottom: 16 },
  label: { ...typography.label.medium, color: colors.textPrimary, marginBottom: 8 },
  input: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary },
  dateTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  dateTouchableText: { ...typography.body.medium, color: colors.textPrimary },
  datePlaceholder: { color: colors.textSecondary },
  dateCalendarIcon: { fontSize: 20 },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContainer: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerTitle: { ...typography.heading.h3, color: colors.textPrimary },
  datePickerDone: { ...typography.label.medium, color: colors.primary, fontWeight: '600' },
  datePickerIos: { height: 200 },
  picker: { height: 50, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  uploadButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  uploadButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  poPhotoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  poPhoto: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  removePhotoButton: { backgroundColor: colors.error, borderRadius: 8, padding: 8 },
  removePhotoText: { ...typography.body.small, color: colors.textLight },
  addProductsButton: { backgroundColor: colors.info, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  addProductsButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.heading.h2, color: colors.textPrimary },
  modalClose: { fontSize: 24, color: colors.textSecondary },
  modalBody: { padding: 20, maxHeight: 600 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  modalButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  modalButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  productSelectionContainer: { marginBottom: 20 },
  sectionTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 12 },
  productList: { maxHeight: 200, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 8 },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  productItemText: { ...typography.body.medium, color: colors.textPrimary, flex: 1 },
  productItemAdd: { ...typography.body.small, color: colors.primary, fontWeight: '600' },
  productsLoadingContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  productsLoadingText: { ...typography.body.small, color: colors.textSecondary, marginTop: 8 },
  emptyContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  emptySubtext: { ...typography.body.small, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  refreshButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  refreshButtonText: { ...typography.body.small, color: colors.textLight, fontWeight: '600' },
  rangeConfigContainer: { marginBottom: 20 },
  parentRowContainer: { backgroundColor: colors.background, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  parentRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  parentRowProduct: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '600' },
  rangeControls: { flexDirection: 'row', marginBottom: 12 },
  rangeControl: { flex: 1, marginRight: 8 },
  rangeLabel: { ...typography.body.small, color: colors.textSecondary, marginBottom: 4 },
  dropdownButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: colors.backgroundLight, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    padding: 12,
    height: 44,
  },
  dropdownButtonText: { ...typography.body.medium, color: colors.textPrimary },
  dropdownArrow: { ...typography.body.small, color: colors.textSecondary, marginLeft: 8 },
  classPickerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  classPickerOverlayTouchable: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  classPickerContainer: { backgroundColor: colors.backgroundLight, borderRadius: 16, width: '80%', maxWidth: 400, maxHeight: '70%', zIndex: 1000, elevation: 5 },
  classPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  classPickerTitle: { ...typography.heading.h3, color: colors.textPrimary },
  classPickerClose: { fontSize: 24, color: colors.textSecondary, padding: 4 },
  classPickerList: { maxHeight: 400 },
  classPickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.backgroundLight },
  classPickerItemSelected: { backgroundColor: colors.primary + '15' },
  classPickerItemText: { ...typography.body.medium, color: colors.textPrimary },
  classPickerItemTextSelected: { color: colors.primary, fontWeight: '600' },
  classPickerCheck: { fontSize: 18, color: colors.primary, fontWeight: 'bold' },
  subjectsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  subjectsLabel: { ...typography.body.small, color: colors.textSecondary, marginBottom: 8 },
  subjectsList: { flexDirection: 'row', flexWrap: 'wrap' },
  subjectChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
  subjectChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  subjectChipText: { ...typography.body.small, color: colors.textPrimary },
  subjectChipTextSelected: { color: colors.textLight },
  checkboxList: { flexDirection: 'column', marginTop: 8, paddingVertical: 4 },
  checkboxItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderWidth: 2, 
    borderColor: '#6B7280', 
    borderRadius: 4, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
  },
  checkboxSelected: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary,
  },
  checkboxCheck: { 
    fontSize: 14, 
    color: colors.textLight, 
    fontWeight: 'bold',
  },
  checkboxLabel: { 
    ...typography.body.medium, 
    color: colors.textPrimary, 
    flex: 1,
  },
  detailsTableContainer: { marginBottom: 20 },
  tableWrapper: { minWidth: 1160 },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.background, padding: 8, borderBottomWidth: 2, borderBottomColor: colors.border, alignItems: 'center' },
  tableHeaderText: { ...typography.body.small, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, padding: 8, alignItems: 'center', minHeight: 50 },
  tableCell: { ...typography.body.small, color: colors.textPrimary, textAlign: 'center', justifyContent: 'center', paddingVertical: 4 },
  colProduct: { width: 120, paddingHorizontal: 4 },
  colClass: { width: 60, paddingHorizontal: 4 },
  colCategory: { width: 120, paddingHorizontal: 4 },
  colSpecs: { width: 100, paddingHorizontal: 4 },
  colSubject: { width: 100, paddingHorizontal: 4 },
  colStrength: { width: 80, paddingHorizontal: 4 },
  colPrice: { width: 80, paddingHorizontal: 4 },
  colTotal: { width: 80, paddingHorizontal: 4 },
  colLevel: { width: 80, paddingHorizontal: 4 },
  colTerm: { width: 88, paddingHorizontal: 4 },
  colAction: { width: 60, paddingHorizontal: 4 },
  tableInput: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 6, textAlign: 'center', fontSize: 12, height: 32, color: colors.textPrimary },
  tablePicker: { height: 32, width: '100%', color: '#111827', backgroundColor: colors.backgroundLight, fontSize: 14 },
  tdPickerWrap: { backgroundColor: colors.backgroundLight },
  tableFooter: { flexDirection: 'column', padding: 12, backgroundColor: colors.background, borderTopWidth: 2, borderTopColor: colors.border },
  tableFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tableFooterLabel: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '600' },
  tableFooterValue: { ...typography.body.medium, color: colors.primary, fontWeight: '600' },
  removeButton: { fontSize: 18, color: colors.error, fontWeight: 'bold' },
});
