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
        <Stack.Screen name="index" />
        <Stack.Screen name="service-status" />
        <Stack.Screen name="system-health" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="issue-details" options={{ animation: 'slide_from_right' }} />

        {/* User Management */}
        <Stack.Screen name="users/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="users/add" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="users/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="users/edit/[id]" options={{ animation: 'slide_from_right' }} />

        {/* Monitor Management */}
        <Stack.Screen name="monitors/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="monitors/add" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="monitors/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="monitors/edit/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
