import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getSalesReports } from '../utils/api';
import { RootTabParamList } from '../types/index';

type ReportsScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Reports'>;

interface Props {
  navigation: ReportsScreenNavigationProp;
}

interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
}

export default function ReportsScreen({ navigation }: Props) {
  const [reports, setReports] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await getSalesReports();
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Reports & Analytics
      </Text>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Sales Analytics</Text>
            <Button
              mode="contained"
              onPress={loadReports}
              loading={loading}
              style={styles.button}
            >
              Generate Report
            </Button>
            {reports && (
              <View style={styles.reportData}>
                <Text variant="bodyLarge">Total Sales: {reports.totalSales}</Text>
                <Text variant="bodyLarge">Total Revenue: ${reports.totalRevenue?.toFixed(2)}</Text>
                <Text variant="bodyLarge">Average Sale: ${reports.averageSale?.toFixed(2)}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
  button: {
    marginTop: 10,
  },
  reportData: {
    marginTop: 20,
  },
});

