
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="schedule" name="schedule">
        <Icon sf={{ default: 'calendar', selected: 'calendar.badge.clock' }} drawable="calendar-today" />
        <Label>Schedule</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="speakers" name="speakers">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} drawable="person" />
        <Label>Speakers</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="exhibitors" name="exhibitors">
        <Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} drawable="store" />
        <Label>Exhibitors</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="my-schedule" name="my-schedule">
        <Icon sf={{ default: 'heart', selected: 'heart.fill' }} drawable="favorite" />
        <Label>My Schedule</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
