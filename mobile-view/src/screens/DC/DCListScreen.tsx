import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface DCItem {
  _id: string;
  dcOrderId?: {
    school_name: string;
    dc_code: string;
    location: string;
  };
  customerName: string;
  status: string;
  product: string;
  createdAt: string;
}

export default function DCListScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [dcs, setDcs] = useState<DCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const type = route.params?.type || 'sales';

  useEffect(() => {
    loadDCs();
  }, []);

  const loadDCs = async () => {
    try {
      setLoading(true);
      // The endpoint uses req.user._id from auth token, no need to pass employeeId
      const data = await apiService.get('/dc/employee/my');
      setDcs(data || []);
    } catch (error: any) {
      console.error('Error loading DCs:', error);
      setDcs([]); // Set empty array on error so user can see empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDCs();
  };

  const renderDCItem = ({ item }: { item: DCItem }) => {
    const schoolName = item.dcOrderId?.school_name || item.customerName;
    const schoolCode = item.dcOrderId?.dc_code || '';
    const location = item.dcOrderId?.location || '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DCCapture', { dcId: item._id, dc: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        {schoolCode && <Text style={styles.schoolCode}>Code: {schoolCode}</Text>}
        {location && <Text style={styles.location}>📍 {location}</Text>}
        <Text style={styles.product}>Product: {item.product}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const getStatusStyle = (status: string) => {
    const statusStyles: any = {
      created: { backgroundColor: '#fff3cd' },
      po_submitted: { backgroundColor: '#cfe2ff' },
      pending_dc: { backgroundColor: '#fff3cd' },
      completed: { backgroundColor: '#d1e7dd' },
      hold: { backgroundColor: '#f8d7da' },
    };
    return statusStyles[status] || { backgroundColor: '#e9ecef' };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === 'training' ? 'Training DCs' : 'Sales DCs'}
          </Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading DCs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'training' ? 'Training DCs' : 'Sales DCs'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('DCCapture')}>
          <Text style={styles.addButton}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dcs}
        renderItem={renderDCItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No DCs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body.medium,
    color: colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.primary,
  },
  backButton: {
    ...typography.body.medium,
    color: colors.textLight,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.heading.h2,
    color: colors.textLight,
  },
  addButton: {
    ...typography.body.medium,
    color: colors.textLight,
    fontWeight: '700',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  schoolName: {
    ...typography.heading.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    ...typography.label.small,
    textTransform: 'capitalize',
  },
  schoolCode: {
    ...typography.body.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  location: {
    ...typography.body.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  product: {
    ...typography.body.medium,
    color: colors.textPrimary,
    marginTop: 12,
    fontWeight: '600',
  },
  date: {
    ...typography.body.small,
    color: colors.textTertiary,
    marginTop: 8,
  },
  empty: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body.large,
    color: colors.textTertiary,
  },
});

