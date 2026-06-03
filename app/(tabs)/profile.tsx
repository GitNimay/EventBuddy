import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { EventCard } from '@/components/EventCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserBadges, useUserStreak } from '@/hooks/useBadges';
import { useSavedEvents } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Segment = 'about' | 'saved';

export default function ProfileRoute() {
  const [activeSegment, setActiveSegment] = useState<Segment>('about');
  const currentUserQuery = useCurrentUser();
  const savedEventsQuery = useSavedEvents();
  const authUser = currentUserQuery.data?.authUser;
  const profile = currentUserQuery.data?.profile;
  const fullName = profile?.full_name ?? authUser?.user_metadata?.full_name ?? 'EventBuddy member';
  const email = profile?.email ?? authUser?.email ?? '';
  const interests: string[] = Array.isArray(profile?.interests) ? profile.interests : [];
  const userId = profile?.id;

  const streakQuery = useUserStreak(userId);
  const badgesQuery = useUserBadges(userId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{getInitial(fullName)}</Text>
              </View>
            )}
            {profile?.is_verified ? (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" color={colors.onPrimary} size={12} />
              </View>
            ) : null}
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.email} numberOfLines={1}>{email}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" color={colors.muted} size={22} />
          </Pressable>
        </View>

        <View style={styles.segmentWrap}>
          <SegmentButton label="About" value="about" activeSegment={activeSegment} onPress={setActiveSegment} />
          <SegmentButton label="Saved" value="saved" activeSegment={activeSegment} onPress={setActiveSegment} />
        </View>
      </View>

      {activeSegment === 'about' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={currentUserQuery.isRefetching} onRefresh={currentUserQuery.refetch} tintColor={colors.primary} />
          }
        >
          {currentUserQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Loading profile...</Text>
            </View>
          ) : (
            <View>
              <View style={styles.statsGrid}>
                <StatCard label="Trust" value={formatTrustScore(profile?.trust_score)} icon="star-outline" />
                <StatCard label="Verified" value={profile?.is_verified ? 'Yes' : 'No'} icon="shield-checkmark-outline" />
              </View>

              <View style={styles.streakBadgeRow}>
                <Pressable
                  onPress={() => router.push('/profile/badges')}
                  style={styles.streakBadgeCard}
                >
                  <Ionicons name="flame" color={colors.primary} size={20} />
                  <Text style={styles.streakBadgeValue}>{streakQuery.data?.current_streak ?? 0}</Text>
                  <Text style={styles.streakBadgeLabel}>Streak</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/profile/badges')}
                  style={styles.streakBadgeCard}
                >
                  <Ionicons name="trophy-outline" color={colors.primary} size={20} />
                  <Text style={styles.streakBadgeValue}>{badgesQuery.data?.length ?? 0}</Text>
                  <Text style={styles.streakBadgeLabel}>Badges</Text>
                </Pressable>
              </View>

              <Pressable onPress={() => router.push('/profile/edit')} style={styles.editBtn}>
                <Ionicons name="create-outline" color={colors.primary} size={20} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </Pressable>

              {!profile?.is_verified && (
                <Pressable onPress={() => router.push('/profile/verify')} style={styles.verifyBanner}>
                  <Ionicons name="shield-outline" color={colors.primary} size={20} />
                  <View style={styles.verifyCopy}>
                    <Text style={styles.verifyTitle}>Verify your identity</Text>
                    <Text style={styles.verifyBody}>Earn a verified badge.</Text>
                  </View>
                  <Ionicons name="chevron-forward" color={colors.muted} size={18} />
                </Pressable>
              )}

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{profile?.bio || 'Add a short bio during profile editing to help future event buddies know your vibe.'}</Text>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Vibe</Text>
                <View style={styles.vibePill}>
                  <Ionicons name="radio-button-on-outline" color={colors.primary} size={16} />
                  <Text style={styles.vibeText}>{formatLabel(profile?.vibe_type) || 'Not selected yet'}</Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Interests</Text>
                {interests.length > 0 ? (
                  <View style={styles.interestGrid}>
                    {interests.map((interest) => (
                      <View key={interest} style={styles.interestChip}>
                        <Text style={styles.interestText}>{formatLabel(interest)}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.stateText}>No interests selected yet.</Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={savedEventsQuery.data ?? []}
          keyExtractor={(event) => event.id}
          renderItem={({ item }) => <EventCard event={item} showSave={false} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={savedEventsQuery.isRefetching} onRefresh={savedEventsQuery.refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            savedEventsQuery.isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.stateText}>Loading saved events...</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="bookmark-outline" color={colors.primary} size={30} />
                <Text style={styles.emptyTitle}>No saved events yet</Text>
                <Text style={styles.stateText}>Save events from Home and they will appear here in your profile.</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function SegmentButton({
  label,
  value,
  activeSegment,
  onPress,
}: {
  label: string;
  value: Segment;
  activeSegment: Segment;
  onPress: (segment: Segment) => void;
}) {
  const isActive = value === activeSegment;

  return (
    <Pressable onPress={() => onPress(value)} style={[styles.segmentButton, isActive && styles.segmentButtonActive]}>
      <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} color={colors.primary} size={20} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'E';
}

function formatLabel(value?: string | null) {
  if (!value) return '';
  return value.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatTrustScore(score?: number | string | null) {
  return Number(score ?? 0).toFixed(1);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  fixedHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarInitial: {
    ...typography.displayMd,
    color: colors.canvas,
  },
  verifiedDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  profileTextBlock: {
    flex: 1,
  },
  name: {
    ...typography.displaySm,
    color: colors.ink,
  },
  email: {
    ...typography.bodySm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.canvas,
    ...shadow.card,
  },
  segmentText: {
    ...typography.buttonSm,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.ink,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  statValue: {
    ...typography.displaySm,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.captionSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  streakBadgeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  streakBadgeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  streakBadgeValue: {
    ...typography.titleMd,
    color: colors.ink,
  },
  streakBadgeLabel: {
    ...typography.captionSm,
    color: colors.muted,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    height: 48,
    marginBottom: spacing.md,
  },
  editBtnText: {
    ...typography.buttonMd,
    color: colors.primary,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryDisabled,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  verifyCopy: { flex: 1 },
  verifyTitle: { ...typography.titleSm, color: colors.ink },
  verifyBody: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  sectionCard: {
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  bioText: {
    ...typography.bodyMd,
    color: colors.body,
  },
  vibePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  vibeText: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestChip: {
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  interestText: {
    ...typography.caption,
    color: colors.ink,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.surfaceSoft,
  },
  emptyTitle: {
    ...typography.displaySm,
    color: colors.ink,
  },
  stateText: {
    ...typography.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
});
