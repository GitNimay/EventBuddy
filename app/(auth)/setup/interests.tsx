import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSetupScaffold } from '@/components/ProfileSetupScaffold';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const interestOptions = [
  'music',
  'trek',
  'hackathon',
  'art',
  'food',
  'comedy',
  'sports',
  'tech',
  'gaming',
] as const;

const interestLabels: Record<(typeof interestOptions)[number], string> = {
  music: 'Music',
  trek: 'Trek',
  hackathon: 'Hackathon',
  art: 'Art',
  food: 'Food',
  comedy: 'Comedy',
  sports: 'Sports',
  tech: 'Tech',
  gaming: 'Gaming',
};

export default function InterestsSetupRoute() {
  const params = useLocalSearchParams<{ vibeType?: string }>();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const isValid = selectedInterests.length >= 3 && selectedInterests.length <= 5;
  const helperText = useMemo(() => {
    if (selectedInterests.length < 3) return `${3 - selectedInterests.length} more required`;
    if (selectedInterests.length > 5) return 'Choose up to 5 interests';
    return `${selectedInterests.length} selected`;
  }, [selectedInterests.length]);

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }

      if (current.length >= 5) return current;

      return [...current, interest];
    });
  }

  function handleContinue() {
    if (!isValid || !params.vibeType) return;

    router.push({
      pathname: '/(auth)/setup/photo',
      params: {
        vibeType: params.vibeType,
        interests: selectedInterests.join(','),
      },
    });
  }

  return (
    <ProfileSetupScaffold
      step={2}
      title="What are you into?"
      subtitle="Pick 3 to 5 interests."
      primaryLabel="Continue"
      primaryDisabled={!isValid || !params.vibeType}
      onPrimaryPress={handleContinue}
    >
      <Text style={styles.helperText}>{helperText}</Text>
      <View style={styles.chipWrap}>
        {interestOptions.map((interest) => {
          const isSelected = selectedInterests.includes(interest);

          return (
            <Pressable
              key={interest}
              onPress={() => toggleInterest(interest)}
              style={[styles.chip, isSelected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipLabel, isSelected ? styles.chipLabelSelected : null]}>
                {interestLabels[interest]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ProfileSetupScaffold>
  );
}

const styles = StyleSheet.create({
  helperText: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.base,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 48,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.lg,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  chipLabelSelected: {
    color: colors.onPrimary,
  },
});
