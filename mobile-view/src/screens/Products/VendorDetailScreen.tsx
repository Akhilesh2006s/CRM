import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { apiService } from '../../services/api';
import { colors } from '../../theme/colors';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { navigateRoot } from '../../navigation/navigationRef';

export default function VendorDetailScreen({ route }: any) {
  const { id } = route.params;
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.get(`/partners/${id}`);
        setPartner(data);
      } catch {
        setPartner(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!partner) {
    return (
      <View style={styles.centered}>
        <Text>Partner not found</Text>
      </View>
    );
  }

  return (
    <ScreenShell title="Vendor Detail"
      loading={loading}>
      <PageSection title="Vendor Detail">
<Text style={styles.title}>{partner.name}</Text>
      <Text style={styles.meta}>{partner.email}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigateRoot('VendorAssignCost', { id })}>
        <Text style={styles.btnText}>Assign product costs</Text>
      </TouchableOpacity>
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, marginTop: 8, marginBottom: 24 },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
