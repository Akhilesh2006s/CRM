import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import LoginScreen from './src/screens/Auth/LoginScreen';
import FirstTimeAttendanceScreen from './src/screens/Attendance/FirstTimeAttendanceScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import DCCaptureScreen from './src/screens/DC/DCCaptureScreen';
import DCListScreen from './src/screens/DC/DCListScreen';
import DCClosedScreen from './src/screens/DC/DCClosedScreen';
import DCCompletedScreen from './src/screens/DC/DCCompletedScreen';
import PaymentListScreen from './src/screens/Payments/PaymentListScreen';
import ExpenseListScreen from './src/screens/Expenses/ExpenseListScreen';
import ExpenseCreateScreen from './src/screens/Expenses/ExpenseCreateScreen';
import ExpenseEditScreen from './src/screens/Expenses/ExpenseEditScreen';
import ExpensePendingScreen from './src/screens/Expenses/ExpensePendingScreen';
import ExpenseFinancePendingScreen from './src/screens/Expenses/ExpenseFinancePendingScreen';
import ExpenseMyScreen from './src/screens/Expenses/ExpenseMyScreen';
import ExpenseManagerUpdateScreen from './src/screens/Expenses/ExpenseManagerUpdateScreen';
import LeaveListScreen from './src/screens/Leaves/LeaveListScreen';
import LeadsListScreen from './src/screens/Leads/LeadsListScreen';
import LeadAddScreen from './src/screens/Leads/LeadAddScreen';
import LeadAddNewSchoolScreen from './src/screens/Leads/LeadAddNewSchoolScreen';
import LeadAddRenewalScreen from './src/screens/Leads/LeadAddRenewalScreen';
import LeadFollowupScreen from './src/screens/Leads/LeadFollowupScreen';
import LeadEditScreen from './src/screens/Leads/LeadEditScreen';
import LeadCloseScreen from './src/screens/Leads/LeadCloseScreen';
import DCCreateScreen from './src/screens/DC/DCCreateScreen';
import DCSavedScreen from './src/screens/DC/DCSavedScreen';
import DCPendingScreen from './src/screens/DC/DCPendingScreen';
import DCPendingOpenScreen from './src/screens/DC/DCPendingOpenScreen';
import DCAdminMyScreen from './src/screens/DC/DCAdminMyScreen';
import DCEditScreen from './src/screens/DC/DCEditScreen';
import DCManagerScreen from './src/screens/DC/DCManagerScreen';
import DCClientScreen from './src/screens/DC/DCClientScreen';
import DCRequestSummaryScreen from './src/screens/DC/DCRequestSummaryScreen';
import ClientEditPOScreen from './src/screens/Clients/ClientEditPOScreen';
import DCEmpScreen from './src/screens/DC/DCEmpScreen';
import EmployeeNewScreen from './src/screens/Employees/EmployeeNewScreen';
import EmployeesActiveScreen from './src/screens/Employees/EmployeesActiveScreen';
import EmployeesInactiveScreen from './src/screens/Employees/EmployeesInactiveScreen';
import EmployeesLeavesScreen from './src/screens/Employees/EmployeesLeavesScreen';
import ExecutiveManagersScreen from './src/screens/ExecutiveManagers/ExecutiveManagersScreen';
import ExecutiveManagerNewScreen from './src/screens/ExecutiveManagers/ExecutiveManagerNewScreen';
import ExecutiveManagerDashboardScreen from './src/screens/ExecutiveManagers/ExecutiveManagerDashboardScreen';
import ExecutiveManagerLeavesScreen from './src/screens/ExecutiveManagers/ExecutiveManagerLeavesScreen';
import POChangeRequestsScreen from './src/screens/ExecutiveManagers/POChangeRequestsScreen';
import POChangeRequestDetailScreen from './src/screens/ExecutiveManagers/POChangeRequestDetailScreen';
import LeavesPendingScreen from './src/screens/Leaves/LeavesPendingScreen';
import LeavesReportScreen from './src/screens/Leaves/LeavesReportScreen';
import LeaveRequestScreen from './src/screens/Leaves/LeaveRequestScreen';
import LeavesApprovedScreen from './src/screens/Leaves/LeavesApprovedScreen';
import TrainingAssignScreen from './src/screens/Training/TrainingAssignScreen';
import TrainingListScreen from './src/screens/Training/TrainingListScreen';
import TrainingDashboardScreen from './src/screens/Training/TrainingDashboardScreen';
import TrainingEditScreen from './src/screens/Training/TrainingEditScreen';
import TrainersNewScreen from './src/screens/Training/TrainersNewScreen';
import TrainersActiveScreen from './src/screens/Training/TrainersActiveScreen';
import TrainersInactiveScreen from './src/screens/Training/TrainersInactiveScreen';
import ServicesListScreen from './src/screens/Training/ServicesListScreen';
import ServiceEditScreen from './src/screens/Training/ServiceEditScreen';
import TrainingTrainerMyScreen from './src/screens/Training/TrainingTrainerMyScreen';
import TrainingTrainerCompletedScreen from './src/screens/Training/TrainingTrainerCompletedScreen';
import WarehouseInventoryItemsScreen from './src/screens/Warehouse/WarehouseInventoryItemsScreen';
import WarehouseInventoryItemNewScreen from './src/screens/Warehouse/WarehouseInventoryItemNewScreen';
import WarehouseInventoryItemEditScreen from './src/screens/Warehouse/WarehouseInventoryItemEditScreen';
import WarehouseStockScreen from './src/screens/Warehouse/WarehouseStockScreen';
import WarehouseStockAddScreen from './src/screens/Warehouse/WarehouseStockAddScreen';
import WarehouseDCAtWarehouseScreen from './src/screens/Warehouse/WarehouseDCAtWarehouseScreen';
import WarehouseDCAtWarehouseDetailScreen from './src/screens/Warehouse/WarehouseDCAtWarehouseDetailScreen';
import WarehouseCompletedDCScreen from './src/screens/Warehouse/WarehouseCompletedDCScreen';
import WarehouseHoldDCScreen from './src/screens/Warehouse/WarehouseHoldDCScreen';
import WarehouseDCListedScreen from './src/screens/Warehouse/WarehouseDCListedScreen';
import WarehouseSearchDCScreen from './src/screens/Warehouse/WarehouseSearchDCScreen';
import DCTermWiseScreen from './src/screens/DC/DCTermWiseScreen';
import DCTermWiseRequestDCScreen from './src/screens/DC/DCTermWiseRequestDCScreen';
import ProductsListScreen from './src/screens/Products/ProductsListScreen';
import ProductNewScreen from './src/screens/Products/ProductNewScreen';
import ProductEditScreen from './src/screens/Products/ProductEditScreen';
import SalesScreen from './src/screens/Sales/SalesScreen';
import ClientsClosedSalesScreen from './src/screens/Clients/ClientsClosedSalesScreen';
import InventoryScreen from './src/screens/Inventory/InventoryScreen';
import ReturnsEmployeeScreen from './src/screens/Returns/ReturnsEmployeeScreen';
import StockReturnAddScreen from './src/screens/Returns/StockReturnAddScreen';
import ReturnsWarehouseScreen from './src/screens/Returns/ReturnsWarehouseScreen';
import ReturnsWarehouseExecutiveScreen from './src/screens/Returns/ReturnsWarehouseExecutiveScreen';
import StockReturnWarehouseVerifyScreen from './src/screens/Returns/StockReturnWarehouseVerifyScreen';
import ReturnsWarehouseManagerScreen from './src/screens/Returns/ReturnsWarehouseManagerScreen';
import StockReturnWarehouseManagerReviewScreen from './src/screens/Returns/StockReturnWarehouseManagerReviewScreen';
import SamplesRequestScreen from './src/screens/Samples/SamplesRequestScreen';
import ExecutivesAssignAreasScreen from './src/screens/Executives/ExecutivesAssignAreasScreen';
import PaymentAddScreen from './src/screens/Payments/PaymentAddScreen';
import PaymentApprovalPendingCashScreen from './src/screens/Payments/PaymentApprovalPendingCashScreen';
import PaymentApprovalPendingCashDetailScreen from './src/screens/Payments/PaymentApprovalPendingCashDetailScreen';
import PaymentApprovalPendingChequesScreen from './src/screens/Payments/PaymentApprovalPendingChequesScreen';
import PaymentApprovalPendingChequesDetailScreen from './src/screens/Payments/PaymentApprovalPendingChequesDetailScreen';
import PaymentApprovedScreen from './src/screens/Payments/PaymentApprovedScreen';
import PaymentDoneScreen from './src/screens/Payments/PaymentDoneScreen';
import PaymentHoldScreen from './src/screens/Payments/PaymentHoldScreen';
import PaymentTransactionReportScreen from './src/screens/Payments/PaymentTransactionReportScreen';
import ReportsLeadsScreen from './src/screens/Reports/ReportsLeadsScreen';
import ReportsLeadsOpenScreen from './src/screens/Reports/ReportsLeadsOpenScreen';
import ReportsLeadsFollowupScreen from './src/screens/Reports/ReportsLeadsFollowupScreen';
import ReportsLeadsClosedScreen from './src/screens/Reports/ReportsLeadsClosedScreen';
import ReportsSalesVisitScreen from './src/screens/Reports/ReportsSalesVisitScreen';
import ReportsEmployeeTrackScreen from './src/screens/Reports/ReportsEmployeeTrackScreen';
import ReportsContactQueriesScreen from './src/screens/Reports/ReportsContactQueriesScreen';
import ReportsChangeLogsScreen from './src/screens/Reports/ReportsChangeLogsScreen';
import ReportsStockScreen from './src/screens/Reports/ReportsStockScreen';
import ReportsDCScreen from './src/screens/Reports/ReportsDCScreen';
import ReportsReturnsScreen from './src/screens/Reports/ReportsReturnsScreen';
import ReportsExpensesScreen from './src/screens/Reports/ReportsExpensesScreen';
import ReportsTrainingServiceScreen from './src/screens/Reports/ReportsTrainingServiceScreen';
import PlaceholderScreen from './src/screens/Common/PlaceholderScreen';
import SettingsPasswordScreen from './src/screens/Settings/SettingsPasswordScreen';
import SettingsUploadScreen from './src/screens/Settings/SettingsUploadScreen';
import SettingsSMSScreen from './src/screens/Settings/SettingsSMSScreen';
import SettingsBackupScreen from './src/screens/Settings/SettingsBackupScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useEffect, useCallback } from 'react';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading, logout } = useAuth();
  const navigationRef = useNavigationContainerRef();

  // Debug logging
  console.log('AppNavigator - user:', user?.email || 'null', 'loading:', loading);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          if (navigationRef.isReady()) {
            navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        },
      },
    ]);
  }, [logout]);

  // Navigate based on auth state
  useEffect(() => {
    if (!loading && navigationRef.isReady()) {
      if (!user) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        navigationRef.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      }
    }
  }, [user, loading, navigationRef]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  // Default screen options with logout button for all authenticated screens
  const defaultScreenOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: '#007AFF',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerRight: () => (
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutHeaderButton}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutHeaderText}>Logout</Text>
      </TouchableOpacity>
    ),
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator 
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FirstTimeAttendance" 
          component={FirstTimeAttendanceScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ headerShown: false }}
        />
        {/* Leads */}
        <Stack.Screen name="LeadsList" component={LeadsListScreen} />
        <Stack.Screen name="LeadAdd" component={LeadAddScreen} />
        <Stack.Screen name="LeadAddNewSchool" component={LeadAddNewSchoolScreen} />
        <Stack.Screen name="LeadAddRenewal" component={LeadAddRenewalScreen} />
        <Stack.Screen name="LeadFollowup" component={LeadFollowupScreen} />
        <Stack.Screen name="LeadEdit" component={LeadEditScreen} />
        <Stack.Screen name="LeadClose" component={LeadCloseScreen} />
        
        {/* DC Management */}
        <Stack.Screen name="DCList" component={DCListScreen} />
        <Stack.Screen name="DCCapture" component={DCCaptureScreen} />
        <Stack.Screen name="DCClosed" component={DCClosedScreen} />
        <Stack.Screen name="DCCompleted" component={DCCompletedScreen} />
        <Stack.Screen name="DCCreate" component={DCCreateScreen} />
        <Stack.Screen name="DCSaved" component={DCSavedScreen} />
        <Stack.Screen name="DCPending" component={DCPendingScreen} />
        <Stack.Screen name="DCPendingOpen" component={DCPendingOpenScreen} />
        <Stack.Screen name="DCAdminMy" component={DCAdminMyScreen} />
        <Stack.Screen name="DCEdit" component={DCEditScreen} />
        <Stack.Screen name="DCManager" component={DCManagerScreen} />
        <Stack.Screen name="DCClient" component={DCClientScreen} />
        <Stack.Screen name="DCRequestSummary" component={DCRequestSummaryScreen} />
        <Stack.Screen name="ClientEditPO" component={ClientEditPOScreen} />
        <Stack.Screen name="DCEmp" component={DCEmpScreen} />
        <Stack.Screen name="DCAdmin" component={PlaceholderScreen} />
        
        {/* Employees */}
        <Stack.Screen name="EmployeeNew" component={EmployeeNewScreen} />
        <Stack.Screen name="EmployeesActive" component={EmployeesActiveScreen} />
        <Stack.Screen name="EmployeesInactive" component={EmployeesInactiveScreen} />
        <Stack.Screen name="EmployeesLeaves" component={EmployeesLeavesScreen} />
        
        {/* Executive Managers */}
        <Stack.Screen name="ExecutiveManagers" component={ExecutiveManagersScreen} />
        <Stack.Screen name="ExecutiveManagerNew" component={ExecutiveManagerNewScreen} />
        <Stack.Screen name="ExecutiveManagerDashboard" component={ExecutiveManagerDashboardScreen} />
        <Stack.Screen name="ExecutiveManagerLeaves" component={ExecutiveManagerLeavesScreen} />
        <Stack.Screen name="POChangeRequests" component={POChangeRequestsScreen} />
        <Stack.Screen name="POChangeRequestDetail" component={POChangeRequestDetailScreen} />
        
        {/* Leave Management */}
        <Stack.Screen name="LeavesPending" component={LeavesPendingScreen} />
        <Stack.Screen name="LeavesReport" component={LeavesReportScreen} />
        <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
        <Stack.Screen name="LeavesApproved" component={LeavesApprovedScreen} />
        
        {/* Training & Services */}
        <Stack.Screen name="TrainingAssign" component={TrainingAssignScreen} />
        <Stack.Screen name="TrainingList" component={TrainingListScreen} />
        <Stack.Screen name="TrainingDashboard" component={TrainingDashboardScreen} />
        <Stack.Screen name="TrainingEdit" component={TrainingEditScreen} />
        <Stack.Screen name="TrainersNew" component={TrainersNewScreen} />
        <Stack.Screen name="TrainersActive" component={TrainersActiveScreen} />
        <Stack.Screen name="TrainersInactive" component={TrainersInactiveScreen} />
        <Stack.Screen name="ServicesList" component={ServicesListScreen} />
        <Stack.Screen name="ServiceEdit" component={ServiceEditScreen} />
        <Stack.Screen name="TrainingTrainerMy" component={TrainingTrainerMyScreen} />
        <Stack.Screen name="TrainingTrainerCompleted" component={TrainingTrainerCompletedScreen} />
        
        {/* Warehouse */}
        <Stack.Screen name="WarehouseInventoryItems" component={WarehouseInventoryItemsScreen} />
        <Stack.Screen name="WarehouseInventoryItemNew" component={WarehouseInventoryItemNewScreen} />
        <Stack.Screen name="WarehouseInventoryItemEdit" component={WarehouseInventoryItemEditScreen} />
        <Stack.Screen name="WarehouseStock" component={WarehouseStockScreen} />
        <Stack.Screen name="WarehouseStockAdd" component={WarehouseStockAddScreen} />
        <Stack.Screen name="WarehouseDCAtWarehouse" component={WarehouseDCAtWarehouseScreen} />
        <Stack.Screen name="WarehouseDCAtWarehouseDetail" component={WarehouseDCAtWarehouseDetailScreen} />
        <Stack.Screen name="WarehouseCompletedDC" component={WarehouseCompletedDCScreen} />
        <Stack.Screen name="WarehouseHoldDC" component={WarehouseHoldDCScreen} />
        <Stack.Screen name="WarehouseDCListed" component={WarehouseDCListedScreen} />
        <Stack.Screen name="WarehouseSearchDC" component={WarehouseSearchDCScreen} />
        
        {/* Term-Wise DC */}
        <Stack.Screen name="DCTermWise" component={DCTermWiseScreen} />
        <Stack.Screen name="DCTermWiseRequestDC" component={DCTermWiseRequestDCScreen} />
        
        {/* Payments */}
        <Stack.Screen name="PaymentList" component={PaymentListScreen} />
        <Stack.Screen name="PaymentAdd" component={PaymentAddScreen} />
        <Stack.Screen name="PaymentTransactionReport" component={PaymentTransactionReportScreen} />
        <Stack.Screen name="PaymentApprovalPendingCash" component={PaymentApprovalPendingCashScreen} />
        <Stack.Screen name="PaymentApprovalPendingCashDetail" component={PaymentApprovalPendingCashDetailScreen} />
        <Stack.Screen name="PaymentApprovalPendingCheques" component={PaymentApprovalPendingChequesScreen} />
        <Stack.Screen name="PaymentApprovalPendingChequesDetail" component={PaymentApprovalPendingChequesDetailScreen} />
        <Stack.Screen name="PaymentApproved" component={PaymentApprovedScreen} />
        <Stack.Screen name="PaymentDone" component={PaymentDoneScreen} />
        <Stack.Screen name="PaymentHold" component={PaymentHoldScreen} />
        
        {/* Expenses */}
        <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
        <Stack.Screen name="ExpenseCreate" component={ExpenseCreateScreen} />
        <Stack.Screen name="ExpenseEdit" component={ExpenseEditScreen} />
        <Stack.Screen name="ExpensePending" component={ExpensePendingScreen} />
        <Stack.Screen name="ExpenseFinancePending" component={ExpenseFinancePendingScreen} />
        <Stack.Screen name="ExpenseMy" component={ExpenseMyScreen} />
        <Stack.Screen name="ExpenseManagerUpdate" component={ExpenseManagerUpdateScreen} />
        
        {/* Reports */}
        <Stack.Screen name="ReportsLeads" component={ReportsLeadsScreen} />
        <Stack.Screen name="ReportsLeadsOpen" component={ReportsLeadsOpenScreen} />
        <Stack.Screen name="ReportsLeadsFollowup" component={ReportsLeadsFollowupScreen} />
        <Stack.Screen name="ReportsLeadsClosed" component={ReportsLeadsClosedScreen} />
        <Stack.Screen name="ReportsSalesVisit" component={ReportsSalesVisitScreen} />
        <Stack.Screen name="ReportsEmployeeTrack" component={ReportsEmployeeTrackScreen} />
        <Stack.Screen name="ReportsContactQueries" component={ReportsContactQueriesScreen} />
        <Stack.Screen name="ReportsChangeLogs" component={ReportsChangeLogsScreen} />
        <Stack.Screen name="ReportsStock" component={ReportsStockScreen} />
        <Stack.Screen name="ReportsDC" component={ReportsDCScreen} />
        <Stack.Screen name="ReportsReturns" component={ReportsReturnsScreen} />
        <Stack.Screen name="ReportsExpenses" component={ReportsExpensesScreen} />
        <Stack.Screen name="ReportsTrainingService" component={ReportsTrainingServiceScreen} />
        
        {/* Products */}
        <Stack.Screen name="ProductsList" component={ProductsListScreen} />
        <Stack.Screen name="ProductNew" component={ProductNewScreen} />
        <Stack.Screen name="ProductEdit" component={ProductEditScreen} />
        
        {/* Sales */}
        <Stack.Screen name="Sales" component={SalesScreen} />
        
        {/* Inventory */}
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        
        {/* Returns */}
        <Stack.Screen name="ReturnsEmployee" component={ReturnsEmployeeScreen} />
        <Stack.Screen name="StockReturnAdd" component={StockReturnAddScreen} />
        <Stack.Screen name="ReturnsWarehouse" component={ReturnsWarehouseScreen} />
        <Stack.Screen name="ReturnsWarehouseExecutive" component={ReturnsWarehouseExecutiveScreen} />
        <Stack.Screen name="StockReturnWarehouseVerify" component={StockReturnWarehouseVerifyScreen} />
        <Stack.Screen name="ReturnsWarehouseManager" component={ReturnsWarehouseManagerScreen} />
        <Stack.Screen name="StockReturnWarehouseManagerReview" component={StockReturnWarehouseManagerReviewScreen} />
        
        {/* Clients (Executive Manager PO Edit) */}
        <Stack.Screen name="ClientsClosedSales" component={ClientsClosedSalesScreen} />
        
        {/* Samples */}
        <Stack.Screen name="SamplesRequest" component={SamplesRequestScreen} />
        
        {/* Executives */}
        <Stack.Screen name="ExecutivesAssignAreas" component={ExecutivesAssignAreasScreen} />
        
        {/* Settings */}
        <Stack.Screen name="SettingsPassword" component={SettingsPasswordScreen} />
        <Stack.Screen name="SettingsUpload" component={SettingsUploadScreen} />
        <Stack.Screen name="SettingsSMS" component={SettingsSMSScreen} />
        <Stack.Screen name="SettingsBackup" component={SettingsBackupScreen} />
        
        {/* Leaves */}
        <Stack.Screen name="LeaveList" component={LeaveListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  logoutHeaderButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

