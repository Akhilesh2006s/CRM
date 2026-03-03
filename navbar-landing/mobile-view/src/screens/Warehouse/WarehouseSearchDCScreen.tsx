import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../context/AuthContext';

export default function WarehouseSearchDCScreen({ navigation }: any) {
  const { user } = useAuth();
  const [schools, setSchools] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dcs, setDcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const statuses = ['created', 'po_submitted', 'sent_to_manager', 'pending_dc', 'warehouse_processing', 'completed', 'hold', 'scheduled_for_later'];

  useEffect(() => {
    loadAllDCs();
  }, []);

  const loadAllDCs = async () => {
    try {
      const data = await apiService.get('/dc');
      const arr = Array.isArray(data) ? data : [];
      const s = new Set<string>();
      const z = new Set<string>();
      arr.forEach((dc: any) => {
        const school = dc.dcOrderId?.school_name || dc.dcOrderId?.schoolName || dc.customerName || '';
        const zone = dc.dcOrderId?.zone || dc.zone || '';
        if (school) s.add(school);
        if (zone) z.add(zone);
      });
      setSchools(Array.from(s).sort());
      setZones(Array.from(z).sort());
      setDcs(arr);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load DCs');
    }
  };

  const handleSearch = async () => {
    const hasFilters = selectedSchool || selectedZone || selectedStatus || selectedDate;
    if (!hasFilters) {
      Alert.alert('Info', 'Select at least one filter');
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (selectedSchool) params.append('schoolName', selectedSchool);
      if (selectedZone) params.append('zone', selectedZone);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedDate) {
        params.append('fromDate', selectedDate);
        params.append('toDate', selectedDate);
      }
      const data = await apiService.get(`/dc?${params.toString()}`);
      setDcs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    setSelectedSchool('');
    setSelectedZone('');
    setSelectedStatus('');
    setSelectedDate('');
    loadAllDCs();
  };

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Admin only.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getSchoolName = (dc: any) =>
    dc.dcOrderId?.school_name || dc.dcOrderId?.schoolName || dc.customerName || '-';

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search DC</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content}>
        <View style={styles.filterRow}>
          <Text style={styles.label}>School</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {schools.slice(0, 20).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSchool === s && styles.chipActive]}
                onPress={() => setSelectedSchool(selectedSchool === s ? '' : s)}
              >
                <Text style={[styles.chipText, selectedSchool === s && styles.chipTextActive]} numberOfLines={1}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.label}>Zone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {zones.map((z) => (
              <TouchableOpacity
                key={z}
                style={[styles.chip, selectedZone === z && styles.chipActive]}
                onPress={() => setSelectedZone(selectedZone === z ? '' : z)}
              >
                <Text style={[styles.chipText, selectedZone === z && styles.chipTextActive]}>{z}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.label}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {statuses.map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.chip, selectedStatus === st && styles.chipActive]}
                onPress={() => setSelectedStatus(selectedStatus === st ? '' : st)}
              >
                <Text style={[styles.chipText, selectedStatus === st && styles.chipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.resultCount}>{dcs.length} DC(s) found</Text>
        {dcs.map((dc) => (
          <TouchableOpacity
            key={dc._id}
            style={styles.card}
            onPress={() => navigation.navigate('WarehouseDCAtWarehouseDetail', { id: dc._id })}
          >
            <Text style={styles.cardTitle}>{getSchoolName(dc)}</Text>
            <Text style={styles.cardSubtitle}>
              {dc.dc_code || dc._id?.slice(-6)} • {dc.status || '-'} • {dc.dcDate ? new Date(dc.dcDate).toLocaleDateString('en-IN') : '-'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  filterRow: { marginBottom: 16 },
  label: { ...typography.label.small, marginBottom: 8, color: colors.textSecondary },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e5e7eb', marginRight: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: colors.textPrimary },
  chipTextActive: { color: colors.textLight },
  input: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchButton: { flex: 1, backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  clearButton: { flex: 1, backgroundColor: '#e5e7eb', padding: 14, borderRadius: 12, alignItems: 'center' },
  clearButtonText: { color: colors.textPrimary, fontWeight: '600' },
  resultCount: { ...typography.body.medium, marginBottom: 12, color: colors.textSecondary },
  card: { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { ...typography.heading.h3, color: colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { ...typography.body.small, color: colors.textSecondary },
  errorText: { color: colors.error || '#ef4444', textAlign: 'center', padding: 24 },
  backBtn: { alignSelf: 'center', marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
