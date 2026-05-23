import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, DataTable } from '../../ui/WebPrimitives';
import { colors } from '../../theme/colors';

export default function FranchiseDetailScreen({ route }: any) {
  const { email } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const decoded = decodeURIComponent(email);
        const res = await apiService.get(`/franchises/${encodeURIComponent(decoded)}/dashboard`);
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>Franchise not found</Text>
      </View>
    );
  }

  return (
    <ScreenShell title="Franchise Detail" loading={loading}>
      <PageSection title="Franchise Detail">
<Text style={styles.title}>{data.franchiseName}</Text>
      <Text style={styles.meta}>{data.franchiseEmail}</Text>
      <Text style={styles.stat}>Schools: {data.totalSchools} · Zones: {data.totalZones}</Text>
      {(data.assignedSchools || []).slice(0, 20).map((s: any) => (
        <View key={s._id} style={styles.card}>
          <Text style={styles.school}>{s.schoolName}</Text>
          <Text style={styles.meta}>{s.zone} · {s.contactMobile}</Text>
        </View>
      ))}
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
  stat: { fontWeight: '600', marginBottom: 16 },
  card: { backgroundColor: colors.backgroundLight, padding: 12, borderRadius: 10, marginBottom: 8 },
  school: { fontWeight: '600' },
});
