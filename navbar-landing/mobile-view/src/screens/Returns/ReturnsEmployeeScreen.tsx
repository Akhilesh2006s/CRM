import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../context/AuthContext';

export default function ReturnsEmployeeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [myReturns, setMyReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?._id])
  );

  const loadData = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const returnsData = await apiService.get('/stock-returns/executive/mine').catch(() => []);
      setMyReturns(Array.isArray(returnsData) ? returnsData : (returnsData?.data || []));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const drafts = myReturns.filter((r) => r.status === 'Draft');
  const submittedReturns = myReturns.filter((r) => r.status !== 'Draft');

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return '-';
    }
  };

  const nextActionByStatus: Record<string, string> = {
    Draft: 'Complete & Submit',
    Submitted: 'Warehouse Verification',
    Received: 'Under Review',
    'Pending Manager Approval': 'Manager Decision',
    Approved: 'Closed',
    'Partially Approved': 'Closed',
    Rejected: '—',
    'Sent Back': 'Resubmit',
    'Stock Updated': 'Closed',
    Closed: '—',
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
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
            <Text style={styles.headerTitle}>Employee Stock Returns</Text>
            <Text style={styles.headerSubtitle}>Submit stock returns</Text>
          </View>
          <LogoutButton />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity
          style={styles.addReturnButton}
          onPress={() => navigation.navigate('StockReturnAdd')}
        >
          <Text style={styles.addReturnButtonText}>+ Add Return</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved drafts</Text>
          {drafts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved drafts. Tap "Add Return" to create one.</Text>
            </View>
          ) : (
            drafts.map((ret) => (
              <TouchableOpacity
                key={ret._id}
                style={styles.returnCard}
                onPress={() => navigation.navigate('StockReturnAdd', { returnId: ret._id })}
                activeOpacity={0.8}
              >
                <View style={styles.returnHeader}>
                  <Text style={styles.returnNumber}>{ret.returnId || `Return #${ret.returnNumber}`}</Text>
                  <Text style={styles.returnDate}>{formatDate(ret.returnDate)}</Text>
                </View>
                <View style={styles.returnStatusRow}>
                  <Text style={styles.returnStatusLabel}>Status:</Text>
                  <Text style={[styles.returnStatusValue, styles.statusDraft]}>{ret.status || 'Draft'}</Text>
                </View>
                {ret.customerName ? <Text style={styles.returnInfo}>Customer: {ret.customerName}</Text> : null}
                <Text style={styles.returnMeta}>Updated: {formatDate(ret.updatedAt)} · Tap to edit</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Returns</Text>
          {submittedReturns.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No submitted returns yet</Text>
            </View>
          ) : (
            submittedReturns.map((ret) => (
              <TouchableOpacity
                key={ret._id}
                style={styles.returnCard}
                onPress={() => navigation.navigate('StockReturnAdd', { returnId: ret._id })}
                activeOpacity={0.8}
              >
                <View style={styles.returnHeader}>
                  <Text style={styles.returnNumber}>{ret.returnId || `Return #${ret.returnNumber}`}</Text>
                  <Text style={styles.returnDate}>{formatDate(ret.returnDate)}</Text>
                </View>
                <View style={styles.returnStatusRow}>
                  <Text style={styles.returnStatusLabel}>Status:</Text>
                  <Text style={[styles.returnStatusValue, ret.status === 'Draft' && styles.statusDraft]}>{ret.status || '—'}</Text>
                </View>
                <Text style={styles.returnNextAction}>Next: {nextActionByStatus[ret.status] || '—'}</Text>
                {ret.customerName ? <Text style={styles.returnInfo}>Customer: {ret.customerName}</Text> : null}
                {ret.remarks && <Text style={styles.returnRemarks}>{ret.remarks}</Text>}
                {ret.lrNumber && <Text style={styles.returnInfo}>LR No: {ret.lrNumber}</Text>}
                <Text style={styles.returnMeta}>Created: {formatDate(ret.createdAt)} · Updated: {formatDate(ret.updatedAt)}</Text>
              </TouchableOpacity>
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
  section: { marginBottom: 24 },
  sectionTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 16 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { ...typography.body.medium, color: colors.textSecondary },
  addReturnButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  addReturnButtonText: { ...typography.body.medium, color: colors.textLight, fontWeight: '600' },
  returnCard: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  returnHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  returnNumber: { ...typography.heading.h4, color: colors.textPrimary },
  returnDate: { ...typography.body.small, color: colors.textSecondary },
  returnStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  returnStatusLabel: { ...typography.body.small, color: colors.textSecondary, marginRight: 6 },
  returnStatusValue: { ...typography.body.small, color: colors.textPrimary, fontWeight: '600' },
  statusDraft: { color: colors.warning },
  returnNextAction: { ...typography.body.small, color: colors.info, marginBottom: 4 },
  returnRemarks: { ...typography.body.medium, color: colors.textPrimary, marginBottom: 4 },
  returnInfo: { ...typography.body.small, color: colors.textSecondary, marginBottom: 2 },
  returnMeta: { ...typography.body.small, color: colors.textTertiary, marginTop: 6 },
});


