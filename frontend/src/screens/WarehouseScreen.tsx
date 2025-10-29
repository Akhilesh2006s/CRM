import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { getWarehouse } from '../utils/api';
import { RootStackParamList, Warehouse } from '../types/index';

type WarehouseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Warehouse'>;

interface Props {
  navigation: WarehouseScreenNavigationProp;
}

export default function WarehouseScreen({ navigation }: Props) {
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadWarehouse();
  }, []);

  const loadWarehouse = async () => {
    try {
      const response = await getWarehouse();
      setItems(response.data);
    } catch (error) {
      console.error('Error loading warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Warehouse['status']): string => {
    switch (status) {
      case 'In Stock': return 'green';
      case 'Low Stock': return 'orange';
      case 'Out of Stock': return 'red';
      default: return 'gray';
    }
  };

  const renderItem: ListRenderItem<Warehouse> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.productName}</Text>
          <Chip style={{ backgroundColor: getStatusColor(item.status) }}>
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyMedium">Stock: {item.currentStock} {item.unit}</Text>
        <Text variant="bodyMedium">Price: ${item.unitPrice.toFixed(2)}</Text>
        {item.category && <Text variant="bodySmall">Category: {item.category}</Text>}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Warehouse
      </Text>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadWarehouse}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to add product */}}
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

