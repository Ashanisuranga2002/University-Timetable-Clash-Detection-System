import { Stack, Redirect, useSegments } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { CoordinatorAuthProvider, useCoordinatorAuth } from '@/services/CoordinatorAuth';

function CoordinatorRoutes() {
  const { user, loading } = useCoordinatorAuth();
  const segments = useSegments();
  const isLogin = segments.length === 1;
  if (loading) return <ActivityIndicator accessibilityLabel="Loading coordinator session" />;
  if (!user && !isLogin) return <Redirect href="/coordinator" />;
  if (user && isLogin) return <Redirect href="/coordinator/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
export default function CoordinatorLayout() {
  return <CoordinatorAuthProvider><CoordinatorRoutes /></CoordinatorAuthProvider>;
}
