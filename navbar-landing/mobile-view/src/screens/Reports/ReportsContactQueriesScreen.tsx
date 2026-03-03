import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';

interface ContactQuery {
  _id: string;
  school_code?: string;
  school_name?: string;
  school_type?: string;
  zone?: string;
  town?: string;
  subject?: string;
  description?: string;
  contact_mobile?: string;
  enquiry_date?: string;
  executive?: { name?: string };
}

export default function ReportsContactQueriesScreen({ navigation }: any) {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<ContactQuery[]>('/contact-queries');
      setQueries(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load contact queries');
      setQueries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQueries();
  };

  const zones = useMemo(() => {
    const set = new Set<string>();
    queries.forEach((q) => {
      if (q.zone) set.add(q.zone);
    });
    return Array.from(set).sort();
  }, [queries]);

  const filteredQueries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return queries.filter((q) => {
      const matchesZone = zoneFilter === 'all' || (q.zone || '').toLowerCase() === zoneFilter.toLowerCase();
      const matchesSearch =
        !term ||
        q.school_name?.toLowerCase().includes(term) ||
        q.school_code?.toLowerCase().includes(term) ||
        q.contact_mobile?.includes(term) ||
        q.subject?.toLowerCase().includes(term);
      return matchesZone && matchesSearch;
    });
  }, [queries, zoneFilter, search]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading contact queries...</Text>
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
          <Text style={styles.headerTitle}>Contact Queries</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by school, subject, or mobile"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, zoneFilter === 'all' && styles.filterChipActive]}
            onPress={() => setZoneFilter('all')}
          >
            <Text style={[styles.filterChipText, zoneFilter === 'all' && styles.filterChipTextActive]}>All Zones</Text>
          </TouchableOpacity>
          {zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.filterChip, zoneFilter === zone && styles.filterChipActive]}
              onPress={() => setZoneFilter(zone)}
            >
              <Text style={[styles.filterChipText, zoneFilter === zone && styles.filterChipTextActive]}>{zone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredQueries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❓</Text>
            <Text style={styles.emptyText}>No contact queries found</Text>
          </View>
        ) : (
          filteredQueries.map((query) => (
            <View key={query._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.schoolName}>{query.school_name || 'School'}</Text>
                <Text style={styles.zoneBadge}>{query.zone || '-'}</Text>
              </View>
              <Text style={styles.infoLine}>Code: {query.school_code || '-'}</Text>
              <Text style={styles.infoLine}>Subject: {query.subject || '-'}</Text>
              <Text style={styles.infoLine}>Contact: {query.contact_mobile || '-'}</Text>
              <Text style={styles.infoLine}>Executive: {query.executive?.name || '-'}</Text>
              <Text style={styles.infoLine}>Date: {query.enquiry_date ? new Date(query.enquiry_date).toLocaleDateString('en-IN') : '-'}</Text>
              {query.description ? <Text style={styles.infoLine}>Notes: {query.description}</Text> : null}
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
  filters: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { ...typography.body.medium, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, color: colors.textPrimary },
  filterScroll: { marginTop: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterChipText: { ...typography.body.medium, color: colors.textPrimary },
  filterChipTextActive: { color: colors.primary, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyText: { ...typography.heading.h3, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  schoolName: { ...typography.heading.h3, color: colors.textPrimary, flex: 1 },
  zoneBadge: { ...typography.label.small, color: colors.primary, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  infoLine: { ...typography.body.medium, color: colors.textSecondary, marginTop: 4 },
});


