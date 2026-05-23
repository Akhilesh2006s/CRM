import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { colors } from '../../theme/colors';

export default function VendorAssignCostScreen({ route }: any) {
  const { id: partnerId } = route.params;
  const [products, setProducts] = useState<any[]>([]);
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.get('/products/active');
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const assignments = products
        .filter((p) => costs[p._id])
        .map((p) => ({ productId: p._id, cost: Number(costs[p._id]) }));
      await apiService.put(`/partners/${partnerId}/products`, { products: assignments });
      Alert.alert('Saved', 'Product costs updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Vendor Assign Cost"
      loading={loading}>
      <PageSection title="Vendor Assign Cost">
<Text style={styles.title}>Assign costs</Text>
      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.productName || item.name}</Text>
            <WebInput
              style={styles.costInput}
              placeholder="Cost"
              keyboardType="decimal-pad"
              value={costs[item._id] || ''}
              onChangeText={(v) => setCosts((c) => ({ ...c, [item._id]: v }))}
            />
          </View>
        )}
      />
      <WebButton title="Save assignments" onPress={save} loading={saving} />
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  name: { flex: 1 },
  costInput: { width: 100, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8 },
  btn: { marginTop: 12, backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
