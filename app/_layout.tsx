import { QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme/colors';
import { useSession } from '@/hooks/useSession';
import { getOnboardingSeen } from '@/lib/onboardingStorage';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'splash',
};

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const segments = useSegments();
  const { session, isLoading } = useSession();
  const [onboardingSeen, setOnboardingSeenState] = useState<boolean | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    let isMounted = true;

    getOnboardingSeen().then((hasSeenOnboarding) => {
      if (isMounted) {
        setOnboardingSeenState(hasSeenOnboarding);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [segments]);

  useEffect(() => {
    if (!fontsLoaded || isLoading || onboardingSeen === null) return;

    const isInAuthGroup = segments[0] === '(auth)';
    const secondSegment = (segments as string[])[1];
    const isInSplash = segments[0] === 'splash';
    const isInOnboarding = isInAuthGroup && secondSegment === 'onboarding';

    if (!onboardingSeen && !isInSplash && !isInOnboarding && !isInAuthGroup) {
      router.replace('/splash');
    }

    if (onboardingSeen && !session && !isInAuthGroup && !isInSplash) {
      router.replace('/(auth)/login');
    }

    if (onboardingSeen && session && isInSplash) {
      router.replace('/(tabs)');
    }

    SplashScreen.hideAsync();
  }, [fontsLoaded, isLoading, onboardingSeen, segments, session]);

  if (!fontsLoaded || isLoading || onboardingSeen === null) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.canvas },
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
      }}
    >
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="event/create" options={{ title: 'Create Event' }} />
      <Stack.Screen name="event/[id]" options={{ title: 'Event Details' }} />
      <Stack.Screen name="event/[id]/groups" options={{ headerShown: false }} />
      <Stack.Screen name="event/[id]/buddies" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="buddy/[id]" options={{ title: 'Buddy Profile' }} />
      <Stack.Screen name="group/[id]/chat" options={{ headerShown: false }} />
      <Stack.Screen name="group/[id]/location" options={{ headerShown: false }} />
      <Stack.Screen name="profile/verify" options={{ headerShown: false }} />
      <Stack.Screen name="rate/[userId]" options={{ title: 'Rate Buddy' }} />
      <Stack.Screen name="report/[userId]" options={{ title: 'Report User' }} />
      <Stack.Screen name="chat/[groupId]" options={{ title: 'Buddy Chat' }} />
      <Stack.Screen name="filter" options={{ presentation: 'modal', title: 'Filters' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
