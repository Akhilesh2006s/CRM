import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import WorkHubScreen from '../screens/Navigation/WorkHubScreen';
import ReportsLeadsScreen from '../screens/Reports/ReportsLeadsScreen';
import MoreHubScreen from '../screens/Navigation/MoreHubScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { paddingBottom: 4, height: 56 },
        lazy: true,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Menu" component={WorkHubScreen} options={{ tabBarLabel: 'Menu' }} />
      <Tab.Screen name="Reports" component={ReportsLeadsScreen} options={{ tabBarLabel: 'Reports' }} />
      <Tab.Screen name="More" component={MoreHubScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}
