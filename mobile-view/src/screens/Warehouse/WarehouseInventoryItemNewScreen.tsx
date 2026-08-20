import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, WebSelect, DataTable, WebLabel } from '../../ui/WebPrimitives';
import MessageBanner from '../../components/MessageBanner';

export default function WarehouseInventoryItemNewScreen({ navigation }: any) {
  const [form, setForm] = useState({
    productName: '',
    category: '',
    level: '',
    specs: '',
    subject: '',
    quantity: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [productLevels, setProductLevels] = useState<string[]>([]);
  const [productSpecs, setProductSpecs] = useState<string[]>([]);
  const [productSubjects, setProductSubjects] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [hasSubjects, setHasSubjects] = useState(false);
  const [hasCategories, setHasCategories] = useState(false);
  const [hasSpecs, setHasSpecs] = useState(false);
  const [hasLevels, setHasLevels] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (form.productName) {
      updateProductOptions();
    }
  }, [form.productName]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateProductOptions = () => {
    const product = products.find((p) => p.productName === form.productName);
    if (product) {
      const levels = Array.isArray(product.productLevels) ? product.productLevels.filter(Boolean) : [];
      const specs =
        product.hasSpecs && Array.isArray(product.specs)
          ? product.specs.filter(Boolean)
          : product.hasSpecs && product.specs
            ? [product.specs]
            : [];
      const subjects = product.hasSubjects && Array.isArray(product.subjects) ? product.subjects.filter(Boolean) : [];
      const categories =
        product.hasCategory && Array.isArray(product.categories) ? product.categories.filter(Boolean) : [];
      setProductLevels(levels);
      setProductSpecs(specs);
      setProductSubjects(subjects);
      setProductCategories(categories);
      setHasLevels(levels.length > 0);
      setHasSpecs(specs.length > 0);
      setHasSubjects(subjects.length > 0);
      setHasCategories(categories.length > 0);

      setForm((f) => ({
        ...f,
        level: levels.includes(f.level) ? f.level : levels[0] || '',
        specs: specs.includes(f.specs) ? f.specs : specs[0] || '',
        category: categories.includes(f.category) ? f.category : categories[0] || '',
        subject: subjects.includes(f.subject) ? f.subject : '',
      }));
    }
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    clearMessages();
    if (!form.productName?.trim()) {
      setErrorMessage('Product is required');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (hasCategories && !form.category?.trim()) {
      setErrorMessage('Product Category is required for this product');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (hasLevels && !form.level?.trim()) {
      setErrorMessage('Level is required for this product');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (hasSpecs && !form.specs?.trim()) {
      setErrorMessage('Specs is required for this product');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (hasSubjects && !form.subject?.trim()) {
      setErrorMessage('Subject is required for this product');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productName: form.productName,
        category: hasCategories ? form.category : '',
        level: hasLevels ? form.level : '',
        specs: hasSpecs ? form.specs : '',
        subject: hasSubjects ? form.subject : '',
        currentStock: parseFloat(form.quantity) || 0,
      };
      await apiService.post('/warehouse', payload);
      setSuccessMessage('Item added successfully.');
      setErrorMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to add item');
      setSuccessMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <ScreenShell
      title="Add Inventory Item"
      loading={loading}
    >
<ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
        {successMessage && (
          <MessageBanner
            type="success"
            message={successMessage}
            actionLabel="View Inventory"
            onAction={() => navigation.navigate('WarehouseInventoryItems')}
          />
        )}
        {errorMessage && (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        )}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Product *</Text>
          <ScrollView style={styles.optionsContainer}>
            {products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={[styles.option, form.productName === product.productName && styles.optionSelected]}
                onPress={() => setForm((f) => ({ ...f, productName: product.productName }))}
              >
                <Text style={[styles.optionText, form.productName === product.productName && styles.optionTextSelected]}>
                  {product.productName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {form.productName && hasCategories && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Product Category *</Text>
            <ScrollView style={styles.optionsContainer}>
              {productCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.option, form.category === cat && styles.optionSelected]}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                >
                  <Text style={[styles.optionText, form.category === cat && styles.optionTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {form.productName && hasLevels && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Level *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalOptions}>
              {productLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.horizontalOption, form.level === level && styles.horizontalOptionSelected]}
                  onPress={() => setForm((f) => ({ ...f, level }))}
                >
                  <Text style={[styles.horizontalOptionText, form.level === level && styles.horizontalOptionTextSelected]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {form.productName && hasSpecs && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Specs *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalOptions}>
              {productSpecs.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[styles.horizontalOption, form.specs === spec && styles.horizontalOptionSelected]}
                  onPress={() => setForm((f) => ({ ...f, specs: spec }))}
                >
                  <Text style={[styles.horizontalOptionText, form.specs === spec && styles.horizontalOptionTextSelected]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {form.productName && hasSubjects && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Subject *</Text>
            <ScrollView style={styles.optionsContainer}>
              {productSubjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[styles.option, form.subject === subject && styles.optionSelected]}
                  onPress={() => setForm((f) => ({ ...f, subject }))}
                >
                  <Text style={[styles.optionText, form.subject === subject && styles.optionTextSelected]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <FormField label="Quantity" value={form.quantity} onChangeText={(text: string) => setForm((f) => ({ ...f, quantity: text }))} placeholder="Enter quantity" keyboardType="decimal-pad" />
        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <WebInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} />
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
  optionsContainer: { maxHeight: 200 },
  option: { padding: 12, marginBottom: 8, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  optionSelected: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  optionText: { ...typography.body.medium, color: colors.textPrimary },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  horizontalOptions: { flexDirection: 'row' },
  horizontalOption: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  horizontalOptionSelected: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  horizontalOptionText: { ...typography.body.medium, color: colors.textPrimary },
  horizontalOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { ...typography.label.large, color: colors.textLight, fontWeight: '600' },
});


