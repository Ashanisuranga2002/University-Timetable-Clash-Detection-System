import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CoordinatorAuthProvider, useCoordinatorAuth } from '@/services/CoordinatorAuth';
export {
// Catch any errors thrown by the Layout component.
ErrorBoundary } from 'expo-router';
export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf')
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  if (!loaded) {
    return null;
  }
  return <RootLayoutNav />;
}
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CoordinatorAuthProvider>
        <CoordinatorRoutes />
      </CoordinatorAuthProvider>
    </ThemeProvider>;
}
function CoordinatorRoutes() {
  const {
    user,
    loading
  } = useCoordinatorAuth();
  const segments = useSegments();
  useEffect(() => {
    if (loading) return;
    const isLoginRoute = segments[0] === '(tabs)' && !segments[1];
    if (user && isLoginRoute) router.replace('/(tabs)/dashboard');
    if (!user && !isLoginRoute && segments[0] === '(tabs)') router.replace('/(tabs)');
  }, [loading, segments, user]);
  return <Stack>
      <Stack.Screen name="(tabs)" options={{
      headerShown: false
    }} />
      <Stack.Screen name="modal" options={{
      presentation: 'modal'
    }} />
    </Stack>;
}
