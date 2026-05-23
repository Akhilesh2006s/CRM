import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';
import { colors } from '../../theme/colors';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { navigateRoot } from '../../navigation/navigationRef';

export default function DeliverablesListScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.get('/products');
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScreenShell title="Deliverables List"
      loading={loading}>
      <PageSection title="Deliverables List">
<Text style={styles.title}>Product deliverables</Text>
      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateRoot('DeliverableView', { productId: item._id, productName: item.productName })}
          >
            <Text style={styles.name}>{item.productName}</Text>
            <Text style={styles.link}>View deliverables ›</Text>
            <TouchableOpacity
              onPress={() => navigateRoot('DeliverableAdd', { productId: item._id, productName: item.productName })}
            >
              <Text style={styles.addLink}>+ Add deliverable</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  link: { color: colors.primary, marginTop: 6 },
  addLink: { color: colors.primary, marginTop: 8, fontWeight: '600' },
});
