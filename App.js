// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import NetWorthScreen from './src/screens/NetWorthScreen';
import CashFlowScreen from './src/screens/CashFlowScreen';
import MutualFundsScreen from './src/screens/MutualFundsScreen';
import PlanScreen, { SettingsScreen } from './src/screens/PlanScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import RiskProfileScreen from './src/screens/RiskProfileScreen';
import { colors, fonts } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Tab icon map — simple text icons, replace with vector icons later
const TAB_ICON = {
  Overview:   { icon: '⊞', label: 'Overview' },
  Worth:      { icon: '📊', label: 'Net Worth' },
  Cash:       { icon: '💰', label: 'Cash Flow' },
  MF:         { icon: '📈', label: 'MF' },
  Goals:      { icon: '🎯', label: 'Goals' },
  Risk:       { icon: '🛡️', label: 'Risk' },
  Plan:       { icon: '📋', label: 'Plan' },
  Settings:   { icon: '⚙️', label: 'Settings' },
};

function TabIcon({ name, focused, color }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, color, opacity: focused ? 1 : 0.5 }}>
        {TAB_ICON[name]?.icon || '○'}
      </Text>
    </View>
  );
}

function ClientTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle:             { backgroundColor: colors.navy },
        headerTintColor:         colors.white,
        headerTitleStyle:        { fontFamily: fonts.semibold, fontSize: 16 },
        tabBarStyle: {
          backgroundColor:  colors.navy,
          borderTopColor:   'rgba(255,255,255,0.1)',
          borderTopWidth:   1,
          height:           56 + insets.bottom,
          paddingBottom:    insets.bottom || 8,
          paddingTop:       6,
        },
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: {
          fontSize:     9,
          fontFamily:   fonts.medium,
          marginTop:    1,
          letterSpacing: 0.2,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Overview"  component={OverviewScreen}    options={{ title: 'Overview' }} />
      <Tab.Screen name="Worth"     component={NetWorthScreen}    options={{ title: 'Net Worth',   tabBarLabel: 'Net Worth' }} />
      <Tab.Screen name="Cash"      component={CashFlowScreen}    options={{ title: 'Cash Flow',   tabBarLabel: 'Cash Flow' }} />
      <Tab.Screen name="MF"        component={MutualFundsScreen} options={{ title: 'Mutual Funds', tabBarLabel: 'MF' }} />
      <Tab.Screen name="Goals"     component={GoalsScreen}       options={{ title: 'Goals' }} />
      <Tab.Screen name="Risk"      component={RiskProfileScreen} options={{ title: 'Risk Profile', tabBarLabel: 'Risk' }} />
      <Tab.Screen name="Plan"      component={PlanScreen}        options={{ title: 'My Plan',     tabBarLabel: 'Plan' }} />
      <Tab.Screen name="Settings"  component={SettingsScreen}    options={{ title: 'Settings' }} />
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
