// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import NetWorthScreen from './src/screens/NetWorthScreen';
import CashFlowScreen from './src/screens/CashFlowScreen';
import MutualFundsScreen from './src/screens/MutualFundsScreen';
import PlanScreen, { SettingsScreen } from './src/screens/PlanScreen';
import { colors, fonts } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Tab icons (text-based, replace with react-native-vector-icons later)
const TAB_ICONS = {
  Overview:     { active: '⬛', label: '⊞' },
  'Net Worth':  { active: '📈', label: '📈' },
  'Cash Flow':  { active: '💰', label: '💰' },
  'MF':         { active: '📊', label: '📊' },
  Plan:         { active: '📋', label: '📋' },
  Settings:     { active: '⚙️', label: '⚙️' },
};

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle:        { backgroundColor: colors.navy },
        headerTintColor:    colors.white,
        headerTitleStyle:   { fontFamily: fonts.semibold, fontSize: 16 },
        tabBarStyle:        { backgroundColor: colors.navy, borderTopColor: 'rgba(255,255,255,0.08)', height: 64, paddingBottom: 10 },
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
        tabBarLabelStyle:   { fontSize: 10, fontFamily: fonts.medium, marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => (
          <Text style={{ fontSize: 20, color }}>{focused ? '●' : '○'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Overview"   component={OverviewScreen}     options={{ title: 'Overview' }} />
      <Tab.Screen name="Net Worth"  component={NetWorthScreen}     options={{ title: 'Net Worth' }} />
      <Tab.Screen name="Cash Flow"  component={CashFlowScreen}     options={{ title: 'Cash Flow' }} />
      <Tab.Screen name="MF"         component={MutualFundsScreen}  options={{ title: 'Mutual Funds' }} />
      <Tab.Screen name="Plan"       component={PlanScreen}         options={{ title: 'My Plan' }} />
      <Tab.Screen name="Settings"   component={SettingsScreen}     options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { auth, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, color: colors.white, fontFamily: fonts.semibold, marginBottom: 24 }}>
        fleek<Text style={{ color: colors.accent }}>.</Text>finance
      </Text>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!auth
          ? <Stack.Screen name="Login" component={LoginScreen} />
          : <Stack.Screen name="Main"  component={ClientTabs} />
        }
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
