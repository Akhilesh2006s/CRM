import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function ReturnsWarehouseExecutiveScreen({ navigation }: any) {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/stock-returns/warehouse-executive/queue');
      setReturns(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load returns');
      setReturns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReturns();
    }, [loadReturns])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReturns();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.headerTitle}>Returns to Verify</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {returns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No returns in queue. Status: Submitted</Text>
          </View>
        ) : (
          returns.map((r) => (
            <TouchableOpacity
              key={r._id}
              style={styles.card}
              onPress={() => navigation.navigate('StockReturnWarehouseVerify', { returnId: r._id })}
              activeOpacity={0.8}
            >
              <Text style={styles.cardReturnId}>{r.returnId || `#${r.returnNumber}`}</Text>
              <Text style={styles.cardLabel}>Customer</Text>
              <Text style={styles.cardValue}>{r.customerName || '—'}</Text>
              <Text style={styles.cardLabel}>Executive</Text>
              <Text style={styles.cardValue}>
                {r.executiveName || (r.executiveId && (r.executiveId as any).name) || '—'}
              </Text>
              <Text style={styles.cardLabel}>Expected qty</Text>
              <Text style={styles.cardValue}>{r.totalQuantity ?? r.totalItems ?? '—'}</Text>
              <Text style={styles.cardLabel}>Return type</Text>
              <Text style={styles.cardValue}>{r.returnType || '—'}</Text>
              <View style={styles.cardStatus}>
                <Text style={styles.cardStatusText}>Status: {r.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center', fontSize: 18 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { ...typography.body.medium, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardReturnId: { ...typography.heading.h3, color: colors.primary, marginBottom: 12 },
  cardLabel: { ...typography.body.small, color: colors.textSecondary, marginTop: 6, marginBottom: 2 },
  cardValue: { ...typography.body.medium, color: colors.textPrimary },
  cardStatus: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  cardStatusText: { ...typography.body.small, color: colors.info, fontWeight: '600' },
});
