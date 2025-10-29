import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTrainings } from '../utils/api';
import { RootStackParamList, Training } from '../types/index';

type TrainingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Training'>;

interface Props {
  navigation: TrainingScreenNavigationProp;
}

export default function TrainingScreen({ navigation }: Props) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    try {
      const response = await getTrainings();
      setTrainings(response.data);
    } catch (error) {
      console.error('Error loading trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Training['status']): string => {
    switch (status) {
      case 'Completed': return 'green';
      case 'In Progress': return 'blue';
      case 'Scheduled': return 'orange';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  const renderTraining: ListRenderItem<Training> = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.title}</Text>
          <Chip style={{ backgroundColor: getStatusColor(item.status) }}>
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyMedium">{item.description}</Text>
        <Text variant="bodySmall">
          Start: {new Date(item.startDate).toLocaleDateString()}
        </Text>
        <Text variant="bodySmall">
          End: {new Date(item.endDate).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Training & Services
      </Text>
      <FlatList
        data={trainings}
        renderItem={renderTraining}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadTrainings}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create training */}}
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

