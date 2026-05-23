import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebInput, WebButton, WebLabel } from '../../ui/WebPrimitives';
import { navigateRoot } from '../../navigation/navigationRef';

/** Matches web `products/deliverables/add` */
export default function DeliverableAddScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const productId = route.params?.productId as string | undefined;
  const [productName, setProductName] = useState(route.params?.productName || '');
  const [deliverableName, setDeliverableName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access denied', 'Admin privileges required.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    if (!productId) {
      Alert.alert('Error', 'Product not specified', [
        { text: 'OK', onPress: () => navigateRoot('DeliverablesList') },
      ]);
      return;
    }
    (async () => {
      try {
        const product = await apiService.get(`/products/${productId}`);
        setProductName(product?.productName || productName);
      } catch {
        Alert.alert('Error', 'Failed to load product', [
          { text: 'OK', onPress: () => navigateRoot('DeliverablesList') },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, isAdmin]);

  const handleSave = async () => {
    const trimmed = deliverableName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Deliverable name is required');
      return;
    }
    if (!productId) return;
    setSaving(true);
    try {
      await apiService.post('/deliverables', { deliverableName: trimmed, productId });
      Alert.alert('Success', 'Deliverable saved successfully!', [
        { text: 'OK', onPress: () => navigateRoot('DeliverablesList') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save deliverable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell
      title="Add Deliverable"
      subtitle={productName ? `Product: ${productName}` : undefined}
      loading={loading}
    >
      <PageSection title="Deliverable details">
        <WebLabel>Deliverable Name *</WebLabel>
        <WebInput
          placeholder="Enter deliverable name"
          value={deliverableName}
          onChangeText={setDeliverableName}
        />
        <WebButton title={saving ? 'Saving…' : 'Save'} onPress={handleSave} loading={saving} disabled={saving} />
        <WebButton
          title="Cancel"
          variant="outline"
          onPress={() => navigateRoot('DeliverablesList')}
          disabled={saving}
        />
      </PageSection>
    </ScreenShell>
  );
}
