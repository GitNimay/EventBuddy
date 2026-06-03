import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClub, useClubMembers, useClubEvents, useUserClubs, useJoinClub, useLeaveClub } from '@/hooks/useClubs';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { EventCard } from '@/components/EventCard';

export default function ClubProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.authUser?.id;

  const clubQuery = useClub(id);
  const membersQuery = useClubMembers(id);
  const eventsQuery = useClubEvents(id);
  const userClubsQuery = useUserClubs(userId);
  const joinClubMutation = useJoinClub();
  const leaveClubMutation = useLeaveClub();

  const club = clubQuery.data;
  const members = membersQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const isMember = userClubsQuery.data?.includes(id ?? '') ?? false;

  const isLoading = clubQuery.isLoading || membersQuery.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!club) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Club not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleJoinLeave() {
    if (!userId || !id) return;
    if (isMember) {
      Alert.alert('Leave club?', 'You can rejoin anytime.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveClubMutation.mutate({ clubId: id, userId }),
        },
      ]);
    } else {
      joinClubMutation.mutate({ clubId: id, userId });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{club.name}</Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={events.map((ce) => ce.event).filter(Boolean)}
        keyExtractor={(item) => item!.id}
        renderItem={({ item }) => <EventCard event={item!} showSave={false} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.profileSection}>
              {club.avatar_url ? (
                <Image source={{ uri: club.avatar_url }} style={styles.clubAvatar} />
              ) : (
                <View style={styles.clubAvatarFallback}>
                  <Ionicons name="school-outline" color={colors.muted} size={32} />
                </View>
              )}
              <Text style={styles.clubName}>{club.name}</Text>
              {club.college ? <Text style={styles.clubCollege}>{club.college}</Text> : null}
              {club.description ? <Text style={styles.clubDesc}>{club.description}</Text> : null}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{members.length}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{events.length}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
            </View>

            <Pressable
              onPress={handleJoinLeave}
              disabled={joinClubMutation.isPending || leaveClubMutation.isPending}
              style={[styles.joinLeaveBtn, isMember && styles.leaveBtn]}
            >
              {(joinClubMutation.isPending || leaveClubMutation.isPending) ? (
                <ActivityIndicator color={isMember ? colors.error : colors.onPrimary} />
              ) : (
                <Text style={[styles.joinLeaveText, isMember && styles.leaveText]}>
                  {isMember ? 'Leave Club' : 'Join Club'}
                </Text>
              )}
            </Pressable>

            {members.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Members</Text>
                <View style={styles.memberRow}>
                  {members.slice(0, 6).map((m) => (
                    <View key={m.id} style={styles.memberAvatarWrap}>
                      {m.user?.avatar_url ? (
                        <Image source={{ uri: m.user.avatar_url }} style={styles.memberAvatar} />
                      ) : (
                        <View style={styles.memberAvatarFallback}>
                          <Text style={styles.memberInitial}>{m.user?.full_name?.charAt(0) ?? '?'}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  {members.length > 6 && (
                    <View style={styles.memberMore}>
                      <Text style={styles.memberMoreText}>+{members.length - 6}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {events.length > 0 && <Text style={styles.sectionTitle}>Club Events</Text>}
          </View>
        }
        ListEmptyComponent={
          eventsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.emptyEvents}>
              <Ionicons name="calendar-outline" color={colors.muted} size={32} />
              <Text style={styles.emptyText}>No events yet</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  headerTitle: { ...typography.titleMd, color: colors.ink, flex: 1, textAlign: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.base, paddingBottom: 100 },
  profileSection: { alignItems: 'center', marginBottom: spacing.lg },
  clubAvatar: { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.surfaceSoft, marginBottom: spacing.md },
  clubAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  clubName: { ...typography.displaySm, color: colors.ink, textAlign: 'center' },
  clubCollege: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  clubDesc: { ...typography.bodyMd, color: colors.body, textAlign: 'center', marginTop: spacing.md },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  statItem: { alignItems: 'center' },
  statValue: { ...typography.displaySm, color: colors.ink },
  statLabel: { ...typography.captionSm, color: colors.muted },
  joinLeaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  leaveBtn: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.error },
  joinLeaveText: { ...typography.buttonMd, color: colors.onPrimary },
  leaveText: { color: colors.error },
  sectionTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.md, marginTop: spacing.sm },
  memberRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  memberAvatarWrap: {},
  memberAvatar: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  memberAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { ...typography.titleMd, color: colors.canvas },
  memberMore: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberMoreText: { ...typography.caption, color: colors.muted },
  emptyEvents: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.bodySm, color: colors.muted },
});
