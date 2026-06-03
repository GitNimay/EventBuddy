import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSetupScaffold } from '@/components/ProfileSetupScaffold';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type VibeType = 'introvert' | 'extrovert' | 'solo_explorer' | 'social_butterfly';
type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

const vibeOptions: { value: VibeType; label: string; description: string }[] = [
  {
    value: 'introvert',
    label: 'Introvert',
    description: 'You like smaller groups and thoughtful plans.',
  },
  {
    value: 'extrovert',
    label: 'Extrovert',
    description: 'You enjoy high-energy crowds and new faces.',
  },
  {
    value: 'solo_explorer',
    label: 'Solo Explorer',
    description: 'You go out independently but welcome good company.',
  },
  {
    value: 'social_butterfly',
    label: 'Social Butterfly',
    description: 'You love groups, conversations, and shared memories.',
  },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function VibeSetupRoute() {
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  function handleContinue() {
    if (!selectedVibe) return;

    router.push({ pathname: '/(auth)/setup/interests', params: { vibeType: selectedVibe, gender: selectedGender ?? '' } });
  }

  return (
    <ProfileSetupScaffold
      step={1}
      title="What's your vibe?"
      subtitle="This helps us match you with the right buddies."
      primaryLabel="Continue"
      primaryDisabled={!selectedVibe}
      onPrimaryPress={handleContinue}
    >
      <View style={styles.grid}>
        {vibeOptions.map((option) => {
          const isSelected = selectedVibe === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => setSelectedVibe(option.value)}
              style={[styles.tile, isSelected ? styles.tileSelected : null]}
            >
              <View style={[styles.illustrationFrame, isSelected ? styles.illustrationFrameSelected : null]}>
                <VibeIllustration vibe={option.value} />
              </View>
              <View style={styles.tileCopy}>
                <Text style={styles.tileTitle}>{option.label}</Text>
                <Text style={styles.tileDescription}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.genderBlock}>
        <Text style={styles.sectionTitle}>Gender (optional)</Text>
        <View style={styles.genderGrid}>
          {genderOptions.map((option) => {
            const isSelected = selectedGender === option.value;

            return (
              <Pressable key={option.value} onPress={() => setSelectedGender(option.value)} style={[styles.genderChip, isSelected ? styles.genderChipSelected : null]}>
                <Text style={[styles.genderChipLabel, isSelected ? styles.genderChipLabelSelected : null]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ProfileSetupScaffold>
  );
}

function VibeIllustration({ vibe }: { vibe: VibeType }) {
  if (vibe === 'introvert') {
    return (
      <View style={styles.scene}>
        <View style={styles.windowMoon} />
        <View style={styles.bookBase} />
        <View style={styles.singleHead} />
        <View style={styles.singleBody} />
      </View>
    );
  }

  if (vibe === 'extrovert') {
    return (
      <View style={styles.scene}>
        <View style={styles.confettiOne} />
        <View style={styles.confettiTwo} />
        <View style={styles.groupHeadLeft} />
        <View style={styles.groupHeadCenter} />
        <View style={styles.groupHeadRight} />
        <View style={styles.groupBody} />
      </View>
    );
  }

  if (vibe === 'solo_explorer') {
    return (
      <View style={styles.scene}>
        <View style={styles.sun} />
        <View style={styles.pathWide} />
        <View style={styles.pathNarrow} />
        <View style={styles.travelerHead} />
        <View style={styles.travelerBody} />
      </View>
    );
  }

  return (
    <View style={styles.scene}>
      <View style={styles.butterflyWingLeft} />
      <View style={styles.butterflyWingRight} />
      <View style={styles.groupHeadLeft} />
      <View style={styles.groupHeadCenter} />
      <View style={styles.groupHeadRight} />
      <View style={styles.groupBody} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.base,
  },
  genderBlock: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genderChip: {
    minHeight: 40,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  genderChipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  genderChipLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  genderChipLabelSelected: {
    color: colors.canvas,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    minHeight: 128,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    padding: spacing.base,
    ...shadow.card,
  },
  tileSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  illustrationFrame: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.authPeach,
    overflow: 'hidden',
  },
  illustrationFrameSelected: {
    backgroundColor: colors.primaryDisabled,
  },
  scene: {
    width: 84,
    height: 84,
    position: 'relative',
  },
  windowMoon: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.authApricot,
  },
  bookBase: {
    position: 'absolute',
    left: 18,
    bottom: 19,
    width: 48,
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    transform: [{ rotate: '-8deg' }],
  },
  singleHead: {
    position: 'absolute',
    left: 31,
    top: 27,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  singleBody: {
    position: 'absolute',
    left: 27,
    top: 46,
    width: 26,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  confettiOne: {
    position: 'absolute',
    top: 15,
    left: 18,
    width: 26,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-24deg' }],
  },
  confettiTwo: {
    position: 'absolute',
    top: 20,
    right: 17,
    width: 18,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.authApricot,
    transform: [{ rotate: '28deg' }],
  },
  groupHeadLeft: {
    position: 'absolute',
    left: 18,
    top: 33,
    width: 17,
    height: 17,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  groupHeadCenter: {
    position: 'absolute',
    left: 36,
    top: 28,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  groupHeadRight: {
    position: 'absolute',
    right: 17,
    top: 35,
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.authCoral,
  },
  groupBody: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    width: 48,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sun: {
    position: 'absolute',
    top: 11,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.authApricot,
  },
  pathWide: {
    position: 'absolute',
    left: 17,
    bottom: 12,
    width: 52,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
    transform: [{ rotate: '-22deg' }],
  },
  pathNarrow: {
    position: 'absolute',
    left: 31,
    bottom: 12,
    width: 19,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.hairlineSoft,
    transform: [{ rotate: '-22deg' }],
  },
  travelerHead: {
    position: 'absolute',
    left: 31,
    top: 34,
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  travelerBody: {
    position: 'absolute',
    left: 29,
    top: 49,
    width: 18,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  butterflyWingLeft: {
    position: 'absolute',
    left: 19,
    top: 15,
    width: 26,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.authApricot,
    transform: [{ rotate: '-24deg' }],
  },
  butterflyWingRight: {
    position: 'absolute',
    right: 17,
    top: 15,
    width: 26,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.authCoral,
    transform: [{ rotate: '24deg' }],
  },
  tileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  tileTitle: {
    ...typography.titleMd,
    color: colors.ink,
  },
  tileDescription: {
    ...typography.bodySm,
    color: colors.muted,
  },
});
