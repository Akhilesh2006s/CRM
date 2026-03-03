import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function SalesScreen({ navigation }: any) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/sales');
      setSales(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load sales');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSales();
  };

  const totalRevenue = sales.reduce((s, a) => s + (a.totalAmount || 0), 0);
  const pendingCount = sales.filter(s => s.status === 'Pending').length;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Sales</Text>
            <Text style={styles.headerSubtitle}>Sales Overview</Text>
          </View>
          <LogoutButton />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPink]}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>{sales.length}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAmber]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>₹{totalRevenue.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.salesCard}>
          <Text style={styles.salesTitle}>Recent Sales</Text>
          {sales.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sales yet.</Text>
            </View>
          ) : (
            sales.slice(0, 20).map((sale) => (
              <View key={sale._id} style={styles.saleItem}>
                <View style={styles.saleItemLeft}>
                  <Text style={styles.saleStatus}>{sale.status || 'Sale'}</Text>
                </View>
                <Text style={styles.saleAmount}>₹{sale.totalAmount || 0}</Text>
              </View>
            ))
          )}
        </View>
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
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, marginBottom: 4 },
  headerSubtitle: { ...typography.body.small, color: colors.textLight + 'CC' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statCardPink: { backgroundColor: '#EC4899' },
  statCardAmber: { backgroundColor: '#F59E0B' },
  statCardGreen: { backgroundColor: '#059669' },
  statLabel: { ...typography.body.small, color: colors.textLight + 'CC', marginBottom: 8 },
  statValue: { ...typography.heading.h1, color: colors.textLight },
  salesCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 20, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  salesTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 16 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { ...typography.body.medium, color: colors.textSecondary },
  saleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  saleItemLeft: { flex: 1 },
  saleStatus: { ...typography.body.medium, color: colors.textPrimary },
  saleAmount: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '600' },
});


