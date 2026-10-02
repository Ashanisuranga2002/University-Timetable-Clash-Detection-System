import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <Stack>
        {/* Unified login — handles students & admins */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Student screens */}
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="course-selection" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />

        {/* Admin screen (reached from unified login) */}
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}