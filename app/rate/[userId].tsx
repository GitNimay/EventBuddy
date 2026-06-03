import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSubmitRating } from '@/hooks/useSafety';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function RateBuddyRoute() {
  const params = useLocalSearchParams<{ userId?: string; userName?: string; eventId?: string }>();
  const ratedUserId = params.userId;
  const userName = params.userName ?? 'this buddy';
  const eventId = params.eventId;
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const submitRatingMutation = useSubmitRating();

  function handleSubmit() {
    if (score === 0) {
      Alert.alert('Select a rating', 'Tap a star to rate this buddy.');
      return;
    }

    if (!ratedUserId || !eventId) {
      Alert.alert('Missing info', 'Cannot submit rating right now.');
      return;
    }

    submitRatingMutation.mutate(
      { eventId, ratedUserId, score, comment },
      {
        onSuccess: () => {
          Alert.alert('Rating submitted', 'Thanks for your feedback!', [{ text: 'OK', onPress: () => router.back() }]);
        },
        onError: (error) => Alert.alert('Could not submit rating', error instanceof Error ? error.message : 'Please try again.'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>

        <Text style={styles.title}>How was {userName}?</Text>
        <Text style={styles.subtitle}>Your rating helps build trust in the community.</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} onPress={() => setScore(value)} style={styles.starButton}>
              <Ionicons
                name={value <= score ? 'star' : 'star-outline'}
                color={value <= score ? '#ffb800' : colors.mutedSoft}
                size={48}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.scoreText}>{score > 0 ? `${score} / 5` : 'Tap a star to rate'}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Comment (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What was the vibe?"
            placeholderTextColor={colors.mutedSoft}
            multiline
            maxLength={200}
            style={styles.input}
          />
          <Text style={styles.charCount}>{comment.length}/200</Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitRatingMutation.isPending || score === 0}
          style={[styles.primaryButton, (submitRatingMutation.isPending || score === 0) ? styles.disabledButton : null]}
        >
          <Text style={styles.primaryButtonLabel}>{submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  backButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, marginBottom: spacing.lg },
  title: { ...typography.displayMd, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { ...typography.bodySm, color: colors.muted, marginBottom: spacing.xl },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.sm },
  starButton: { padding: spacing.xs },
  scoreText: { ...typography.titleSm, color: colors.muted, textAlign: 'center', marginBottom: spacing.xl },
  inputGroup: { marginBottom: spacing.xl },
  inputLabel: { ...typography.caption, color: colors.ink, marginBottom: spacing.sm },
  input: { minHeight: 120, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas, padding: spacing.base, color: colors.ink, ...typography.bodyMd, textAlignVertical: 'top' },
  charCount: { ...typography.captionSm, color: colors.muted, textAlign: 'right', marginTop: spacing.xs },
  primaryButton: { height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  disabledButton: { backgroundColor: colors.primaryDisabled },
});
