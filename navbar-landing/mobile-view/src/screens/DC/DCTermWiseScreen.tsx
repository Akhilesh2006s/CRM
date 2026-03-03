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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function DCTermWiseScreen({ navigation }: any) {
  const [dcs, setDcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadDCs();
    }, [])
  );

  const loadDCs = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/dc?status=scheduled_for_later');
      const arr = Array.isArray(data) ? data : (data?.data ?? []);
      const termWiseOnly = (arr as any[]).filter((d: any) => d.status === 'scheduled_for_later');
      setDcs(termWiseOnly);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load term-wise DCs');
      setDcs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDCs();
  };

  const getSchoolName = (dc: any) => {
    const order = dc.dcOrderId;
    if (order && typeof order === 'object') return order.school_name || order.schoolName || dc.customerName || '-';
    return dc.customerName || '-';
  };

  const filtered = searchQuery.trim()
    ? dcs.filter((dc) => getSchoolName(dc).toLowerCase().includes(searchQuery.toLowerCase()))
    : dcs;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading term-wise DCs...</Text>
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
          <Text style={styles.headerTitle}>Term-Wise DC</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by school..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No term-wise DCs found</Text>
          </View>
        ) : (
          filtered.map((dc) => (
            <View key={dc._id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{getSchoolName(dc)}</Text>
                <Text style={styles.cardSubtitle}>
                  DC: {dc.dc_code || dc._id?.slice(-6)} • {dc.dcDate ? new Date(dc.dcDate).toLocaleDateString('en-IN') : '-'}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editPoButton}
                  onPress={() => navigation.navigate('DCPendingOpen', { dcId: dc._id, fromTermWise: true })}
                >
                  <Text style={styles.editPoButtonText}>Edit PO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.requestDcButton}
                  onPress={() => navigation.navigate('DCTermWiseRequestDC', { dcId: dc._id })}
                >
                  <Text style={styles.requestDcButtonText}>Request DC</Text>
                </TouchableOpacity>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  searchContainer: { padding: 16 },
  searchInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { ...typography.body.medium, color: colors.textSecondary },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardContent: { marginBottom: 12 },
  cardTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { ...typography.body.small, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 10 },
  editPoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  editPoButtonText: { ...typography.label.small, color: colors.textLight, fontWeight: '600' },
  requestDcButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  requestDcButtonText: { ...typography.label.small, color: colors.textLight, fontWeight: '600' },
  buttonDisabled: { opacity: 0.7 },
});
