import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBlockUser, useBuddyMatches, useRequestBuddyConnection, type BuddyMatch } from '@/hooks/useBuddies';
import { useEventDetail } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function EventBuddiesRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = params.id;
  const eventQuery = useEventDetail(eventId);
  const matchesQuery = useBuddyMatches(eventId);
  const requestConnectionMutation = useRequestBuddyConnection();
  const blockUserMutation = useBlockUser();
  const event = eventQuery.data;
  const matches = matchesQuery.data ?? [];
  const isRefreshing = matchesQuery.isRefetching || eventQuery.isRefetching;

  async function refresh() {
    await Promise.all([matchesQuery.refetch(), eventQuery.refetch()]);
  }

  function connect(userId: string) {
    requestConnectionMutation.mutate(userId, {
      onSuccess: () => Alert.alert('Buddy request sent', 'If they already requested you, the connection is now accepted.'),
      onError: (error) => Alert.alert('Could not connect', getErrorMessage(error)),
    });
  }

  function block(userId: string, name?: string | null) {
    Alert.alert('Block buddy?', `${name ?? 'This buddy'} will disappear from matching results.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () =>
          blockUserMutation.mutate(userId, {
            onError: (error) => Alert.alert('Could not block user', getErrorMessage(error)),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Buddy matching</Text>
          <Text style={styles.title}>{event?.title ?? 'Find a buddy'}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <View style={styles.copyBlock}>
          <Text style={styles.heroTitle}>People going to this event</Text>
          <Text style={styles.heroText}>Matches are ranked in the database using shared interests, vibe, and trust signals. Blocked users are filtered before results reach this screen.</Text>
        </View>

        {matchesQuery.isLoading ? <Text style={styles.mutedText}>Loading buddy matches...</Text> : null}

        {!matchesQuery.isLoading && matches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="person-add-outline" color={colors.muted} size={26} />
            <Text style={styles.emptyTitle}>No buddy matches yet</Text>
            <Text style={styles.mutedText}>Attend the event or check back when more people join.</Text>
          </View>
        ) : null}

        {matches.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRail}>
            {matches.map((match) => (
              <BuddyMatchCard
                key={match.user_id}
                match={match}
                isConnecting={requestConnectionMutation.isPending}
                isBlocking={blockUserMutation.isPending}
                onConnect={() => connect(match.user_id)}
                onBlock={() => block(match.user_id, match.full_name)}
              />
            ))}
          </ScrollView>
        ) : null}

        <Pressable onPress={() => router.push({ pathname: '/event/[id]/groups', params: { id: eventId } })} style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>See open buddy groups</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function BuddyMatchCard({
  match,
  isConnecting,
  isBlocking,
  onConnect,
  onBlock,
}: {
  match: BuddyMatch;
  isConnecting: boolean;
  isBlocking: boolean;
  onConnect: () => void;
  onBlock: () => void;
}) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: match.user_id } })} style={styles.matchCard}>
      {match.avatar_url ? <Image source={{ uri: match.avatar_url }} style={styles.avatar} /> : <AvatarFallback name={match.full_name} />}
      <View style={styles.scorePill}>
        <Ionicons name="sparkles" color={colors.primary} size={14} />
        <Text style={styles.scoreText}>{match.match_score} match</Text>
      </View>
      <Text style={styles.cardName}>{match.full_name ?? 'EventBuddy member'}</Text>
      <Text style={styles.cardMeta}>{formatVibe(match.vibe_type)}</Text>
      <Text style={styles.cardBio} numberOfLines={3}>{match.bio ?? 'Looking for good company at this event.'}</Text>
      <View style={styles.statRow}>
        <StatPill icon="heart-outline" label={`${match.shared_interest_count} shared`} />
        <StatPill icon="shield-checkmark-outline" label={match.is_verified ? 'Verified' : `Trust ${Number(match.trust_score ?? 0).toFixed(1)}`} />
      </View>
      <View style={styles.chipRow}>
        {match.interests.slice(0, 3).map((interest) => (
          <Text key={interest} style={styles.chip}>{formatInterest(interest)}</Text>
        ))}
      </View>
      <View style={styles.actionRow}>
        <Pressable onPress={onConnect} disabled={isConnecting} style={styles.connectButton}>
          <Text style={styles.connectButtonLabel}>{isConnecting ? 'Sending...' : 'Connect'}</Text>
        </Pressable>
        <Pressable onPress={onBlock} disabled={isBlocking} style={styles.blockButton}>
          <Ionicons name="ban-outline" color={colors.muted} size={18} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function AvatarFallback({ name }: { name?: string | null }) {
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>{name?.trim().charAt(0).toUpperCase() || 'E'}</Text>
    </View>
  );
}

function StatPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} color={colors.muted} size={14} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatVibe(vibe?: string | null) {
  if (!vibe) return 'Open to any vibe';

  return vibe.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatInterest(interest: string) {
  return interest.charAt(0).toUpperCase() + interest.slice(1);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft },
  iconButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  headerCopy: { flex: 1 },
  eyebrow: { ...typography.uppercaseTag, color: colors.primary, marginBottom: spacing.xs, textTransform: 'uppercase' },
  title: { ...typography.displaySm, color: colors.ink },
  content: { paddingVertical: spacing.base, paddingBottom: spacing.xxl },
  copyBlock: { paddingHorizontal: spacing.base, marginBottom: spacing.base },
  heroTitle: { ...typography.displayLg, color: colors.ink, marginBottom: spacing.sm },
  heroText: { ...typography.bodySm, color: colors.body },
  mutedText: { ...typography.bodySm, color: colors.muted, paddingHorizontal: spacing.base },
  emptyCard: { marginHorizontal: spacing.base, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.canvas },
  emptyTitle: { ...typography.titleMd, color: colors.ink },
  cardRail: { paddingHorizontal: spacing.base, gap: spacing.base },
  matchCard: { width: 292, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.canvas, padding: spacing.base, ...shadow.card },
  avatar: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, marginBottom: spacing.md },
  avatarFallback: { width: '100%', aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, marginBottom: spacing.md },
  avatarInitial: { ...typography.ratingDisplay, color: colors.muted },
  scorePill: { position: 'absolute', top: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.full, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.canvas, ...shadow.card },
  scoreText: { ...typography.badge, color: colors.ink },
  cardName: { ...typography.displaySm, color: colors.ink, marginBottom: spacing.xs },
  cardMeta: { ...typography.bodySm, color: colors.muted, marginBottom: spacing.sm },
  cardBio: { ...typography.bodySm, color: colors.body, minHeight: 60, marginBottom: spacing.md },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surfaceSoft, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  statLabel: { ...typography.badge, color: colors.body },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: { ...typography.badge, color: colors.ink, borderRadius: radius.full, backgroundColor: colors.surfaceSoft, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  connectButton: { flex: 1, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  connectButtonLabel: { ...typography.buttonSm, color: colors.onPrimary },
  blockButton: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas },
  primaryButton: { marginHorizontal: spacing.base, marginTop: spacing.base, height: 48, borderRadius: radius.sm, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.canvas },
});
