# Mobile App Development Guide

This guide documents the mobile app structure and how to add new screens to match the web dashboard.

## Current Status

### ✅ Completed Screens
- **Auth**
  - LoginScreen
  - FirstTimeAttendanceScreen

- **Dashboard**
  - DashboardScreen (with role-based views)

- **DC Management**
  - DCListScreen
  - DCCaptureScreen
  - DCClosedScreen (NEW - matches web closed sales page)

- **Leads**
  - LeadsListScreen (NEW - with filtering by status)

- **Payments**
  - PaymentListScreen

- **Expenses**
  - ExpenseListScreen

- **Leaves**
  - LeaveListScreen

## 📋 Screens to Create

### Leads Module
- [ ] LeadAddScreen - Add new lead
- [ ] LeadAddNewSchoolScreen - Add new school lead
- [ ] LeadAddRenewalScreen - Add renewal lead
- [ ] LeadEditScreen - Edit existing lead
- [ ] LeadFollowupScreen - Follow-up leads list
- [ ] LeadCloseScreen - Close a lead (convert to client)

### DC Management Module
- [ ] DCCreateScreen - Create new DC
- [ ] DCSavedScreen - Saved DC list
- [ ] DCPendingScreen - Pending DC list
- [ ] DCEmpScreen - Employee DC list
- [ ] DCAdminScreen - Admin DC list
- [ ] DCClientScreen - Client DC list
- [ ] DCEditScreen - Edit DC

### Employees Module
- [ ] EmployeeNewScreen - Add new employee
- [ ] EmployeesActiveScreen - Active employees list
- [ ] EmployeesInactiveScreen - Inactive employees list
- [ ] EmployeesLeavesScreen - Employee leaves

### Executive Managers Module
- [ ] ExecutiveManagersScreen - Managers list
- [ ] ExecutiveManagerNewScreen - Add new manager
- [ ] ExecutiveManagerDashboardScreen - Manager dashboard
- [ ] ExecutiveManagerLeavesScreen - Manager leaves

### Leave Management Module
- [ ] LeavesPendingScreen - Pending leaves
- [ ] LeavesReportScreen - Leaves report
- [ ] LeaveRequestScreen - Request leave
- [ ] LeavesApprovedScreen - Approved leaves

### Training & Services Module
- [ ] TrainingAssignScreen - Assign training
- [ ] TrainingListScreen - Training list
- [ ] TrainingDashboardScreen - Training dashboard
- [ ] TrainingEditScreen - Edit training
- [ ] TrainersNewScreen - Add trainer
- [ ] TrainersActiveScreen - Active trainers
- [ ] TrainersInactiveScreen - Inactive trainers
- [ ] ServicesListScreen - Services list
- [ ] ServiceEditScreen - Edit service

### Warehouse Module
- [ ] WarehouseInventoryItemsScreen - Inventory items list
- [ ] WarehouseInventoryItemNewScreen - Add inventory item
- [ ] WarehouseInventoryItemEditScreen - Edit inventory item
- [ ] WarehouseStockScreen - Stock list
- [ ] WarehouseStockAddScreen - Add stock
- [ ] WarehouseDCAtWarehouseScreen - DC at warehouse
- [ ] WarehouseDCAtWarehouseDetailScreen - DC detail
- [ ] WarehouseCompletedDCScreen - Completed DC
- [ ] WarehouseHoldDCScreen - Hold DC
- [ ] WarehouseDCListedScreen - DC listed

### Stock Returns Module
- [ ] ReturnsEmployeesScreen - Employee returns
- [ ] ReturnsWarehouseScreen - Warehouse returns

### Payments Module (Additional)
- [ ] PaymentAddScreen - Add payment
- [ ] PaymentTransactionReportScreen - Transaction report
- [ ] PaymentApprovalPendingCashScreen - Pending cash approvals
- [ ] PaymentApprovalPendingCashDetailScreen - Cash detail
- [ ] PaymentApprovalPendingChequesScreen - Pending cheque approvals
- [ ] PaymentApprovalPendingChequesDetailScreen - Cheque detail
- [ ] PaymentApprovedScreen - Approved payments
- [ ] PaymentDoneScreen - Done payments
- [ ] PaymentHoldScreen - Hold payments

### Expenses Module (Additional)
- [ ] ExpenseCreateScreen - Create expense
- [ ] ExpenseEditScreen - Edit expense
- [ ] ExpensePendingScreen - Pending expenses
- [ ] ExpenseFinancePendingScreen - Finance pending
- [ ] ExpenseMyScreen - My expenses
- [ ] ExpenseManagerUpdateScreen - Manager update

### Reports Module
- [ ] ReportsLeadsScreen - Leads reports
- [ ] ReportsLeadsOpenScreen - Open leads
- [ ] ReportsLeadsFollowupScreen - Follow-up leads
- [ ] ReportsLeadsClosedScreen - Closed leads
- [ ] ReportsSalesVisitScreen - Sales visit
- [ ] ReportsEmployeeTrackScreen - Employee track
- [ ] ReportsContactQueriesScreen - Contact queries
- [ ] ReportsChangeLogsScreen - Change logs
- [ ] ReportsStockScreen - Stock reports
- [ ] ReportsDCScreen - DC reports
- [ ] ReportsReturnsScreen - Returns reports
- [ ] ReportsExpensesScreen - Expenses reports
- [ ] ReportsTrainingServiceScreen - Training/service reports

### Products Module
- [ ] ProductsListScreen - Products list
- [ ] ProductNewScreen - Add product

### Settings Module
- [ ] SettingsPasswordScreen - Change password
- [ ] SettingsUploadScreen - Data upload
- [ ] SettingsSMSScreen - SMS settings
- [ ] SettingsBackupScreen - DB backup

## 📁 File Structure

```
mobile-view/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Attendance/
│   │   ├── Dashboard/
│   │   ├── DC/
│   │   ├── Leads/
│   │   ├── Payments/
│   │   ├── Expenses/
│   │   ├── Leaves/
│   │   ├── Employees/
│   │   ├── ExecutiveManagers/
│   │   ├── Training/
│   │   ├── Warehouse/
│   │   ├── Returns/
│   │   ├── Reports/
│   │   ├── Products/
│   │   └── Settings/
│   ├── components/
│   ├── context/
│   ├── navigation/
│   ├── services/
│   └── theme/
├── App.tsx
└── package.json
```

## 🎨 Screen Pattern

Each screen should follow this pattern:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';

export default function YourScreen({ navigation }: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/your-endpoint');
      const data = Array.isArray(response) ? response : (response?.data || []);
      setData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Screen Title</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Your content here */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ... other styles
});
```

## 🔗 Adding Routes

1. **Create the screen file** in the appropriate directory
2. **Import it in App.tsx**:
   ```typescript
   import YourScreen from './src/screens/YourModule/YourScreen';
   ```
3. **Add the route** in the Stack.Navigator:
   ```typescript
   <Stack.Screen name="YourScreen" component={YourScreen} />
   ```
4. **Add navigation type** in `src/navigation/types.ts`:
   ```typescript
   YourScreen: { param1?: string };
   ```

## 🎯 Key Features to Implement

### Common Features Across Screens:
1. **Pull to Refresh** - All list screens should support pull-to-refresh
2. **Loading States** - Show loading indicators while fetching data
3. **Error Handling** - Display user-friendly error messages
4. **Empty States** - Show helpful messages when no data is available
5. **Navigation** - Consistent back button and header styling
6. **Search/Filter** - Add search and filter capabilities where needed
7. **Pagination** - For large lists, implement pagination or infinite scroll

### Role-Based Access:
- Check user role in each screen
- Show/hide features based on permissions
- Redirect unauthorized users

## 📱 API Integration

All API calls should use the shared `apiService` from `../../services/api`:
```typescript
import { apiService } from '../../services/api';
```

Common API endpoints (match web app):
- `/leads` - Leads
- `/dc-orders` - DC Orders
- `/dc` - DCs
- `/employees` - Employees
- `/payments` - Payments
- `/expenses` - Expenses
- `/leaves` - Leaves
- `/training` - Training
- `/warehouse` - Warehouse
- `/products` - Products
- `/reports` - Reports

## 🎨 Design Guidelines

1. **Colors**: Use theme colors from `src/theme/colors.ts`
2. **Typography**: Use typography from `src/theme/typography.ts`
3. **Spacing**: Consistent padding (16px, 20px, 24px)
4. **Cards**: Rounded corners (16px), shadow for elevation
5. **Buttons**: Gradient backgrounds for primary actions
6. **Icons**: Use emoji icons for quick visual identification

## 🚀 Next Steps

1. Create screens in priority order:
   - Leads (Add, Edit, Close) - High priority
   - DC Management (Create, Edit) - High priority
   - Reports - Medium priority
   - Warehouse - Medium priority
   - Settings - Low priority

2. Test each screen:
   - Loading states
   - Error handling
   - Empty states
   - Navigation flow

3. Add features:
   - Search functionality
   - Filtering
   - Sorting
   - Pagination

## 📝 Notes

- All screens should match the web dashboard functionality
- Use the same API endpoints as the web app
- Maintain consistent UI/UX patterns
- Test on both iOS and Android
- Handle offline scenarios gracefully


