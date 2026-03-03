import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function DCPendingScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Only DCs with status pending_dc appear here; once sent to warehouse (sent_to_manager) they disappear
      const response = await apiService.get('/dc?status=pending_dc');
      const data = Array.isArray(response) ? response : (response?.data || []);
      const pendingOnly = (data as any[]).filter((d: any) => d.status === 'pending_dc');
      setItems(pendingOnly);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load pending DCs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading pending DCs...</Text>
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
          <Text style={styles.headerTitle}>Pending DC</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>No pending DCs found</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item._id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('DCPendingOpen', { dcId: item._id })}
              >
                <Text style={styles.schoolName}>{item.customerName || item.dcOrderId?.school_name || 'N/A'}</Text>
                <Text style={styles.infoText}>Status: {item.status || 'Pending'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.openButton}
                onPress={() => navigation.navigate('DCPendingOpen', { dcId: item._id })}
              >
                <Text style={styles.openButtonText}>Open</Text>
              </TouchableOpacity>
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
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  schoolName: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 8 },
  infoText: { ...typography.body.medium, color: colors.textSecondary },
  openButton: { marginTop: 12, alignSelf: 'flex-end', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  openButtonText: { ...typography.label.small, color: colors.textLight, fontWeight: '600' },
});


