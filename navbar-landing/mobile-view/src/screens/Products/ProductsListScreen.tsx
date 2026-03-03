import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProductsListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '0'>('all');

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'Super Admin')) {
      loadData();
    } else {
      Alert.alert('Access Denied', 'Admin privileges required', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      let endpoint = '/products';
      if (statusFilter !== 'all') {
        endpoint += `?status=${statusFilter}`;
      }
      const data = await apiService.get(endpoint);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filtered = products.filter((p) => p.productName?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
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
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductNew')} style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View style={styles.filterContainer}>
        <TextInput style={styles.searchInput} value={searchTerm} onChangeText={setSearchTerm} placeholder="Search products..." placeholderTextColor={colors.textSecondary} />
        <View style={styles.filterTabs}>
          {(['all', '1', '0'] as const).map((filterType) => (
            <TouchableOpacity key={filterType} style={[styles.filterTab, statusFilter === filterType && styles.filterTabActive]} onPress={() => setStatusFilter(filterType)}>
              <Text style={[styles.filterTabText, statusFilter === filterType && styles.filterTabTextActive]}>{filterType === 'all' ? 'All' : filterType === '1' ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          filtered.map((product) => (
            <View key={product._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{product.productName || 'N/A'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: product.prodStatus === 1 ? colors.success + '20' : colors.textSecondary + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: product.prodStatus === 1 ? colors.success : colors.textSecondary }]}>{product.prodStatus === 1 ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Levels:</Text>
                  <Text style={styles.infoValue}>{(product.productLevels || []).join(', ') || '-'}</Text>
                </View>
                {product.hasSubjects && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Subjects:</Text>
                    <Text style={styles.infoValue}>{(product.subjects || []).join(', ') || '-'}</Text>
                  </View>
                )}
                {product.hasSpecs && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Specs:</Text>
                    <Text style={styles.infoValue}>{Array.isArray(product.specs) ? product.specs.join(', ') : product.specs || '-'}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  filterContainer: { backgroundColor: colors.backgroundLight, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { ...typography.body.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary, marginBottom: 12 },
  filterTabs: { flexDirection: 'row', gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { ...typography.label.medium, color: colors.textSecondary },
  filterTabTextActive: { color: colors.textLight, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  productName: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { ...typography.label.small, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { ...typography.body.medium, color: colors.textSecondary, width: 100 },
  infoValue: { ...typography.body.medium, color: colors.textPrimary, flex: 1 },
});


