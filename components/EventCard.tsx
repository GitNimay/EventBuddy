import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { type GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { type EventRecord, useEventAttendeeCount, useIsSaved, useToggleSave } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type EventCardProps = {
  event: EventRecord;
  showGuestFavorite?: boolean;
  showSave?: boolean;
};

export function EventCard({ event, showGuestFavorite = true, showSave = true }: EventCardProps) {
  const attendeeCountQuery = useEventAttendeeCount(event.id);
  const attendeeCount = attendeeCountQuery.data ?? 0;
  const isSavedQuery = useIsSaved(event.id);
  const toggleSaveMutation = useToggleSave(event.id);
  const isSaved = Boolean(isSavedQuery.data);

  function openDetail() {
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  }

  function toggleSave(pressEvent: GestureResponderEvent) {
    pressEvent.stopPropagation();
    toggleSaveMutation.mutate();
  }

  return (
    <Pressable onPress={openDetail} style={styles.eventCard}>
      <View style={styles.imageWrap}>
        {event.cover_image_url ? (
          <Image source={{ uri: event.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderText}>{formatCategory(event.category)}</Text>
          </View>
        )}
        {showGuestFavorite && attendeeCount > 10 ? (
          <View style={styles.guestFavoriteBadge}>
            <Text style={styles.guestFavoriteBadgeText}>Guest favorite</Text>
          </View>
        ) : null}
        {showSave ? (
          <Pressable onPress={toggleSave} disabled={toggleSaveMutation.isPending} style={styles.heartButton}>
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} color={isSaved ? colors.primary : colors.canvas} size={20} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, event.event_type === 'community' ? styles.communityBadge : styles.officialBadge]}>
            <Text style={[styles.typeBadgeText, event.event_type === 'community' ? styles.communityBadgeText : styles.officialBadgeText]}>
              {event.event_type === 'community' ? 'Community' : 'Official'}
            </Text>
          </View>
          {event.event_type === 'community' ? (
            <View style={styles.genderBadge}>
              <Text style={styles.genderBadgeText}>{formatGenderPreference(event.gender_preference)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.priceText}>{formatPrice(event.price)}</Text>
        </View>
        <Text style={styles.cardSubtext}>{formatCategory(event.category)} - {formatEventDate(event.date)}</Text>
        <Text style={styles.cardSubtext} numberOfLines={1}>{formatVenue(event)}</Text>
        {event.event_type === 'community' ? (
          <Text style={styles.attendeeText}>{event.current_group_size}/{event.max_attendees ?? event.current_group_size} spots filled - {event.current_group_size} people going</Text>
        ) : (
          <Text style={styles.attendeeText}>{attendeeCount} attending</Text>
        )}
      </View>
    </Pressable>
  );
}

export function formatCategory(category?: string | null) {
  if (!category) return 'Event';

  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatEventDate(dateValue: string) {
  return new Date(dateValue).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatVenue(event: EventRecord) {
  return [event.venue_name, event.city].filter(Boolean).join(', ') || 'Venue to be announced';
}

export function formatPrice(price?: number | null) {
  if (!price || price <= 0) return 'Free';

  return `₹${price}`;
}

export function formatGenderPreference(preference?: string | null) {
  if (preference === 'women_only') return 'Women Only';
  if (preference === 'men_only') return 'Men Only';
  if (preference === 'mixed') return 'Mixed';

  return 'Any';
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.base,
    ...shadow.card,
  },
  imageWrap: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceSoft,
  },
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  coverPlaceholderText: {
    ...typography.displaySm,
    color: colors.muted,
  },
  guestFavoriteBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    ...shadow.cardHover,
  },
  guestFavoriteBadgeText: {
    ...typography.badge,
    color: colors.ink,
  },
  heartButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 48,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
  cardMeta: {
    padding: spacing.base,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    borderRadius: radius.full,
    paddingVertical: 4,
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
  },
  officialBadgeText: {
    color: colors.canvas,
  },
  communityBadgeText: {
    color: colors.onPrimary,
  },
  genderBadge: {
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceSoft,
  },
  genderBadgeText: {
    ...typography.badge,
    color: colors.ink,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.ink,
    flex: 1,
  },
  priceText: {
    ...typography.titleSm,
    color: colors.ink,
  },
  cardSubtext: {
    ...typography.bodySm,
    color: colors.muted,
  },
  attendeeText: {
    ...typography.badge,
    color: colors.ink,
    marginTop: spacing.sm,
  },
});

export default EventCard;
