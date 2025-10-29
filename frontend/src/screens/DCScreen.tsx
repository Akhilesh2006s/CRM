import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, FAB, Chip } from 'react-native-paper';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getDCs } from '../utils/api';
import { RootTabParamList, DC } from '../types/index';

type DCScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'DC'>;

interface Props {
  navigation: DCScreenNavigationProp;
}

export default function DCScreen({ navigation }: Props) {
  const [dcs, setDcs] = useState<DC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDCs();
  }, []);

  const loadDCs = async () => {
    try {
      const response = await getDCs();
      setDcs(response.data);
    } catch (error) {
      console.error('Error loading DCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DC['status']): string => {
    switch (status) {
      case 'Delivered': return 'green';
      case 'In Transit': return 'blue';
      case 'Scheduled': return 'orange';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  const renderDCItem: ListRenderItem<DC> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.customerName}</Text>
          <Chip style={{ backgroundColor: getStatusColor(item.status) }}>
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyMedium">Address: {item.customerAddress}</Text>
        <Text variant="bodyMedium">Phone: {item.customerPhone}</Text>
        <Text variant="bodySmall">Delivery Date: {new Date(item.deliveryDate).toLocaleDateString()}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Delivery/Dispatch Control
      </Text>
      <FlatList
        data={dcs}
        renderItem={renderDCItem}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadDCs}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create DC */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    fontWeight: 'bold',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});

