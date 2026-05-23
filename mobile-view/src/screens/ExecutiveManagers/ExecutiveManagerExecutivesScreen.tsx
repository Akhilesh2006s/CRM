import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { colors } from '../../theme/colors';

type Executive = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  isActive: boolean;
};

export default function ExecutiveManagerExecutivesScreen() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await apiService.get('/executive-managers/my/executives');
      setExecutives(Array.isArray(data) ? data : []);
    } catch {
      setExecutives([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScreenShell title="Executive Manager Executives"
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}>
      <PageSection title="Executive Manager Executives">
<Text style={styles.title}>My executives</Text>
      <FlatList
        data={executives}
        keyExtractor={(e) => e._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No executives assigned</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.email}</Text>
            <Text style={styles.meta}>{item.phone || item.mobile || '—'}</Text>
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
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: colors.backgroundLight, padding: 14, borderRadius: 12, marginBottom: 8 },
  name: { fontWeight: '600', fontSize: 16 },
  meta: { color: colors.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 32, color: colors.textSecondary },
});
