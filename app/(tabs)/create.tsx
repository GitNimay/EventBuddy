import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCategory, formatEventDate } from '@/components/EventCard';
import { type EventRecord, type MyEventsFilter, useEventAttendeeCount, useMyCreatedEvents } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const statusTags: { label: string; value: MyEventsFilter }[] = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'Pending', value: 'pending' },
];

export default function CreateRoute() {
  const params = useLocalSearchParams<{ status?: string }>();
  const [selectedStatus, setSelectedStatus] = useState<MyEventsFilter>(params.status === 'pending' ? 'pending' : 'upcoming');
  const myEventsQuery = useMyCreatedEvents(selectedStatus);
  const myEvents = myEventsQuery.data ?? [];

  function openCreateEvent() {
    router.push('/event/create');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={myEvents}
        keyExtractor={(event) => event.id}
        renderItem={({ item }) => <MyEventTile event={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={myEventsQuery.isRefetching} onRefresh={myEventsQuery.refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>My Events</Text>
              <Pressable onPress={openCreateEvent} style={({ pressed }) => [styles.postButton, pressed && styles.pressed]}>
                <Text style={styles.postButtonText}>Post New Event</Text>
              </Pressable>
            </View>

            <View style={styles.statusRow}>
              {statusTags.map((tag) => {
                const isActive = tag.value === selectedStatus;

                return (
                  <Pressable
                    key={tag.value}
                    onPress={() => setSelectedStatus(tag.value)}
                    style={[styles.statusChip, isActive ? styles.statusChipSelected : null]}
                  >
                    <Text style={[styles.statusLabel, isActive ? styles.statusLabelSelected : null]}>{tag.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{getSectionTitle(selectedStatus)}</Text>
              <Text style={styles.sectionCount}>{myEvents.length} posted</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          myEventsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateBody}>Loading your events...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" color={colors.primary} size={30} />
              <Text style={styles.emptyTitle}>You haven’t posted any events yet.</Text>
              <Text style={styles.stateBody}>{selectedStatus === 'pending' ? 'Official events under review will appear here.' : 'Create your first event and it will appear in this hub.'}</Text>
              <Pressable onPress={openCreateEvent} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
                <Text style={styles.emptyButtonText}>Post Your First Event</Text>
              </Pressable>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function MyEventTile({ event }: { event: EventRecord }) {
  const attendeeCountQuery = useEventAttendeeCount(event.id);
  const attendeeCount = attendeeCountQuery.data ?? 0;

  function openDetail() {
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  }

  return (
    <Pressable onPress={openDetail} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      {event.cover_image_url ? (
        <Image source={{ uri: event.cover_image_url }} style={styles.tileImage} />
      ) : (
        <View style={styles.tileImagePlaceholder}>
          <Text style={styles.tileImageText}>{formatCategory(event.category)}</Text>
        </View>
      )}
      <View style={styles.tileMeta}>
        <Text style={styles.tileTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.tileSubtext} numberOfLines={1}>{formatEventDate(event.date)}{event.city ? ` · ${event.city}` : ''}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(event.status)]}>
            <Text style={[styles.statusBadgeText, getStatusBadgeTextStyle(event.status)]}>{getStatusLabel(event.status)}</Text>
          </View>
          <View style={[styles.typeBadge, event.event_type === 'community' ? styles.communityBadge : styles.officialBadge]}>
            <Text style={styles.typeBadgeText}>{event.event_type === 'community' ? 'Community' : 'Official'}</Text>
          </View>
        </View>
        <View style={styles.tileFooter}>
          <Text style={styles.tileSubtext} numberOfLines={1}>{attendeeCount}/{event.max_attendees ?? '∞'} joined</Text>
          <Ionicons name="chevron-forward" color={colors.muted} size={18} />
        </View>
      </View>
    </Pressable>
  );
}

function getSectionTitle(filter: MyEventsFilter) {
  if (filter === 'past') return 'Past Events';
  if (filter === 'pending') return 'Pending Approval';

  return 'Upcoming Events';
}

function getStatusLabel(status: EventRecord['status']) {
  if (status === 'pending') return 'Pending Approval';
  if (status === 'past') return 'Past';
  if (status === 'cancelled') return 'Cancelled';

  return 'Live';
}

function getStatusBadgeStyle(status: EventRecord['status']) {
  if (status === 'pending') return styles.pendingBadge;
  if (status === 'past' || status === 'cancelled') return styles.pastBadge;

  return styles.liveBadge;
}

function getStatusBadgeTextStyle(status: EventRecord['status']) {
  if (status === 'pending' || status === 'past' || status === 'cancelled') return styles.darkBadgeText;

  return null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
    paddingTop: spacing.lg,
    marginBottom: spacing.base,
  },
  title: {
    ...typography.displayXl,
    color: colors.ink,
    flex: 1,
  },
  postButton: {
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
  },
  postButtonText: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
  pressed: {
    opacity: 0.86,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusChip: {
    minHeight: 40,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  statusChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  statusLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  statusLabelSelected: {
    color: colors.canvas,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.ink,
  },
  sectionCount: {
    ...typography.captionSm,
    color: colors.muted,
  },
  tile: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    padding: spacing.sm,
  },
  tileImage: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
  },
  tileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  tileImageText: {
    ...typography.badge,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  tileMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tileTitle: {
    ...typography.caption,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  tileSubtext: {
    ...typography.captionSm,
    color: colors.muted,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  liveBadge: {
    backgroundColor: colors.primary,
  },
  pendingBadge: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pastBadge: {
    backgroundColor: colors.surfaceStrong,
  },
  statusBadgeText: {
    ...typography.badge,
    color: colors.onPrimary,
  },
  darkBadgeText: {
    color: colors.ink,
  },
  typeBadge: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  officialBadge: {
    backgroundColor: colors.ink,
  },
  communityBadge: {
    backgroundColor: colors.primary,
  },
  typeBadgeText: {
    ...typography.badge,
    color: colors.canvas,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  stateBody: {
    ...typography.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyButton: {
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  emptyButtonText: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
});
