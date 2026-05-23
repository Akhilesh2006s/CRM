import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { colors } from '../../theme/colors';

type VendorDC = {
  _id: string;
  dcDate: string;
  status: string;
  school: { name: string; code: string; zone: string };
  totalQuantity: number;
  totalPrice: number;
  products: { productName: string; quantity: number }[];
};

export default function PartnerDCsScreen() {
  const [dcs, setDcs] = useState<VendorDC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await apiService.get('/vendor-user/dcs');
      setDcs(Array.isArray(data) ? data : []);
    } catch {
      setDcs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return dcs;
    const q = search.toLowerCase();
    return dcs.filter(
      (d) =>
        d.school?.name?.toLowerCase().includes(q) ||
        d.school?.code?.toLowerCase().includes(q) ||
        d.status?.toLowerCase().includes(q)
    );
  }, [dcs, search]);

  return (
    <ScreenShell title="Partner D Cs"
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}>
      <PageSection title="Partner D Cs">
<Text style={styles.title}>My DCs</Text>
      <WebInput
        style={styles.search}
        placeholder="Search school, code, status..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No DCs found</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.school?.name}</Text>
            <Text style={styles.meta}>{item.school?.code} · {item.school?.zone}</Text>
            <Text style={styles.meta}>Status: {item.status} · Qty: {item.totalQuantity}</Text>
            <Text style={styles.meta}>₹{item.totalPrice?.toLocaleString?.() ?? item.totalPrice}</Text>
          </View>
        )}
      />
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 12 },
  card: { backgroundColor: colors.backgroundLight, padding: 14, borderRadius: 12, marginBottom: 8 },
  name: { fontWeight: '600', fontSize: 16 },
  meta: { color: colors.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 32, color: colors.textSecondary },
});
