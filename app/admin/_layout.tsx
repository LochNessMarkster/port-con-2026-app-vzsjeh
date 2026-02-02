
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AdminLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="sponsors" />
        <Stack.Screen name="exhibitors" />
        <Stack.Screen name="speakers" />
        <Stack.Screen name="sessions" />
        <Stack.Screen name="rooms" />
        <Stack.Screen name="ports" />
        <Stack.Screen name="airtable-info" />
        <Stack.Screen name="check-airtable-fields" />
        <Stack.Screen name="google-sheets-sync" />
      </Stack>
    </AuthProvider>
  );
}
