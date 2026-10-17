// ===============================================================
// Admin Portal Navigation Layout
// Stack navigator defining routes and transitions for all Admin screens
// ===============================================================

import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AC } from '@/constants/adminTheme';

export default function AdminLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AC.bgApp },
        }}
      >
        {/* Core Admin Screens */}
        <Stack.Screen name="index" />                                              {/* Admin Dashboard */}
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />{/* Admin Profile */}
        <Stack.Screen name="service-status" />                                      {/* Infrastructure Monitor */}
        <Stack.Screen name="system-health" />                                       {/* Live System Health */}
        <Stack.Screen name="alerts" />                                              {/* Incident Alerts */}
        <Stack.Screen name="issue-details" options={{ animation: 'slide_from_right' }} /> {/* Incident Detail View */}

        {/* User Management Sub-routes */}
        <Stack.Screen name="users/index" options={{ animation: 'slide_from_right' }} />    {/* User Directory */}
        <Stack.Screen name="users/add" options={{ animation: 'slide_from_right' }} />      {/* Create User Form */}
        <Stack.Screen name="users/[id]" options={{ animation: 'slide_from_right' }} />     {/* User Details View */}
        <Stack.Screen name="users/edit/[id]" options={{ animation: 'slide_from_right' }} />{/* Edit User Form */}

        {/* Monitor Management Sub-routes */}
        <Stack.Screen name="monitors/index" options={{ animation: 'slide_from_right' }} />    {/* Monitor Directory */}
        <Stack.Screen name="monitors/add" options={{ animation: 'slide_from_right' }} />      {/* Create Monitor Form */}
        <Stack.Screen name="monitors/[id]" options={{ animation: 'slide_from_right' }} />     {/* Monitor Details View */}
        <Stack.Screen name="monitors/edit/[id]" options={{ animation: 'slide_from_right' }} />{/* Edit Monitor Form */}
      </Stack>
    </SafeAreaProvider>
  );
}

