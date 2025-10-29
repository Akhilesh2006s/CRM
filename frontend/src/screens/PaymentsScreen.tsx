import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getPayments } from '../utils/api';
import { RootTabParamList, Payment } from '../types/index';

type PaymentsScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Payments'>;

interface Props {
  navigation: PaymentsScreenNavigationProp;
}

export default function PaymentsScreen({ navigation }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await getPayments();
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Payment['status']): string => {
    switch (status) {
      case 'Approved': return 'green';
      case 'Pending': return 'orange';
      case 'Rejected': return 'red';
      default: return 'gray';
    }
  };

  const renderPayment: ListRenderItem<Payment> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.customerName}</Text>
          <Chip style={{ backgroundColor: getStatusColor(item.status) }}>
            {item.status}
          </Chip>
        </View>
        <Text variant="titleLarge" style={styles.amount}>
          ${item.amount.toFixed(2)}
        </Text>
        <Text variant="bodyMedium">Method: {item.paymentMethod}</Text>
        <Text variant="bodySmall">
          Date: {new Date(item.paymentDate).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Payments
      </Text>
      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadPayments}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create payment */}}
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
  amount: {
    color: '#6200ee',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});

