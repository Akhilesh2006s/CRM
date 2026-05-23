import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { navigateRoot } from '../../navigation/navigationRef';
import { WebButton } from '../../ui/WebPrimitives';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { colors } from '../../theme/colors';

export default function DeliverableViewScreen({ route }: any) {
  const { productId, productName } = route.params;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.get(`/products/${productId}/deliverables`);
        setItems(Array.isArray(data) ? data : data?.deliverables || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  return (
    <ScreenShell title="Deliverables" subtitle={productName} loading={loading}>
      <PageSection title={productName}>
        <WebButton
          title="Add deliverable"
          onPress={() => navigateRoot('DeliverableAdd', { productId, productName })}
        />
      <FlatList
        data={items}
        keyExtractor={(i, idx) => i._id || String(idx)}
        ListEmptyComponent={<Text style={styles.empty}>No deliverables mapped</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name || item.deliverableName || '—'}</Text>
            <Text style={styles.meta}>{item.description || ''}</Text>
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
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, backgroundColor: colors.backgroundLight, borderRadius: 10, marginBottom: 8 },
  name: { fontWeight: '600' },
  meta: { color: colors.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 24, color: colors.textSecondary },
});
