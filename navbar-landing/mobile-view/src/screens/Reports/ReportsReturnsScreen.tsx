import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface StockReturn {
  _id: string;
  returnNumber: string | number;
  returnDate: string;
  createdAt: string;
  createdBy?: { name?: string };
  remarks?: string;
  lrNumber?: string;
  finYear?: string;
  leadId?: { school_name?: string };
}

export default function ReportsReturnsScreen({ navigation }: any) {
  const [executiveReturns, setExecutiveReturns] = useState<StockReturn[]>([]);
  const [warehouseReturns, setWarehouseReturns] = useState<StockReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const [exec, warehouse] = await Promise.all([
        apiService.get<StockReturn[]>('/stock-returns/executive'),
        apiService.get<StockReturn[]>('/stock-returns/warehouse'),
      ]);
      setExecutiveReturns(exec || []);
      setWarehouseReturns(warehouse || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load returns');
      setExecutiveReturns([]);
      setWarehouseReturns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReturns();
  };

  const renderReturnCard = (item: StockReturn, type: 'Executive' | 'Warehouse') => (
    <View key={`${type}-${item._id}`} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.returnTitle}>
          #{item.returnNumber} • {type}
        </Text>
        <Text style={styles.dateText}>{new Date(item.returnDate).toLocaleDateString('en-IN')}</Text>
      </View>
      <Text style={styles.infoLine}>Raised By: {item.createdBy?.name || '-'}</Text>
      {type === 'Executive' ? <Text style={styles.infoLine}>School: {item.leadId?.school_name || '-'}</Text> : null}
      <Text style={styles.infoLine}>LR No: {item.lrNumber || '-'}</Text>
      <Text style={styles.infoLine}>FY: {item.finYear || '-'}</Text>
      {item.remarks ? <Text style={styles.infoLine}>Remarks: {item.remarks}</Text> : null}
      <Text style={styles.infoSmall}>Created: {new Date(item.createdAt).toLocaleString('en-IN')}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading returns...</Text>
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
          <Text style={styles.headerTitle}>Returns Report</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.sectionTitle}>Executive Returns</Text>
        {executiveReturns.length === 0 ? (
          <Text style={styles.emptyText}>No executive returns</Text>
        ) : (
          executiveReturns.map((item) => renderReturnCard(item, 'Executive'))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Warehouse Returns</Text>
        {warehouseReturns.length === 0 ? (
          <Text style={styles.emptyText}>No warehouse returns</Text>
        ) : (
          warehouseReturns.map((item) => renderReturnCard(item, 'Warehouse'))
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
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 12 },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  returnTitle: { ...typography.heading.h4, color: colors.textPrimary },
  dateText: { ...typography.body.medium, color: colors.textSecondary },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
  infoSmall: { ...typography.body.small, color: colors.textSecondary, marginTop: 6 },
  emptyText: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 12 },
});


