import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserBadges, useUserStreak, type Badge } from '@/hooks/useBadges';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ALL_BADGE_TYPES = [
  { type: 'first_event', label: 'First Event', icon: 'rocket-outline' as const, condition: 'Attend your first event' },
  { type: 'five_events', label: 'Regular', icon: 'calendar-outline' as const, condition: 'Attend 5 events' },
  { type: 'ten_events', label: 'Veteran', icon: 'trophy-outline' as const, condition: 'Attend 10 events' },
  { type: 'verified_buddy', label: 'Verified', icon: 'shield-checkmark-outline' as const, condition: 'Verify your identity' },
  { type: 'group_creator', label: 'Creator', icon: 'people-outline' as const, condition: 'Create a buddy group' },
  { type: 'club_member', label: 'Club Member', icon: 'school-outline' as const, condition: 'Join a college club' },
  { type: 'social_butterfly', label: 'Social Butterfly', icon: 'heart-outline' as const, condition: 'Connect with 3 buddies' },
];

export default function BadgesScreen() {
  const currentUserQuery = useCurrentUser();
  const profile = currentUserQuery.data?.profile;
  const userId = profile?.id;

  const streakQuery = useUserStreak(userId);
  const badgesQuery = useUserBadges(userId);

  const earnedTypes = new Set((badgesQuery.data ?? []).map((b) => b.badge_type));
  const streak = streakQuery.data;

  const isLoading = currentUserQuery.isLoading || streakQuery.isLoading || badgesQuery.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const earnedCount = earnedTypes.size;
  const nextBadge = ALL_BADGE_TYPES.find((b) => !earnedTypes.has(b.type));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Streak & Badges</Text>

        <View style={styles.streakCard}>
          <View style={styles.streakIconWrap}>
            <Ionicons name="flame" color={colors.primary} size={40} />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{streak?.current_streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Current streak</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{streak?.longest_streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Best streak</Text>
          </View>
        </View>

        {nextBadge && (
          <View style={styles.nextBadgeCard}>
            <Ionicons name="arrow-forward-circle-outline" color={colors.primary} size={20} />
            <View style={styles.nextBadgeCopy}>
              <Text style={styles.nextBadgeTitle}>Next badge to earn</Text>
              <Text style={styles.nextBadgeName}>{nextBadge.label}</Text>
              <Text style={styles.nextBadgeCondition}>{nextBadge.condition}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Badges earned ({earnedCount}/{ALL_BADGE_TYPES.length})
        </Text>

        <View style={styles.badgeGrid}>
          {ALL_BADGE_TYPES.map((badge) => {
            const earned = earnedTypes.has(badge.type);
            return (
              <View key={badge.type} style={[styles.badgeItem, !earned && styles.badgeItemLocked]}>
                <View style={[styles.badgeIconWrap, !earned && styles.badgeIconWrapLocked]}>
                  <Ionicons name={badge.icon} color={earned ? colors.primary : colors.mutedSoft} size={28} />
                </View>
                <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>{badge.label}</Text>
                {!earned && <Text style={styles.badgeCondition}>{badge.condition}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.base, paddingBottom: 100 },
  heading: { ...typography.displayLg, color: colors.ink, marginBottom: spacing.lg },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  streakIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInfo: { flex: 1 },
  streakCount: { ...typography.displayMd, color: colors.ink },
  streakLabel: { ...typography.captionSm, color: colors.muted, marginTop: spacing.xxs },
  nextBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryDisabled,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  nextBadgeCopy: { flex: 1 },
  nextBadgeTitle: { ...typography.captionSm, color: colors.muted },
  nextBadgeName: { ...typography.titleMd, color: colors.ink, marginTop: spacing.xxs },
  nextBadgeCondition: { ...typography.captionSm, color: colors.muted, marginTop: spacing.xxs },
  sectionTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.md,
  },
  badgeItemLocked: { backgroundColor: colors.surfaceSoft, opacity: 0.7 },
  badgeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeIconWrapLocked: { backgroundColor: colors.hairlineSoft },
  badgeLabel: { ...typography.caption, color: colors.ink, textAlign: 'center' },
  badgeLabelLocked: { color: colors.mutedSoft },
  badgeCondition: { ...typography.captionSm, color: colors.mutedSoft, textAlign: 'center', marginTop: spacing.xxs },
});
