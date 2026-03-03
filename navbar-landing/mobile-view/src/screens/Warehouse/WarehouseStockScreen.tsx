import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, Alert, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';

export default function WarehouseStockScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/warehouse');
      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load stock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openAddQty = (item: any) => {
    setSelectedItem(item);
    setQuantity('');
    setModalVisible(true);
  };

  const submitAddQty = async () => {
    if (!selectedItem) return;
    const amount = parseFloat(quantity);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.post('/warehouse/stock', {
        productId: selectedItem._id,
        quantity: amount,
        movementType: 'In',
        reason: 'Manual add',
      });
      Alert.alert('Success', 'Quantity added successfully');
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add quantity');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((i) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [i.productName, i.category, i.level, i.itemType].filter(Boolean).some((v) => v!.toString().toLowerCase().includes(q));
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading stock...</Text>
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
          <Text style={styles.headerTitle}>Inventory Qty List</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WarehouseStockAdd')} style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search products..." placeholderTextColor={colors.textSecondary} />
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No stock items found</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{item.productName || 'N/A'}</Text>
                <View style={[styles.stockBadge, { backgroundColor: (item.currentStock || 0) > 0 ? colors.success + '20' : colors.warning + '20' }]}>
                  <Text style={[styles.stockBadgeText, { color: (item.currentStock || 0) > 0 ? colors.success : colors.warning }]}>
                    Stock: {item.currentStock || 0}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category:</Text>
                  <Text style={styles.infoValue}>{item.category || '-'}</Text>
                </View>
                {item.level && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Level:</Text>
                    <Text style={styles.infoValue}>{item.level}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.addQtyButton} onPress={() => openAddQty(item)}>
                <Text style={styles.addQtyButtonText}>Add Quantity</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Quantity</Text>
            <Text style={styles.modalSubtitle}>{selectedItem?.productName || 'Item'}</Text>
            <TextInput style={styles.modalInput} value={quantity} onChangeText={setQuantity} placeholder="Enter quantity" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitButton, submitting && styles.modalSubmitButtonDisabled]} onPress={submitAddQty} disabled={submitting}>
                {submitting ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.modalSubmitButtonText}>Add</Text>}
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
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  searchContainer: { padding: 16, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { ...typography.body.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary },
  content: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stockBadgeText: { ...typography.label.small, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { ...typography.body.medium, color: colors.textSecondary, width: 100 },
  infoValue: { ...typography.body.medium, color: colors.textPrimary, flex: 1 },
  addQtyButton: { paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
  addQtyButtonText: { ...typography.label.medium, color: colors.textLight, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { ...typography.heading.h2, color: colors.textPrimary, marginBottom: 8 },
  modalSubtitle: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 20 },
  modalInput: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.backgroundLight, alignItems: 'center' },
  modalCancelButtonText: { ...typography.label.medium, color: colors.textPrimary, fontWeight: '600' },
  modalSubmitButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  modalSubmitButtonDisabled: { opacity: 0.6 },
  modalSubmitButtonText: { ...typography.label.medium, color: colors.textLight, fontWeight: '600' },
});


