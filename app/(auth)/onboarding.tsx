import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingSeen } from '@/lib/onboardingStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { fonts, typography } from '@/theme/typography';

type OnboardingSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  scene: 'events' | 'people' | 'safety';
};

const slides: OnboardingSlide[] = [
  {
    id: 'events',
    eyebrow: 'Explore nearby',
    headline: 'Find events near you',
    body: 'Discover concerts, treks, meetups, and more around you.',
    scene: 'events',
  },
  {
    id: 'people',
    eyebrow: 'Vibe match',
    headline: 'Find your people',
    body: 'Match with others going to the same event based on vibe and interests.',
    scene: 'people',
  },
  {
    id: 'safety',
    eyebrow: 'Trust first',
    headline: 'Go together, safely',
    body: 'Verified buddies, live location sharing, and trust ratings keep you safe.',
    scene: 'safety',
  },
];

const logoSource = require('../../N-removebg-preview.png');

export default function OnboardingRoute() {
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndex = slides.length - 1;
  const isLastSlide = currentIndex === lastIndex;

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(nextIndex);
  }

  function handleSkip() {
    listRef.current?.scrollToIndex({ index: lastIndex, animated: true });
    setCurrentIndex(lastIndex);
  }

  async function handleGetStarted() {
    await setOnboardingSeen();
    router.replace('/(auth)/signup');
  }

  const renderItem: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Illustration scene={item.scene} />
      <Text style={styles.eyebrow}>{item.eyebrow}</Text>
      <Text style={styles.headline}>{item.headline}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {!isLastSlide ? (
        <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={spacing.base}>
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      ) : null}

      <FlatList
        ref={listRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, currentIndex === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {isLastSlide ? (
          <Pressable onPress={handleGetStarted} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Get Started</Text>
          </Pressable>
        ) : (
          <View style={styles.buttonSpacer} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Illustration({ scene }: { scene: OnboardingSlide['scene'] }) {
  return (
    <View style={styles.illustrationShell}>
      <View style={styles.logoBadge}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.cardStack}>
        <View style={[styles.previewCard, scene === 'people' ? styles.previewCardOffset : null]}>
          <View style={styles.previewImage} />
          <View style={styles.previewLineStrong} />
          <View style={styles.previewLineSoft} />
        </View>
        <View style={styles.floatingPill}>
          <Text style={styles.floatingPillText}>{scene === 'safety' ? 'Verified' : scene === 'people' ? 'Vibe match' : 'Nearby'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.base,
    zIndex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  skipLabel: {
    ...typography.buttonSm,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.section,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.canvas,
  },
  illustrationShell: {
    width: '100%',
    maxWidth: 340,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    position: 'absolute',
    top: spacing.md,
    zIndex: 2,
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  logo: {
    width: 70,
    height: 70,
  },
  cardStack: {
    width: 250,
    height: 240,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  previewCard: {
    width: 220,
    height: 230,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    padding: spacing.base,
    ...shadow.card,
  },
  previewCardOffset: {
    transform: [{ rotate: '-2deg' }],
  },
  previewImage: {
    width: '100%',
    height: 132,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    marginBottom: spacing.base,
  },
  previewLineStrong: {
    width: '74%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    marginBottom: spacing.sm,
  },
  previewLineSoft: {
    width: '52%',
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.hairline,
  },
  floatingPill: {
    position: 'absolute',
    right: 0,
    bottom: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.cardHover,
  },
  floatingPillText: {
    ...typography.badge,
    color: colors.ink,
  },
  eyebrow: {
    fontSize: 8,
    fontFamily: fonts.bold,
    lineHeight: 10,
    letterSpacing: 0.32,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  headline: {
    ...typography.displayXl,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.bodyMd,
    color: colors.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    backgroundColor: colors.canvas,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.ink,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.hairline,
  },
  primaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
  buttonSpacer: {
    height: 48,
  },
});
