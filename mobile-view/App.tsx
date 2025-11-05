import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native';
import LoginScreen from './src/screens/Auth/LoginScreen';
import FirstTimeAttendanceScreen from './src/screens/Attendance/FirstTimeAttendanceScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import DCCaptureScreen from './src/screens/DC/DCCaptureScreen';
import DCListScreen from './src/screens/DC/DCListScreen';
import PaymentListScreen from './src/screens/Payments/PaymentListScreen';
import ExpenseListScreen from './src/screens/Expenses/ExpenseListScreen';
import LeaveListScreen from './src/screens/Leaves/LeaveListScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading, logout } = useAuth();
  const navigationRef = useNavigationContainerRef();

  // Debug logging
  console.log('AppNavigator - user:', user?.email || 'null', 'loading:', loading);

  // Navigate based on auth state (like web app)
  useEffect(() => {
    if (!loading && navigationRef.isReady()) {
      if (!user) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        // Block Admin/Super Admin - they should use web app
        const userRole = user.role || '';
        if (userRole === 'Super Admin' || userRole === 'Admin') {
          Alert.alert(
            'Access Restricted',
            'Admin and Super Admin roles must use the web application. Please login via the web interface.',
            [{ text: 'OK', onPress: logout }]
          );
          return;
        }
        
        // Always go directly to Dashboard after login (like web app)
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

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="FirstTimeAttendance" component={FirstTimeAttendanceScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="DCList" component={DCListScreen} />
        <Stack.Screen name="DCCapture" component={DCCaptureScreen} />
        <Stack.Screen name="PaymentList" component={PaymentListScreen} />
        <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
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
});

