import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  PanResponder,
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
  title: string[];
  ghost: string;
  body: string;
  cards: [string, string, string];
};

const slides: OnboardingSlide[] = [
  {
    id: 'events',
    title: ['Find events', 'near you'],
    ghost: 'Discover',
    body: 'Discover concerts, treks, meetups, and more around you.',
    cards: ['Concerts', 'Treks', 'Meetups'],
  },
  {
    id: 'people',
    title: ['Find your', 'people'],
    ghost: 'Together',
    body: 'Match with others going to the same event based on vibe and interests.',
    cards: ['Vibe match', 'Shared tags', 'Buddy groups'],
  },
  {
    id: 'safety',
    title: ['Go together,', 'safely'],
    ghost: 'Protected',
    body: 'Verified buddies, live location sharing, and trust ratings keep you safe.',
    cards: ['Verified', 'Live location', 'Trust score'],
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

  function goToSlide(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }

  function handleSkip() {
    goToSlide(lastIndex);
  }

  async function finishOnboarding() {
    await setOnboardingSeen();
    router.replace('/(auth)/login');
  }

  function handleNextPress() {
    goToSlide(currentIndex + 1);
  }

  const renderItem: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.copyBlock}>
        <Text style={styles.titleLine}>{item.title[0]}</Text>
        <Text style={styles.titleLine}>{item.title[1]}</Text>
        <Text style={styles.ghostWord}>{item.ghost}</Text>
      </View>

      <FeatureCards slide={item} />

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
        scrollEnabled={!isLastSlide}
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
          <SlideToLogin width={width - spacing.base * 2} onComplete={finishOnboarding} />
        ) : (
          <Pressable onPress={handleNextPress} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Next</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function SlideToLogin({ width, onComplete }: { width: number; onComplete: () => Promise<void> }) {
  const thumbSize = 56;
  const maxTranslate = Math.max(width - thumbSize - spacing.xs * 2, 0);
  const translateX = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (_event, gestureState) => {
        const nextValue = Math.min(Math.max(gestureState.dx, 0), maxTranslate);
        translateX.setValue(nextValue);
      },
      onPanResponderRelease: (_event, gestureState) => {
        const shouldComplete = gestureState.dx >= maxTranslate * 0.72;

        if (shouldComplete) {
          Animated.spring(translateX, {
            toValue: maxTranslate,
            useNativeDriver: true,
          }).start(() => {
            if (!hasCompleted.current) {
              hasCompleted.current = true;
              onComplete();
            }
          });
          return;
        }

        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={[styles.sliderTrack, { width }]} {...panResponder.panHandlers}>
      <Text style={styles.sliderLabel}>Slide to login</Text>
      <Text style={styles.sliderHint}>&gt;&gt;&gt;</Text>
      <Animated.View
        style={[styles.sliderThumb, { transform: [{ translateX }] }]}
      >
        <Text style={styles.sliderThumbGlyph}>&gt;</Text>
      </Animated.View>
    </View>
  );
}

function FeatureCards({ slide }: { slide: OnboardingSlide }) {
  return (
    <View style={styles.cardStage}>
      <View style={[styles.sideCard, styles.leftCard]}>
        <Text style={styles.smallCardTitle}>{slide.cards[1]}</Text>
        <View style={styles.mutedShape} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          <Text style={styles.cardTag}>EventBuddy</Text>
        </View>
        <Text style={styles.heroCardTitle}>{slide.cards[0]}</Text>
        <View style={styles.heroGraphic}>
          <View style={styles.heroOrb} />
          <View style={styles.heroPill} />
        </View>
      </View>

      <View style={[styles.sideCard, styles.rightCard]}>
        <Text style={styles.smallCardTitle}>{slide.cards[2]}</Text>
        <View style={styles.mutedCircle} />
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
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.section,
    paddingBottom: spacing.base,
  },
  copyBlock: {
    minHeight: 150,
    justifyContent: 'flex-start',
  },
  titleLine: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 44,
    color: colors.ink,
    letterSpacing: -1.3,
  },
  ghostWord: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 44,
    color: colors.hairline,
    letterSpacing: -1.3,
  },
  cardStage: {
    flex: 1,
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  heroCard: {
    zIndex: 2,
    width: 226,
    height: 258,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
    transform: [{ rotate: '-3deg' }],
    ...shadow.cardHover,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 34,
    height: 34,
  },
  cardTag: {
    ...typography.badge,
    color: colors.muted,
  },
  heroCardTitle: {
    ...typography.displaySm,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  heroGraphic: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  heroOrb: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
  },
  heroPill: {
    width: 112,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    marginTop: spacing.lg,
  },
  sideCard: {
    position: 'absolute',
    width: 152,
    height: 188,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.md,
  },
  leftCard: {
    left: -spacing.base,
    bottom: spacing.xl,
    transform: [{ rotate: '4deg' }],
  },
  rightCard: {
    right: -spacing.base,
    top: spacing.xl,
    transform: [{ rotate: '-4deg' }],
  },
  smallCardTitle: {
    ...typography.titleMd,
    color: colors.ink,
  },
  mutedShape: {
    width: 94,
    height: 82,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
    marginTop: spacing.xl,
    transform: [{ rotate: '-12deg' }],
  },
  mutedCircle: {
    width: 78,
    height: 78,
    borderRadius: radius.full,
    backgroundColor: colors.hairline,
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
  body: {
    ...typography.bodyMd,
    color: colors.body,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    backgroundColor: colors.canvas,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  dot: {
    height: 6,
    borderRadius: radius.full,
  },
  dotActive: {
    width: 30,
    backgroundColor: colors.ink,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.hairline,
  },
  primaryButton: {
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
  sliderTrack: {
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
  },
  sliderLabel: {
    ...typography.buttonMd,
    color: colors.canvas,
    flex: 1,
    paddingLeft: 76,
  },
  sliderHint: {
    ...typography.buttonMd,
    color: colors.muted,
    letterSpacing: 1.2,
    paddingRight: spacing.lg,
  },
  sliderThumb: {
    position: 'absolute',
    left: spacing.xs,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  sliderThumbGlyph: {
    ...typography.buttonSm,
    color: colors.ink,
    marginLeft: 2,
  },
});
