import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { fetchSales } from '../redux/slices/saleSlice';
import { fetchLeads } from '../redux/slices/leadSlice';
import { VictoryBar, VictoryChart, VictoryTheme } from 'victory';
import { RootTabParamList } from '../types/index';
import { RootState, AppDispatch } from '../redux/store';

type DashboardScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { sales } = useSelector((state: RootState) => state.sales);
  const { leads } = useSelector((state: RootState) => state.leads);

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchLeads());
  }, [dispatch]);

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const newLeads = leads.filter(lead => lead.status === 'New').length;
  const pendingSales = sales.filter(sale => sale.status === 'Pending').length;

  const chartData = [
    { x: 'Mon', y: sales.filter(s => s.status === 'Pending').length },
    { x: 'Tue', y: sales.filter(s => s.status === 'Confirmed').length },
    { x: 'Wed', y: sales.filter(s => s.status === 'Completed').length },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text variant="headlineSmall" style={styles.header}>
          Dashboard
        </Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{totalSales}</Text>
              <Text variant="bodyMedium">Total Sales</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">${totalRevenue.toFixed(2)}</Text>
              <Text variant="bodyMedium">Total Revenue</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{newLeads}</Text>
              <Text variant="bodyMedium">New Leads</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{pendingSales}</Text>
              <Text variant="bodyMedium">Pending Sales</Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              Sales Overview
            </Text>
            <VictoryChart theme={VictoryTheme.material}>
              <VictoryBar data={chartData} />
            </VictoryChart>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Reports')}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    margin: 5,
  },
  chartCard: {
    margin: 10,
  },
  chartTitle: {
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});

