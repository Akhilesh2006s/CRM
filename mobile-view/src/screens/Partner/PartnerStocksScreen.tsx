import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { colors } from '../../theme/colors';

type StockItem = {
  _id: string;
  productName: string;
  productCode: string;
  availableQuantity: number;
  reservedQuantity: number;
  status: string;
  isLowStock: boolean;
};

export default function PartnerStocksScreen() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = user?.role;
  const allowed = role === 'Partner' || role === 'Vendor';

  const load = async () => {
    try {
      const data = await apiService.get('/vendor-user/stocks');
      setStocks(Array.isArray(data) ? data : []);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [allowed]);

  if (!allowed) {
    return (
      <View style={styles.centered}>
        <Text>Stocks are only available for Partner/Vendor accounts.</Text>
      </View>
    );
  }

  return (
    <ScreenShell title="Partner Stocks"
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}>
      <PageSection title="Partner Stocks">
<Text style={styles.title}>Stocks</Text>
      <FlatList
        data={stocks}
        keyExtractor={(i) => i._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No stock data</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, item.isLowStock && styles.cardLow]}>
            <Text style={styles.name}>{item.productName}</Text>
            <Text style={styles.code}>{item.productCode}</Text>
            <Text>Available: {item.availableQuantity} · Reserved: {item.reservedQuantity}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
      />
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: colors.backgroundLight, padding: 14, borderRadius: 12, marginBottom: 8 },
  cardLow: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  name: { fontWeight: '600', fontSize: 16 },
  code: { color: colors.textSecondary, marginBottom: 4 },
  status: { marginTop: 6, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 32, color: colors.textSecondary },
});
