
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(tabs)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'schedule',
      route: '/(tabs)/schedule',
      icon: 'calendar-today',
      label: 'Schedule',
    },
    {
      name: 'speakers',
      route: '/(tabs)/speakers',
      icon: 'person',
      label: 'Speakers',
    },
    {
      name: 'exhibitors',
      route: '/(tabs)/exhibitors',
      icon: 'store',
      label: 'Exhibitors',
    },
    {
      name: 'my-schedule',
      route: '/(tabs)/my-schedule',
      icon: 'favorite',
      label: 'My Schedule',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="speakers" />
        <Stack.Screen name="exhibitors" />
        <Stack.Screen name="sponsors" />
        <Stack.Screen name="ports" />
        <Stack.Screen name="my-schedule" />
        <Stack.Screen name="speaker/[id]" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
