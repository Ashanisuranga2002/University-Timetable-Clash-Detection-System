import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Standard icon library included with Expo

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the default top header so you can use your custom UI headers
        tabBarActiveTintColor: '#4A3AFF', // The active purple color from your Figma designs
        tabBarInactiveTintColor: '#A0A0A0', // The inactive grey color
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      {/* 
        1. Main Timetable Tab 
        The 'name' must exactly match your filename: 'timetable-preview'
      */}
      <Tabs.Screen
        name="timetable-preview"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 
        2. Sub-screens (Hidden from the bottom tab bar)
        Setting `href: null` prevents an icon from showing up on the bottom bar, 
        but still allows you to navigate to these screens using router.push()
      */}
      <Tabs.Screen
        name="alternative-subgroups"
        options={{
          href: null, 
        }}
      />

      <Tabs.Screen name="schedule-conflict" options={{ href: null }} />
      <Tabs.Screen name="advisor-request" options={{ href: null }} />

      <Tabs.Screen
        name="registration-confirmation"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}
