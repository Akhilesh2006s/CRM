import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

export default function ExecutiveManagerDashboardScreen({ navigation, route }: any) {
  const { managerId } = route.params;
  const [manager, setManager] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [managerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [managerData, statsData] = await Promise.all([
        apiService.get(`/executive-managers/${managerId}`),
        apiService.get(`/executive-managers/${managerId}/stats`).catch(() => ({})),
      ]);
      setManager(managerData);
      setStats(statsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load manager data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading manager dashboard...</Text>
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
          <Text style={styles.headerTitle}>{manager?.name || 'Manager'} Dashboard</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {manager && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{manager.name}</Text>
              <Text style={styles.infoText}>Email: {manager.email || '-'}</Text>
              <Text style={styles.infoText}>Role: {manager.role || '-'}</Text>
            </View>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ExecutiveManagerLeaves', { managerId })}>
              <Text style={styles.actionCardTitle}>View Leaves</Text>
              <Text style={styles.actionCardSubtitle}>Manage manager leaves</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('POChangeRequests')}>
              <Text style={styles.actionCardTitle}>PO Change Requests</Text>
              <Text style={styles.actionCardSubtitle}>Approve or reject Executive PO PDF change requests</Text>
            </TouchableOpacity>
          </>
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
  infoCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12 },
  infoTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 12 },
  infoText: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 6 },
  actionCard: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 12 },
  actionCardTitle: { ...typography.heading.h3, color: colors.textLight, marginBottom: 6 },
  actionCardSubtitle: { ...typography.body.medium, color: colors.textLight, opacity: 0.9 },
});


