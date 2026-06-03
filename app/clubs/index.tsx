import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClubs, useUserClubs, useJoinClub, useCreateClub } from '@/hooks/useClubs';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Club } from '@/hooks/useClubs';

export default function ClubsIndexScreen() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubCollege, setNewClubCollege] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.authUser?.id;
  const clubsQuery = useClubs(search);
  const userClubsQuery = useUserClubs(userId);
  const joinClubMutation = useJoinClub();
  const createClubMutation = useCreateClub();

  const joinedClubIds = new Set(userClubsQuery.data ?? []);

  async function handleCreateClub() {
    if (!userId || !newClubName.trim()) return;
    setCreating(true);
    try {
      const club = await createClubMutation.mutateAsync({
        name: newClubName.trim(),
        college: newClubCollege.trim() || undefined,
        description: newClubDesc.trim() || undefined,
        created_by: userId,
      });
      setShowCreate(false);
      setNewClubName('');
      setNewClubCollege('');
      setNewClubDesc('');
      router.push({ pathname: '/clubs/[id]', params: { id: club.id } });
    } catch (e: any) {
      Alert.alert('Create failed', e?.message ?? 'Please try again.');
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(clubId: string) {
    if (!userId) return;
    joinClubMutation.mutate({ clubId, userId });
  }

  function renderClub({ item }: { item: Club }) {
    const isMember = joinedClubIds.has(item.id);
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/clubs/[id]', params: { id: item.id } })}
        style={styles.clubCard}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.clubAvatar} />
        ) : (
          <View style={styles.clubAvatarFallback}>
            <Ionicons name="school-outline" color={colors.muted} size={24} />
          </View>
        )}
        <View style={styles.clubInfo}>
          <Text style={styles.clubName} numberOfLines={1}>{item.name}</Text>
          {item.college ? <Text style={styles.clubCollege} numberOfLines={1}>{item.college}</Text> : null}
        </View>
        {!isMember ? (
          <Pressable onPress={() => handleJoin(item.id)} style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>Join</Text>
          </Pressable>
        ) : (
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark" color={colors.primary} size={16} />
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>College Clubs</Text>
        <Pressable onPress={() => setShowCreate(true)} style={styles.iconBtn}>
          <Ionicons name="add-circle-outline" color={colors.primary} size={24} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" color={colors.muted} size={20} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or college..."
          placeholderTextColor={colors.mutedSoft}
        />
      </View>

      <FlatList
        data={clubsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderClub}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          clubsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="school-outline" color={colors.muted} size={40} />
              <Text style={styles.emptyTitle}>No clubs found</Text>
              <Text style={styles.emptyText}>Create a club or search for one.</Text>
            </View>
          )
        }
      />

      {showCreate && (
        <View style={styles.modal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Club</Text>
            <TextInput
              style={styles.input}
              value={newClubName}
              onChangeText={setNewClubName}
              placeholder="Club name"
              placeholderTextColor={colors.mutedSoft}
              maxLength={50}
            />
            <TextInput
              style={styles.input}
              value={newClubCollege}
              onChangeText={setNewClubCollege}
              placeholder="College (optional)"
              placeholderTextColor={colors.mutedSoft}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={newClubDesc}
              onChangeText={setNewClubDesc}
              placeholder="Description (optional)"
              placeholderTextColor={colors.mutedSoft}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowCreate(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateClub}
                disabled={creating || !newClubName.trim()}
                style={[styles.createBtn, (creating || !newClubName.trim()) && styles.createBtnDisabled]}
              >
                {creating ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.createBtnText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  headerTitle: { ...typography.titleMd, color: colors.ink },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.full,
    height: 48,
    paddingHorizontal: spacing.base,
  },
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.ink },
  list: { padding: spacing.base, paddingBottom: 100 },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  clubAvatar: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  clubAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: { flex: 1 },
  clubName: { ...typography.titleMd, color: colors.ink },
  clubCollege: { ...typography.captionSm, color: colors.muted, marginTop: spacing.xxs },
  joinBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  joinBtnText: { ...typography.buttonSm, color: colors.onPrimary },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  joinedText: { ...typography.buttonSm, color: colors.primary },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.titleMd, color: colors.ink },
  emptyText: { ...typography.bodySm, color: colors.muted },
  modal: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
  modalTitle: { ...typography.displaySm, color: colors.ink, marginBottom: spacing.base },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    height: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.base,
    ...typography.bodyMd,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...typography.buttonMd, color: colors.ink },
  createBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { ...typography.buttonMd, color: colors.onPrimary },
});
