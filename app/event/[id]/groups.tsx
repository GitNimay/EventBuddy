import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEventDetail } from '@/hooks/useEvents';
import { OpenBuddyGroup, useCreateBuddyGroup, useJoinBuddyGroup, useOpenGroups } from '@/hooks/useBuddies';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function EventGroupsRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = params.id;
  const eventQuery = useEventDetail(eventId);
  const groupsQuery = useOpenGroups(eventId);
  const createGroupMutation = useCreateBuddyGroup(eventId);
  const joinGroupMutation = useJoinBuddyGroup(eventId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [maxMembers, setMaxMembers] = useState('6');
  const event = eventQuery.data;
  const groups = groupsQuery.data ?? [];
  const isRefreshing = groupsQuery.isRefetching || eventQuery.isRefetching;

  async function refresh() {
    await Promise.all([groupsQuery.refetch(), eventQuery.refetch()]);
  }

  function openChat(groupId: string) {
    router.push({ pathname: '/chat/[groupId]', params: { groupId } });
  }

  function handleJoin(group: OpenBuddyGroup) {
    if (group.is_current_user_member) {
      openChat(group.group_id);
      return;
    }

    joinGroupMutation.mutate(group.group_id, {
      onSuccess: (groupId) => openChat(groupId),
      onError: (error) => Alert.alert('Could not join group', getErrorMessage(error)),
    });
  }

  function handleCreateGroup() {
    createGroupMutation.mutate(
      { name: groupName.trim(), maxMembers: Number(maxMembers) },
      {
        onSuccess: (groupId) => {
          setIsModalOpen(false);
          setGroupName('');
          setMaxMembers('6');
          openChat(groupId);
        },
        onError: (error) => Alert.alert('Could not create group', getErrorMessage(error)),
      },
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Buddy groups</Text>
          <Text style={styles.title}>{event?.title ?? 'Find your crew'}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" color={colors.primary} size={22} />
          </View>
          <Text style={styles.heroTitle}>Join a small group before the event</Text>
          <Text style={styles.heroText}>Group capacity is checked server-side, so full groups stay full even if multiple people tap join together.</Text>
          <Pressable onPress={() => router.push({ pathname: '/event/[id]/buddies', params: { id: eventId } })} style={styles.outlineButton}>
            <Text style={styles.outlineButtonLabel}>Match with buddies first</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open groups</Text>
          <Pressable onPress={() => setIsModalOpen(true)} style={styles.addButton}>
            <Ionicons name="add" color={colors.onPrimary} size={18} />
            <Text style={styles.addButtonLabel}>Create</Text>
          </Pressable>
        </View>

        {groupsQuery.isLoading ? <Text style={styles.mutedText}>Loading groups...</Text> : null}

        {!groupsQuery.isLoading && groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.mutedText}>Start the first buddy group and invite others to join the plan.</Text>
          </View>
        ) : null}

        {groups.map((group) => (
          <GroupCard key={group.group_id} group={group} isJoining={joinGroupMutation.isPending} onJoin={() => handleJoin(group)} />
        ))}
      </ScrollView>

      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create buddy group</Text>
              <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" color={colors.ink} size={20} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Group name</Text>
            <TextInput value={groupName} onChangeText={setGroupName} placeholder="Weekend squad" placeholderTextColor={colors.mutedSoft} style={styles.input} />
            <Text style={styles.inputLabel}>Max members</Text>
            <TextInput value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" placeholder="6" placeholderTextColor={colors.mutedSoft} style={styles.input} />
            <Pressable onPress={handleCreateGroup} disabled={createGroupMutation.isPending} style={[styles.primaryButton, createGroupMutation.isPending ? styles.disabledButton : null]}>
              <Text style={styles.primaryButtonLabel}>{createGroupMutation.isPending ? 'Creating...' : 'Create and enter chat'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function GroupCard({ group, isJoining, onJoin }: { group: OpenBuddyGroup; isJoining: boolean; onJoin: () => void }) {
  const spotsLeft = Math.max(group.max_members - group.member_count, 0);
  const isFull = spotsLeft === 0 && !group.is_current_user_member;

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupTopRow}>
        <View style={styles.groupTitleBlock}>
          <Text style={styles.groupName}>{group.name ?? 'Buddy group'}</Text>
          <Text style={styles.mutedText}>{group.member_count}/{group.max_members} members</Text>
        </View>
        <AvatarStack avatars={group.member_avatars} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min((group.member_count / group.max_members) * 100, 100)}%` }]} />
      </View>
      <View style={styles.groupBottomRow}>
        <Text style={styles.spotsText}>{group.is_current_user_member ? 'You are in this group' : isFull ? 'Group is full' : `${spotsLeft} spots open`}</Text>
        <Pressable onPress={onJoin} disabled={isJoining || isFull} style={[styles.joinButton, group.is_current_user_member ? styles.chatButton : null, isFull ? styles.disabledOutlineButton : null]}>
          <Text style={[styles.joinButtonLabel, group.is_current_user_member ? styles.chatButtonLabel : null]}>{group.is_current_user_member ? 'Open chat' : 'Join'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AvatarStack({ avatars }: { avatars: string[] }) {
  const visibleAvatars = avatars.slice(0, 3);

  return (
    <View style={styles.avatarStack}>
      {visibleAvatars.map((avatar, index) => (
        <Image key={`${avatar}-${index}`} source={{ uri: avatar }} style={[styles.avatar, { marginLeft: index === 0 ? 0 : -spacing.sm }]} />
      ))}
      {visibleAvatars.length === 0 ? (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" color={colors.muted} size={18} />
        </View>
      ) : null}
    </View>
  );
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
  content: { padding: spacing.base, paddingBottom: spacing.xxl, gap: spacing.base },
  heroCard: { borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, padding: spacing.lg, borderWidth: 1, borderColor: colors.hairlineSoft },
  heroIcon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, marginBottom: spacing.md },
  heroTitle: { ...typography.displaySm, color: colors.ink, marginBottom: spacing.sm },
  heroText: { ...typography.bodySm, color: colors.body, marginBottom: spacing.base },
  outlineButton: { height: 46, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  outlineButtonLabel: { ...typography.buttonSm, color: colors.ink },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.titleMd, color: colors.ink },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 38, borderRadius: radius.full, paddingHorizontal: spacing.md, backgroundColor: colors.primary },
  addButtonLabel: { ...typography.buttonSm, color: colors.onPrimary },
  mutedText: { ...typography.bodySm, color: colors.muted },
  emptyCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairlineSoft, padding: spacing.lg, backgroundColor: colors.canvas },
  emptyTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.sm },
  groupCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.canvas, padding: spacing.base, ...shadow.card },
  groupTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base, marginBottom: spacing.base },
  groupTitleBlock: { flex: 1 },
  groupName: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.xs },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: radius.full, borderWidth: 2, borderColor: colors.canvas, backgroundColor: colors.surfaceSoft },
  avatarFallback: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  progressTrack: { height: 6, borderRadius: radius.full, overflow: 'hidden', backgroundColor: colors.surfaceStrong, marginBottom: spacing.base },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  groupBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.base },
  spotsText: { ...typography.bodySm, color: colors.body, flex: 1 },
  joinButton: { minWidth: 96, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  joinButtonLabel: { ...typography.buttonSm, color: colors.onPrimary },
  chatButton: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.ink },
  chatButtonLabel: { color: colors.ink },
  disabledOutlineButton: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.hairline },
  modalScrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.sm },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modalTitle: { ...typography.displaySm, color: colors.ink },
  modalClose: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  inputLabel: { ...typography.caption, color: colors.ink },
  input: { minHeight: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: spacing.base, color: colors.ink, ...typography.bodyMd },
  primaryButton: { height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: spacing.sm },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  disabledButton: { backgroundColor: colors.primaryDisabled },
});
