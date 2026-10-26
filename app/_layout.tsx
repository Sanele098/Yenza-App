import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider, useApp } from '@/context/AppContext';
import { DrawerProvider } from '@/context/DrawerContext';
import { AppDrawer } from '@/components/AppDrawer';
import { COLORS } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated, isAuthLoading, role } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isAuthLoading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'register-employer';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(role === 'employer' ? '/(tabs)/home' : '/(tabs)/jobs');
    }
  }, [isAuthenticated, isAuthLoading, segments]);

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-employer" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="jobs/[id]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProvider>
      <DrawerProvider>
        <AuthGate />
        <AppDrawer />
        <StatusBar style="auto" />
      </DrawerProvider>
    </AppProvider>
  );
}
