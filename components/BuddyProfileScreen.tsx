import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBlockUser, useBuddyProfile, useRequestBuddyConnection } from '@/hooks/useBuddies';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function BuddyProfileScreen({ userId }: { userId?: string }) {
  const profileQuery = useBuddyProfile(userId);
  const currentUserQuery = useCurrentUser();
  const requestConnectionMutation = useRequestBuddyConnection();
  const blockUserMutation = useBlockUser();
  const profile = profileQuery.data?.profile;
  const badges = profileQuery.data?.badges ?? [];
  const isSelf = currentUserQuery.data?.authUser?.id === userId;

  function connect() {
    if (!userId) return;

    requestConnectionMutation.mutate(userId, {
      onSuccess: () => Alert.alert('Buddy request sent', 'You will see this buddy in your Buddies tab.'),
      onError: (error) => Alert.alert('Could not connect', getErrorMessage(error)),
    });
  }

  function block() {
    if (!userId) return;

    Alert.alert('Block buddy?', `${profile?.full_name ?? 'This buddy'} will no longer appear in your matching results.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () =>
          blockUserMutation.mutate(userId, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert('Could not block user', getErrorMessage(error)),
          }),
      },
    ]);
  }

  if (profileQuery.isLoading) {
    return <SafeAreaView style={styles.screen}><Text style={styles.loadingText}>Loading buddy...</Text></SafeAreaView>;
  }

  if (!profile) {
    return <SafeAreaView style={styles.screen}><Text style={styles.loadingText}>Buddy not found.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" color={colors.ink} size={22} />
          </Pressable>
          {!isSelf ? (
            <View style={styles.topBarActions}>
              {userId ? (
                <>
                  <Pressable onPress={() => router.push({ pathname: '/rate/[userId]', params: { userId, userName: profile.full_name ?? 'this buddy' } })} style={styles.iconButton}>
                    <Ionicons name="star-outline" color={colors.primary} size={20} />
                  </Pressable>
                  <Pressable onPress={() => router.push({ pathname: '/report/[userId]', params: { userId, userName: profile.full_name ?? 'this user' } })} style={styles.iconButton}>
                    <Ionicons name="flag-outline" color={colors.error} size={20} />
                  </Pressable>
                </>
              ) : null}
              <Pressable onPress={block} disabled={blockUserMutation.isPending} style={styles.iconButton}>
                <Ionicons name="ban-outline" color={colors.muted} size={20} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.heroAvatar} /> : <AvatarFallback name={profile.full_name} />}

        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.full_name ?? 'EventBuddy member'}</Text>
          {profile.is_verified ? <Ionicons name="checkmark-circle" color={colors.primary} size={22} /> : null}
        </View>
        <Text style={styles.vibeText}>{formatVibe(profile.vibe_type)}</Text>

        <View style={styles.statsCard}>
          <TrustStat label="Trust" value={Number(profile.trust_score ?? 0).toFixed(1)} />
          <View style={styles.statDivider} />
          <TrustStat label="Badges" value={`${badges.length}`} />
          <View style={styles.statDivider} />
          <TrustStat label="Joined" value={formatJoinedDate(profile.created_at)} />
        </View>

        {isSelf && !profile.is_verified ? (
          <Pressable onPress={() => router.push('/profile/verify')} style={styles.verifyBanner}>
            <Ionicons name="shield-outline" color={colors.primary} size={20} />
            <View style={styles.verifyBannerCopy}>
              <Text style={styles.verifyBannerTitle}>Verify your identity</Text>
              <Text style={styles.verifyBannerBody}>Confirm your email to earn a verified badge.</Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.muted} size={18} />
          </Pressable>
        ) : null}

        <Section title="About">
          <Text style={styles.bodyText}>{profile.bio ?? 'This buddy has not added a bio yet.'}</Text>
        </Section>

        <Section title="Interests">
          <View style={styles.chipRow}>
            {profile.interests.length > 0 ? profile.interests.map((interest) => <Text key={interest} style={styles.chip}>{formatInterest(interest)}</Text>) : <Text style={styles.mutedText}>No interests added yet.</Text>}
          </View>
        </Section>

        <Section title="Badges">
          <View style={styles.badgeGrid}>
            {badges.length > 0 ? badges.map((badge) => <BadgePill key={badge.id} label={formatBadge(badge.badge_type)} />) : <Text style={styles.mutedText}>No badges earned yet.</Text>}
          </View>
        </Section>
      </ScrollView>

      {!isSelf ? (
        <View style={styles.footer}>
          <Pressable onPress={connect} disabled={requestConnectionMutation.isPending} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>{requestConnectionMutation.isPending ? 'Sending...' : 'Connect as buddy'}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <View style={styles.badgePill}>
      <Ionicons name="ribbon-outline" color={colors.primary} size={15} />
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

function AvatarFallback({ name }: { name?: string | null }) {
  return (
    <View style={styles.heroFallback}>
      <Text style={styles.heroInitial}>{name?.trim().charAt(0).toUpperCase() || 'E'}</Text>
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

function formatBadge(badge: string) {
  return badge.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatJoinedDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: 110 },
  loadingText: { ...typography.bodyMd, color: colors.muted, padding: spacing.base },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  topBarActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  heroAvatar: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, marginBottom: spacing.lg },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primaryDisabled, backgroundColor: colors.surfaceSoft, padding: spacing.base, marginBottom: spacing.base },
  verifyBannerCopy: { flex: 1 },
  verifyBannerTitle: { ...typography.titleSm, color: colors.ink },
  verifyBannerBody: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  heroFallback: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, marginBottom: spacing.lg },
  heroInitial: { ...typography.ratingDisplay, color: colors.muted },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  name: { ...typography.displayXl, color: colors.ink, flex: 1 },
  vibeText: { ...typography.bodyMd, color: colors.muted, marginBottom: spacing.base },
  statsCard: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.canvas, padding: spacing.base, marginBottom: spacing.lg, ...shadow.card },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.displaySm, color: colors.ink },
  statLabel: { ...typography.captionSm, color: colors.muted },
  statDivider: { width: 1, backgroundColor: colors.hairlineSoft },
  section: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft, paddingTop: spacing.base, marginTop: spacing.base },
  sectionTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.sm },
  bodyText: { ...typography.bodyMd, color: colors.body },
  mutedText: { ...typography.bodySm, color: colors.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { ...typography.badge, color: colors.ink, borderRadius: radius.full, backgroundColor: colors.surfaceSoft, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surfaceSoft, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  badgeLabel: { ...typography.badge, color: colors.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.base, paddingBottom: spacing.lg, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  primaryButton: { height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
});
