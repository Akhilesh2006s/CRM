import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { getExpenses } from '../utils/api';
import { RootStackParamList, Expense } from '../types/index';

type ExpensesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Expenses'>;

interface Props {
  navigation: ExpensesScreenNavigationProp;
}

export default function ExpensesScreen({ navigation }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const response = await getExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Expense['status']): string => {
    switch (status) {
      case 'Approved': return 'green';
      case 'Pending': return 'orange';
      case 'Rejected': return 'red';
      default: return 'gray';
    }
  };

  const renderExpense: ListRenderItem<Expense> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.title}</Text>
          <Chip style={{ backgroundColor: getStatusColor(item.status) }}>
            {item.status}
          </Chip>
        </View>
        <Text variant="titleLarge" style={styles.amount}>
          ${item.amount.toFixed(2)}
        </Text>
        <Text variant="bodyMedium">Category: {item.category}</Text>
        <Text variant="bodySmall">
          Date: {new Date(item.date).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Expenses
      </Text>
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadExpenses}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create expense */}}
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
    color: '#d32f2f',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});

