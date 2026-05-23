import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AttendanceCard from '../../components/AttendanceCard';
import { colors } from '../../theme/colors';
import { commonStyles } from '../../theme/styles';
import { typography } from '../../theme/typography';
import { navigateRoot } from '../../navigation/navigationRef';
import { getRoleFlags } from '../../utils/roles';

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const go = (screen: string, params?: object) => navigateRoot(screen, params);

  const userRole = user?.role || '';
  const userRoles = user?.roles || [];
  const flags = getRoleFlags(user);
  const {
    isAdmin,
    isPartner,
    isManager,
    isCoordinator,
    isSeniorCoordinator,
    isExecutiveManager,
    isTrainer,
    isWarehouseExecutive,
    isWarehouseManager,
    isFinanceManager,
    isExecutive,
    isEmployee,
  } = flags;
  const isSalesBDE = userRole === 'Sales BDE';
  
  // Debug logging
  useEffect(() => {
    console.log('Dashboard - User Role:', userRole);
    console.log('Dashboard - User Roles:', userRoles);
    console.log('Dashboard - isEmployee:', isEmployee);
    console.log('Dashboard - isExecutive:', isExecutive);
  }, [userRole, userRoles, isEmployee, isExecutive]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  // Employee Dashboard (like web app - only My DC, no Create DC)
  const renderEmployeeDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#3b82f6' + '15' }]}>
              <Text style={styles.sectionIconText}>📋</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Leads</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('LeadsList')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
              <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📅</Text></View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Active / Upcoming</Text>
                <Text style={styles.cardSubtitleWhite}>My trainings and services</Text>
              </View>
              <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainingTrainerCompleted')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Completed</Text>
              <Text style={styles.cardSubtitleWhite}>Completed trainings and services</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Text style={styles.sectionIconText}>💸</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Expense</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('ExpenseCreate')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>➕</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Create Expense</Text>
              <Text style={styles.cardSubtitleWhite}>Submit expense</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('ExpenseMy')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📊</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>My Expenses</Text>
              <Text style={styles.cardSubtitleWhite}>View my expenses</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
              <Text style={styles.sectionIconText}>📅</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Leave Management</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('LeaveRequest')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>➕</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Leave Request</Text>
              <Text style={styles.cardSubtitleWhite}>Submit leave request</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('LeavesApproved')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>My Leaves</Text>
              <Text style={styles.cardSubtitleWhite}>View approved leaves</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Executive Manager Dashboard
  const renderExecutiveManagerDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => go('ExecutiveManagerDashboard', { managerId: user?._id })}
      >
        <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📊</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>My Dashboard</Text>
              <Text style={styles.cardSubtitleWhite}>View my executive dashboard</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
              <Text style={styles.sectionIconText}>👥</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Executives</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('ExecutiveManagers')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>👥</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>My Executives</Text>
              <Text style={styles.cardSubtitleWhite}>View executives</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.sectionIconText}>📋</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Clients</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('ClientsClosedSales')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✏️</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>PO Edit Request</Text>
              <Text style={styles.cardSubtitleWhite}>Approve PO edit requests</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Text style={styles.sectionIconText}>💸</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Expenses</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('ExpenseExecutiveManagerPending')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏳</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Expenses</Text>
              <Text style={styles.cardSubtitleWhite}>Approve team expenses</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
              <Text style={styles.sectionIconText}>📅</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Leave Management</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('ExecutiveManagerLeaves', { managerId: user?._id })}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>My Team Leaves</Text>
              <Text style={styles.cardSubtitleWhite}>Manage team leave requests</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Warehouse Executive Dashboard
  const renderWarehouseExecutiveDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#14B8A6' + '15' }]}>
              <Text style={styles.sectionIconText}>🔄</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Stock Returns</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ReturnsWarehouseExecutive')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
              <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>🔄</Text></View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Stock Returns</Text>
                <Text style={styles.cardSubtitleWhite}>Verify executive returns</Text>
              </View>
              <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Warehouse Manager Dashboard
  const renderWarehouseManagerDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#14B8A6' + '15' }]}>
              <Text style={styles.sectionIconText}>🔄</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Stock Returns</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ReturnsWarehouseManager')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
              <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>🔄</Text></View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Stock Returns</Text>
                <Text style={styles.cardSubtitleWhite}>Approve return requests</Text>
              </View>
              <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Sales BDE Dashboard (with Create DC, Payments, Expenses, Leaves)
  const renderSalesBDEDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DC</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('DCList', { type: 'sales' })}
        >
          <Text style={styles.cardTitleWhite}>My DC</Text>
          <Text style={styles.cardSubtitleWhite}>View and manage my DC orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('DCCapture', { type: 'sales' })}
        >
          <Text style={styles.cardTitleWhite}>Create DC</Text>
          <Text style={styles.cardSubtitleWhite}>Create new DC entry</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('PaymentList')}
        >
          <Text style={styles.cardTitleWhite}>Add Payment</Text>
          <Text style={styles.cardSubtitleWhite}>Record new payment</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('ExpenseList')}
        >
          <Text style={styles.cardTitleWhite}>Create Expense</Text>
          <Text style={styles.cardSubtitleWhite}>Submit new expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('ExpenseList', { myExpenses: true })}
        >
          <Text style={styles.cardTitleWhite}>My Expenses</Text>
          <Text style={styles.cardSubtitleWhite}>View my submitted expenses</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaves</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('LeaveList')}
        >
          <Text style={styles.cardTitleWhite}>My Leaves</Text>
          <Text style={styles.cardSubtitleWhite}>View and manage leaves</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Senior Coordinator: only Dashboard, Clients (all pages), Warehouse (all pages). No Reports, Payments, Training & Services, Users/Employees.
  const renderSeniorCoordinatorDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.sectionIconText}>📦</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Clients</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('DCCreate')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>➕</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Create Sale</Text>
              <Text style={styles.cardSubtitleWhite}>Create new sale</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCClosed')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Closed Sales</Text>
              <Text style={styles.cardSubtitleWhite}>View closed sales</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCSaved')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>💾</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Saved DC</Text>
              <Text style={styles.cardSubtitleWhite}>View saved DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCPending')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏳</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending DC</Text>
              <Text style={styles.cardSubtitleWhite}>Review pending DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCEmp')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>👤</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>EMP DC</Text>
              <Text style={styles.cardSubtitleWhite}>EMP DC list</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCTermWise')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Term-Wise DC</Text>
              <Text style={styles.cardSubtitleWhite}>Term-wise DC</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
              <Text style={styles.sectionIconText}>🏢</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Warehouse</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseInventoryItems')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📦</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Inventory Items</Text>
              <Text style={styles.cardSubtitleWhite}>Manage inventory</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseStock')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📊</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Stock</Text>
              <Text style={styles.cardSubtitleWhite}>View stock</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseDCAtWarehouse')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📦</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>DC @ Warehouse</Text>
              <Text style={styles.cardSubtitleWhite}>Process warehouse DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseCompletedDC')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Completed DC</Text>
              <Text style={styles.cardSubtitleWhite}>View completed DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseDCListed')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>DC Listed</Text>
              <Text style={styles.cardSubtitleWhite}>Listed DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseHoldDC')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏸️</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Hold DC</Text>
              <Text style={styles.cardSubtitleWhite}>View hold DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseSearchDC')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>🔍</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Search DC</Text>
              <Text style={styles.cardSubtitleWhite}>Search DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#6B7280' + '15' }]}>
              <Text style={styles.sectionIconText}>⚙️</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('SettingsPassword')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>🔐</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Change Password</Text>
              <Text style={styles.cardSubtitleWhite}>Update password</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Coordinator Dashboard (includes Employees, Training, Warehouse, Payments, Reports)
  const renderCoordinatorDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.sectionIconText}>📦</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Clients</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('DCCreate')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>➕</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Create Sale</Text>
              <Text style={styles.cardSubtitleWhite}>Create new sale</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCClosed')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Closed Sales</Text>
              <Text style={styles.cardSubtitleWhite}>View closed sales</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCSaved')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>💾</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Saved DC</Text>
              <Text style={styles.cardSubtitleWhite}>View saved DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('DCPending')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏳</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending DC</Text>
              <Text style={styles.cardSubtitleWhite}>Review pending DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
              <Text style={styles.sectionIconText}>👥</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Employees</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('EmployeesActive')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>👥</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Active Employees</Text>
              <Text style={styles.cardSubtitleWhite}>View active employees</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#EC4899' + '15' }]}>
              <Text style={styles.sectionIconText}>🎓</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Training & Services</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('TrainingDashboard')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📊</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Trainers Dashboard</Text>
              <Text style={styles.cardSubtitleWhite}>View training dashboard</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('TrainingAssign')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Assign Training</Text>
              <Text style={styles.cardSubtitleWhite}>Assign training or service</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('TrainingList')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Trainings List</Text>
              <Text style={styles.cardSubtitleWhite}>View trainings</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('ServicesList')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Services List</Text>
              <Text style={styles.cardSubtitleWhite}>View services</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
              <Text style={styles.sectionIconText}>🏢</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Warehouse</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseDCAtWarehouse')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📦</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>DC @ Warehouse</Text>
              <Text style={styles.cardSubtitleWhite}>Process warehouse DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseCompletedDC')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Completed DC</Text>
              <Text style={styles.cardSubtitleWhite}>View completed DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseDCListed')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>DC Listed</Text>
              <Text style={styles.cardSubtitleWhite}>Listed DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('WarehouseHoldDC')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏸️</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Hold DC</Text>
              <Text style={styles.cardSubtitleWhite}>View hold DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.success + '15' }]}>
              <Text style={styles.sectionIconText}>💳</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Payments</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('PaymentList')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏳</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Payments</Text>
              <Text style={styles.cardSubtitleWhite}>View pending payments</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('PaymentDone')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Payments Done</Text>
              <Text style={styles.cardSubtitleWhite}>Completed payments</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
              <Text style={styles.sectionIconText}>📊</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Reports</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('ReportsLeads')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📋</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Leads</Text>
              <Text style={styles.cardSubtitleWhite}>Leads report</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('ReportsDC')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>📦</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>DC</Text>
              <Text style={styles.cardSubtitleWhite}>DC report</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('ReportsReturns')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>🔄</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Returns</Text>
              <Text style={styles.cardSubtitleWhite}>Returns report</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => go('ReportsExpenses')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>💰</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>All Expenses</Text>
              <Text style={styles.cardSubtitleWhite}>Expense reports</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#6B7280' + '15' }]}>
              <Text style={styles.sectionIconText}>⚙️</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => go('SettingsPassword')}>
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>🔐</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Change Password</Text>
              <Text style={styles.cardSubtitleWhite}>Update password</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Combined Sales BDE + Trainer
  const renderCombinedDashboard = () => (
    <View style={styles.content}>
      <AttendanceCard />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales BDE</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('DCList', { type: 'sales' })}
        >
          <Text style={styles.cardTitleWhite}>My DC</Text>
          <Text style={styles.cardSubtitleWhite}>View and manage DC orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('DCCapture', { type: 'sales' })}
        >
          <Text style={styles.cardTitleWhite}>Create DC</Text>
          <Text style={styles.cardSubtitleWhite}>Create new DC entry</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trainer</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('DCList', { type: 'training' })}
        >
          <Text style={styles.cardTitleWhite}>Training DC</Text>
          <Text style={styles.cardSubtitleWhite}>View training DC orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => go('DCCapture', { type: 'training' })}
        >
          <Text style={styles.cardTitleWhite}>Capture Training DC</Text>
          <Text style={styles.cardSubtitleWhite}>Create new training DC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Admin Dashboard - Comprehensive with all features
  const renderAdminDashboard = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#6366F1' + '15' }]}>
              <Text style={styles.sectionIconText}>🛡️</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Executive Managers</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ExecutiveManagers')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>🛡️</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>All Managers</Text>
                <Text style={styles.cardSubtitleWhite}>View executive managers</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ExecutiveManagerNew')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>➕</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Create Manager</Text>
              <Text style={styles.cardSubtitleWhite}>Add new executive manager</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
              <Text style={styles.sectionIconText}>👥</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Employees</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('EmployeesActive')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>👥</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Active Employees</Text>
                <Text style={styles.cardSubtitleWhite}>View and manage employees</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('EmployeeNew')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>➕</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Add Employee</Text>
              <Text style={styles.cardSubtitleWhite}>Create new employee</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('EmployeesInactive')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👤</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Inactive Employees</Text>
              <Text style={styles.cardSubtitleWhite}>View inactive employees</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('EmployeesLeaves')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📅</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Leaves</Text>
              <Text style={styles.cardSubtitleWhite}>Employee leave requests</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
              <Text style={styles.sectionIconText}>📅</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Leave Management</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('LeavesPending')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>⏳</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Leaves</Text>
              <Text style={styles.cardSubtitleWhite}>Approve leave requests</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('LeavesReport')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📊</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Leaves Report</Text>
              <Text style={styles.cardSubtitleWhite}>View leave reports</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#EC4899' + '15' }]}>
              <Text style={styles.sectionIconText}>🎓</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Training & Services</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainersNew')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>➕</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Add Trainer</Text>
              <Text style={styles.cardSubtitleWhite}>Add new trainer</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainersActive')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👥</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Active Trainers</Text>
              <Text style={styles.cardSubtitleWhite}>View active trainers</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainingDashboard')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📊</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Trainers Dashboard</Text>
              <Text style={styles.cardSubtitleWhite}>Training dashboard</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainingAssign')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Assign Training</Text>
              <Text style={styles.cardSubtitleWhite}>Assign training or service</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainingList')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Trainings List</Text>
              <Text style={styles.cardSubtitleWhite}>View trainings</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ServicesList')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Services List</Text>
              <Text style={styles.cardSubtitleWhite}>View services</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('TrainersInactive')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👤</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Inactive Trainers</Text>
              <Text style={styles.cardSubtitleWhite}>View inactive trainers</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#0EA5E9' + '15' }]}>
              <Text style={styles.sectionIconText}>🚚</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Clients</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCCreate')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>➕</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Create Sale</Text>
              <Text style={styles.cardSubtitleWhite}>Create new sale</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCClosed')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>✅</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Closed Sales</Text>
              <Text style={styles.cardSubtitleWhite}>View closed sales</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCSaved')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>💾</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Saved DC</Text>
              <Text style={styles.cardSubtitleWhite}>View saved DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCPending')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>⏳</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending DC</Text>
              <Text style={styles.cardSubtitleWhite}>View pending DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCEmp')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>👤</Text></View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>EMP DC</Text>
              <Text style={styles.cardSubtitleWhite}>Employee DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}><Text style={styles.cardArrowWhite}>›</Text></View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.sectionIconText}>📦</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>DC Management</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCAdminMy')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📋</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>All Created DCs</Text>
                <Text style={styles.cardSubtitleWhite}>View all employee DCs</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCPending')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>⏳</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending DCs</Text>
              <Text style={styles.cardSubtitleWhite}>Review pending DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCClosed')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>✅</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Closed Sales</Text>
              <Text style={styles.cardSubtitleWhite}>View closed sales</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('DCCompleted')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📦</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Completed DC</Text>
              <Text style={styles.cardSubtitleWhite}>View all completed DCs</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('WarehouseHoldDC')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>⏸️</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Hold DC</Text>
              <Text style={styles.cardSubtitleWhite}>View all DCs on hold</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#10B981' + '15' }]}>
              <Text style={styles.sectionIconText}>📦</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Products</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ProductsList')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📦</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Products</Text>
                <Text style={styles.cardSubtitleWhite}>Manage products</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ProductNew')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>➕</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Add Product</Text>
              <Text style={styles.cardSubtitleWhite}>Create new product</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Text style={styles.sectionIconText}>💳</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Payments</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('PaymentApprovalPendingCash')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>💰</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Pending Cash</Text>
                <Text style={styles.cardSubtitleWhite}>Approve cash payments</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('PaymentApprovalPendingCheques')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>💳</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Cheques</Text>
              <Text style={styles.cardSubtitleWhite}>Approve cheque payments</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('PaymentList')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>⏳</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Payments</Text>
              <Text style={styles.cardSubtitleWhite}>View pending payments</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('PaymentAdd')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>➕</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Add Payment</Text>
              <Text style={styles.cardSubtitleWhite}>Record new payment</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('PaymentDone')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>✅</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Payments Done</Text>
              <Text style={styles.cardSubtitleWhite}>View completed payments</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('PaymentTransactionReport')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📊</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Transaction Report</Text>
              <Text style={styles.cardSubtitleWhite}>View payment reports</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Text style={styles.sectionIconText}>💸</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Expenses</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ExpensePending')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>⏳</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Pending Expenses</Text>
              <Text style={styles.cardSubtitleWhite}>View pending expenses list</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ExpenseFinancePending')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>💰</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Finance Pending</Text>
              <Text style={styles.cardSubtitleWhite}>Finance pending expenses</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
              <Text style={styles.sectionIconText}>📊</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Reports</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ReportsLeads')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📊</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Reports</Text>
                <Text style={styles.cardSubtitleWhite}>View all reports</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
              <Text style={styles.sectionIconText}>🏢</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Warehouse</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('WarehouseDCAtWarehouse')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📦</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>DC At Warehouse</Text>
                <Text style={styles.cardSubtitleWhite}>Process warehouse DCs</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('WarehouseInventoryItems')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Inventory Items</Text>
              <Text style={styles.cardSubtitleWhite}>Manage inventory</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('WarehouseSearchDC')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🔍</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Search DC</Text>
              <Text style={styles.cardSubtitleWhite}>Search delivery challans</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#14B8A6' + '15' }]}>
              <Text style={styles.sectionIconText}>🔄</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Stock Returns</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ReturnsEmployee')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👤</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Employee Returns</Text>
              <Text style={styles.cardSubtitleWhite}>View employee returns list</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('ReturnsWarehouse')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🏢</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Warehouse Returns</Text>
              <Text style={styles.cardSubtitleWhite}>View warehouse returns list</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#EC4899' + '15' }]}>
              <Text style={styles.sectionIconText}>📊</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Sales & Inventory</Text>
        </View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('Sales')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
<View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>💰</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitleWhite}>Sales</Text>
                <Text style={styles.cardSubtitleWhite}>View sales overview</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Text style={styles.cardArrowWhite}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => go('Inventory')}
        >
          <View style={[styles.cardContent, styles.cardContentWhite]}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📦</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitleWhite}>Stock Returns</Text>
              <Text style={styles.cardSubtitleWhite}>Manage returns</Text>
            </View>
            <View style={styles.cardArrowContainer}>
              <Text style={styles.cardArrowWhite}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPartnerDashboard = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Partner</Text>
      <TouchableOpacity style={styles.card} onPress={() => go('PartnerStocks')}>
        <Text style={styles.cardTitleWhite}>Stocks</Text>
        <Text style={styles.cardSubtitleWhite}>View assigned product stock</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => go('PartnerDCs')}>
        <Text style={styles.cardTitleWhite}>My DCs</Text>
        <Text style={styles.cardSubtitleWhite}>Delivery challans for your products</Text>
      </TouchableOpacity>
    </View>
  );

  // Determine which dashboard to show (order matches web Sidebar role precedence)
  const renderDashboardContent = () => {
    if (isPartner || userRole === 'Vendor') return renderPartnerDashboard();
    if (isAdmin) return renderAdminDashboard();
    if (isExecutiveManager) return renderExecutiveManagerDashboard();
    if (isWarehouseExecutive) return renderWarehouseExecutiveDashboard();
    if (isWarehouseManager) return renderWarehouseManagerDashboard();
    if (isTrainer && isSalesBDE) return renderCombinedDashboard();
    if (isTrainer) return renderTrainerDashboard();
    if (isSeniorCoordinator) return renderSeniorCoordinatorDashboard();
    if (isCoordinator) return renderCoordinatorDashboard();
    if (isManager || isFinanceManager) return renderManagerDashboard();
    if (isEmployee || isExecutive) return renderEmployeeDashboard();
    if (isSalesBDE) return renderSalesBDEDashboard();
    // Fallback: unknown role
    return (
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <Text style={styles.cardSubtitleWhite}>No specific dashboard available for your role: {userRole || 'Unknown'}</Text>
        <Text style={[styles.cardSubtitleWhite, { marginTop: 10, fontSize: 12 }]}>
          Roles: {JSON.stringify(userRoles)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
<View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'}</Text>
            <View style={styles.roleBadge}>
              <View style={styles.roleBadgeDot} />
              <Text style={styles.roleBadgeText}>{userRole}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutButtonInner}>
              <Text style={styles.logoutIcon}>🚪</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderDashboardContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    ...typography.body.medium,
    color: colors.textPrimary,
    opacity: 0.95,
    marginBottom: 6,
  },
  userName: {
    ...typography.display.small,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    backdropFilter: 'blur(10px)',
  },
  roleBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  roleBadgeText: {
    ...typography.label.small,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 22,
    opacity: 0.95,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    marginRight: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconText: {
    fontSize: 20,
  },
  sectionTitle: {
    ...typography.heading.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...typography.heading.h3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    ...typography.body.medium,
    color: colors.textPrimary,
    opacity: 0.9,
  },
  cardArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardArrow: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cardContentWhite: {
    padding: 20,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
  },
  cardTitleWhite: {
    ...typography.heading.h3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitleWhite: {
    ...typography.body.medium,
    color: colors.textSecondary,
  },
  cardArrowWhite: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
});

