import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { fetchLeads } from '../redux/slices/leadSlice';
import { RootTabParamList, Lead } from '../types/index';
import { RootState, AppDispatch } from '../redux/store';

type LeadsScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Leads'>;

interface Props {
  navigation: LeadsScreenNavigationProp;
}

export default function LeadsScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, loading } = useSelector((state: RootState) => state.leads);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const renderLead: ListRenderItem<Lead> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.name}</Text>
        <Text variant="bodyMedium">Company: {item.company || 'N/A'}</Text>
        <Text variant="bodyMedium">Phone: {item.phone}</Text>
        <Text variant="bodyMedium">Email: {item.email || 'N/A'}</Text>
        <Text variant="bodySmall">Status: {item.status}</Text>
        <Text variant="bodySmall">Source: {item.source || 'N/A'}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Leads
      </Text>
      <FlatList
        data={leads}
        renderItem={renderLead}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => dispatch(fetchLeads())}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create lead */}}
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

