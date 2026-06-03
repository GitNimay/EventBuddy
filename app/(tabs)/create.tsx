import { useMemo, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCategory, formatEventDate, formatPrice } from '@/components/EventCard';
import { type EventCategoryFilter, type EventRecord, type MyEventsFilter, useEventAttendeeCount, useMyCreatedEvents } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const tags: { label: string; value: EventCategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Music', value: 'music' },
  { label: 'Trek', value: 'trek' },
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Art', value: 'art' },
];

const statusTags: { label: string; value: MyEventsFilter }[] = [
  { label: 'Live', value: 'upcoming' },
  { label: 'Pending', value: 'pending' },
];

export default function CreateRoute() {
  const params = useLocalSearchParams<{ status?: string }>();
  const [selectedTag, setSelectedTag] = useState<EventCategoryFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<MyEventsFilter>(params.status === 'pending' ? 'pending' : 'upcoming');
  const myEventsQuery = useMyCreatedEvents(selectedStatus);

  const liveEvents = useMemo(() => {
    return (myEventsQuery.data ?? []).filter((event) => selectedTag === 'all' || event.category === selectedTag);
  }, [myEventsQuery.data, selectedTag]);

  function openCreateEvent() {
    router.push('/event/create');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={liveEvents}
        keyExtractor={(event) => event.id}
        renderItem={({ item }) => <MyEventTile event={item} />}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
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
                <Text style={styles.postButtonText}>Post Event</Text>
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
              {tags.map((tag) => {
                const isActive = tag.value === selectedTag;

                return (
                  <Pressable
                    key={tag.value}
                    onPress={() => setSelectedTag(tag.value)}
                    style={[styles.tagChip, isActive ? styles.tagChipSelected : null]}
                  >
                    <Text style={[styles.tagLabel, isActive ? styles.tagLabelSelected : null]}>{tag.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{selectedStatus === 'pending' ? 'Pending Events' : 'Live Events'}</Text>
              <Text style={styles.sectionCount}>{liveEvents.length} posted</Text>
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
              <Text style={styles.emptyTitle}>{selectedStatus === 'pending' ? 'No pending events' : 'No live events yet'}</Text>
              <Text style={styles.stateBody}>{selectedStatus === 'pending' ? 'Official events under review will appear here.' : 'Posted live events will appear here.'}</Text>
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
        <Text style={styles.tileSubtext} numberOfLines={1}>{formatEventDate(event.date)}</Text>
        <View style={styles.tileFooter}>
          <Text style={styles.tileSubtext} numberOfLines={1}>{attendeeCount} going</Text>
          <Text style={styles.tilePrice}>{formatPrice(event.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
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
  gridRow: {
    justifyContent: 'space-between',
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
    marginBottom: spacing.md,
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
  tagRow: {
    gap: spacing.lg,
    paddingRight: spacing.base,
    marginBottom: spacing.lg,
  },
  tagChip: {
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipSelected: {
    borderBottomColor: colors.ink,
  },
  tagLabel: {
    ...typography.buttonSm,
    color: colors.muted,
  },
  tagLabelSelected: {
    color: colors.ink,
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
    width: '48%',
    marginBottom: spacing.base,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  tileImage: {
    width: '100%',
    aspectRatio: 1.12,
    backgroundColor: colors.surfaceSoft,
  },
  tileImagePlaceholder: {
    width: '100%',
    aspectRatio: 1.12,
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
    padding: spacing.sm,
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
  tilePrice: {
    ...typography.badge,
    color: colors.ink,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyCard: {
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
  },
});
