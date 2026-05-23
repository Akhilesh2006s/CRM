import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { apiService } from '../../services/api';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, WebSelect, DataTable } from '../../ui/WebPrimitives';
import { spacing } from '../../theme/colors';

type Zone = { _id?: string; name: string };
type Cluster = { _id?: string; name: string };
type ZoneCluster = { _id?: string; zone: string; cluster: string; zoneId?: string; clusterId?: string };
type PincodeMapping = {
  _id?: string;
  pincode: string;
  city?: string;
  district?: string;
  state?: string;
  zone: string;
  cluster: string;
};

export default function EmployeesZonesScreen() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [pairs, setPairs] = useState<ZoneCluster[]>([]);
  const [mappings, setMappings] = useState<PincodeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingZone, setSavingZone] = useState(false);
  const [savingPair, setSavingPair] = useState(false);
  const [savingPincode, setSavingPincode] = useState(false);
  const [loadingPincode, setLoadingPincode] = useState(false);

  const [zoneName, setZoneName] = useState('');
  const [pairZoneId, setPairZoneId] = useState('');
  const [pairClusterId, setPairClusterId] = useState('');
  const [pincodeForm, setPincodeForm] = useState({
    pincode: '',
    zoneId: '',
    clusterId: '',
    city: '',
    district: '',
    state: '',
  });

  const loadAll = useCallback(async () => {
    try {
      const [zonesRaw, clustersRaw, pairsRaw, mappingsRaw] = await Promise.all([
        apiService.get('/zones'),
        apiService.get('/clusters'),
        apiService.get('/zones-clusters'),
        apiService.get('/zones/pincode-mappings'),
      ]);
      setZones(Array.isArray(zonesRaw) ? zonesRaw : []);
      setClusters(Array.isArray(clustersRaw) ? clustersRaw : []);
      setPairs(Array.isArray(pairsRaw) ? pairsRaw : []);
      setMappings(Array.isArray(mappingsRaw) ? mappingsRaw : []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onAddZone = async () => {
    const trimmed = zoneName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Zone is required');
      return;
    }
    if (zones.some((z) => z.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Validation', 'Zone already exists');
      return;
    }
    setSavingZone(true);
    try {
      await apiService.post('/zones', { name: trimmed });
      setZoneName('');
      loadAll();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save zone');
    } finally {
      setSavingZone(false);
    }
  };

  const onDeleteZone = (id?: string) => {
    if (!id) return;
    Alert.alert('Delete zone?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.delete(`/zones/${id}`);
            loadAll();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const onAddPair = async () => {
    if (!pairZoneId || !pairClusterId) {
      Alert.alert('Validation', 'Select zone and cluster');
      return;
    }
    setSavingPair(true);
    try {
      await apiService.post('/zones-clusters', { zoneId: pairZoneId, clusterId: pairClusterId });
      setPairZoneId('');
      setPairClusterId('');
      loadAll();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to link');
    } finally {
      setSavingPair(false);
    }
  };

  const onDeletePair = (id?: string) => {
    if (!id) return;
    Alert.alert('Remove link?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.delete(`/zones-clusters/${id}`);
            loadAll();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed');
          }
        },
      },
    ]);
  };

  const handlePincodeLookup = async (pincode: string) => {
    const digits = pincode.replace(/\D/g, '').slice(0, 6);
    setPincodeForm((f) => ({ ...f, pincode: digits }));
    if (digits.length !== 6) return;
    setLoadingPincode(true);
    try {
      const res = await apiService.get(`/location/resolve?pincode=${digits}`);
      const zoneMatch = zones.find((z) => z.name === res.zone);
      const clusterMatch = clusters.find((c) => c.name === res.cluster);
      setPincodeForm((f) => ({
        ...f,
        city: res.city || res.town || f.city,
        district: res.district || f.district,
        state: res.state || f.state,
        zoneId: zoneMatch?._id || f.zoneId,
        clusterId: clusterMatch?._id || f.clusterId,
      }));
    } catch {
      /* manual entry */
    } finally {
      setLoadingPincode(false);
    }
  };

  const clustersForPincodeZone = clusters.filter((c) => {
    if (!pincodeForm.zoneId) return true;
    const zone = zones.find((z) => z._id === pincodeForm.zoneId);
    if (!zone) return true;
    return pairs.some((p) => p.zone === zone.name && p.cluster === c.name);
  });

  const onAddPincodeMapping = async () => {
    const pincode = pincodeForm.pincode.replace(/\D/g, '').slice(0, 6);
    if (pincode.length !== 6 || !pincodeForm.zoneId || !pincodeForm.clusterId) {
      Alert.alert('Validation', 'Pincode, zone, and cluster are required');
      return;
    }
    setSavingPincode(true);
    try {
      await apiService.post('/zones/pincode-mappings', {
        pincode,
        zoneId: pincodeForm.zoneId,
        clusterId: pincodeForm.clusterId,
        city: pincodeForm.city,
        district: pincodeForm.district,
        state: pincodeForm.state,
      });
      setPincodeForm({ pincode: '', zoneId: '', clusterId: '', city: '', district: '', state: '' });
      loadAll();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save mapping');
    } finally {
      setSavingPincode(false);
    }
  };

  const onDeleteMapping = (id?: string) => {
    if (!id) return;
    Alert.alert('Delete mapping?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.delete(`/zones/pincode-mappings/${id}`);
            loadAll();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed');
          }
        },
      },
    ]);
  };

  return (
    <ScreenShell
      title="Zones"
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadAll();
      }}
    >
      <PageSection title="Add Zone">
        <WebInput placeholder="Enter zone" value={zoneName} onChangeText={setZoneName} />
        <View style={styles.row}>
          <WebButton title={savingZone ? 'Saving…' : 'Add Zone'} onPress={onAddZone} loading={savingZone} />
          <WebButton title="Refresh" variant="outline" onPress={loadAll} />
        </View>
        <DataTable
          columns={['Zone', 'Action']}
          rows={zones.map((z) => [
            z.name,
            z._id ? (
              <WebButton key={z._id} title="Delete" variant="destructive" onPress={() => onDeleteZone(z._id)} />
            ) : (
              ''
            ),
          ])}
        />
      </PageSection>

      <PageSection
        title="Zone → Cluster links"
        description="Link clusters to zones so Add Employee shows the correct cluster list per zone."
      >
        <WebSelect
          label="Zone"
          value={pairZoneId}
          onValueChange={setPairZoneId}
          placeholder="Select zone"
          items={zones.filter((z) => z._id).map((z) => ({ label: z.name, value: z._id! }))}
        />
        <WebSelect
          label="Cluster"
          value={pairClusterId}
          onValueChange={setPairClusterId}
          placeholder="Select cluster"
          items={clusters.filter((c) => c._id).map((c) => ({ label: c.name, value: c._id! }))}
        />
        <WebButton
          title={savingPair ? 'Linking…' : 'Link cluster to zone'}
          onPress={onAddPair}
          loading={savingPair}
          disabled={clusters.length === 0}
        />
        {pairs.length > 0 && (
          <DataTable
            columns={['Zone', 'Cluster', 'Action']}
            rows={pairs.map((p) => [
              p.zone,
              p.cluster,
              p._id ? (
                <WebButton key={p._id} title="Remove" variant="destructive" onPress={() => onDeletePair(p._id)} />
              ) : (
                ''
              ),
            ])}
          />
        )}
      </PageSection>

      <PageSection
        title="Pincode mappings"
        description="Map pincode to city, district, state, zone, and cluster for automatic fill on Add Employee."
      >
        <WebInput
          placeholder="6-digit pincode"
          value={pincodeForm.pincode}
          onChangeText={handlePincodeLookup}
          keyboardType="number-pad"
          maxLength={6}
        />
        <WebSelect
          label="Zone"
          value={pincodeForm.zoneId}
          onValueChange={(v) => setPincodeForm((f) => ({ ...f, zoneId: v, clusterId: '' }))}
          placeholder="Select zone"
          items={zones.filter((z) => z._id).map((z) => ({ label: z.name, value: z._id! }))}
        />
        <WebSelect
          label="Cluster"
          value={pincodeForm.clusterId}
          onValueChange={(v) => setPincodeForm((f) => ({ ...f, clusterId: v }))}
          placeholder="Select cluster"
          items={clustersForPincodeZone.filter((c) => c._id).map((c) => ({ label: c.name, value: c._id! }))}
        />
        <WebInput placeholder="City" value={pincodeForm.city} onChangeText={(t) => setPincodeForm((f) => ({ ...f, city: t }))} />
        <WebInput placeholder="District" value={pincodeForm.district} onChangeText={(t) => setPincodeForm((f) => ({ ...f, district: t }))} />
        <WebInput placeholder="State" value={pincodeForm.state} onChangeText={(t) => setPincodeForm((f) => ({ ...f, state: t }))} />
        <WebButton
          title={savingPincode ? 'Saving…' : 'Save pincode mapping'}
          onPress={onAddPincodeMapping}
          loading={savingPincode || loadingPincode}
        />
        {mappings.length > 0 && (
          <DataTable
            columns={['Pincode', 'Zone', 'Cluster', '']}
            rows={mappings.map((m) => [
              m.pincode,
              m.zone,
              m.cluster,
              m._id ? (
                <WebButton key={m._id} title="Delete" variant="destructive" onPress={() => onDeleteMapping(m._id)} />
              ) : (
                ''
              ),
            ])}
          />
        )}
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
});
