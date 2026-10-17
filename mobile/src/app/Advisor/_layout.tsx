// mobile/src/app/(advisor)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdvisorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the default top header so you can build custom ones
        tabBarActiveTintColor: '#4A3AFF', // The active purple color
        tabBarInactiveTintColor: '#A0A0A0', // The inactive grey color[cite: 46]
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      {/* 1. Dashboard Tab[cite: 46] */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 2. Timetable Tab[cite: 46] */}
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 3. Requests Tab[cite: 46] */}
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 4. Profile Tab[cite: 46] */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 
        Sub-screens (Hidden from the bottom tab bar)
        Setting `href: null` prevents the icon from showing up on the bottom bar, 
        but you can still navigate to it using router.push('/review-request')
      */}
      <Tabs.Screen
        name="review-request"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}