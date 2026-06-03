import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOnboardingSeen } from '@/lib/onboardingStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const splashDelayMs = 1500;
const logoSource = require('../N-removebg-preview.png');

export default function SplashRoute() {
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const hasSeenOnboarding = await getOnboardingSeen();

      if (hasSeenOnboarding) {
        router.replace('/(tabs)');
        return;
      }

      router.replace('/(auth)/onboarding');
    }, splashDelayMs);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.logoHalo}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>EventBuddy</Text>
      <Text style={styles.subtitle}>Discover. Match. Go together.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.base,
  },
  logoHalo: {
    width: 152,
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 112,
    height: 112,
  },
  title: {
    ...typography.displayXl,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    ...typography.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
});
