import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { RootTabParamList, User } from '../types/index';
import { RootState, AppDispatch } from '../redux/store';

type EmployeesScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Employees'>;

interface Props {
  navigation: EmployeesScreenNavigationProp;
}

export default function EmployeesScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, loading } = useSelector((state: RootState) => state.employees);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const renderEmployee: ListRenderItem<User> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.name}</Text>
          <Chip style={{ backgroundColor: item.isActive ? 'green' : 'red' }}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Chip>
        </View>
        <Text variant="bodyMedium">Email: {item.email}</Text>
        <Text variant="bodyMedium">Role: {item.role}</Text>
        {item.department && <Text variant="bodySmall">Department: {item.department}</Text>}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Employees
      </Text>
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => dispatch(fetchEmployees())}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create employee */}}
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

