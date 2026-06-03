import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCategory, formatEventDate, formatGenderPreference, formatPrice, formatVenue } from '@/components/EventCard';
import { useEventById, useEventOrganizer } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function EventDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventQuery = useEventById(params.id);
  const event = eventQuery.data;
  const organizerQuery = useEventOrganizer(event?.organizer_id);
  const organizer = organizerQuery.data;
  const maxAttendees = event?.max_attendees ?? event?.current_group_size ?? 0;
  const spotsOpen = event ? Math.max(maxAttendees - event.current_group_size, 0) : 0;

  if (eventQuery.isLoading) {
    return <SafeAreaView style={styles.screen}><Text style={styles.loadingText}>Loading event...</Text></SafeAreaView>;
  }

  if (!event) {
    return <SafeAreaView style={styles.screen}><Text style={styles.loadingText}>Event not found.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {event.cover_image_url ? (
          <Image source={{ uri: event.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}><Text style={styles.coverText}>{formatCategory(event.category)}</Text></View>
        )}

        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, event.event_type === 'community' ? styles.communityBadge : styles.officialBadge]}>
            <Text style={styles.typeBadgeText}>{event.event_type === 'community' ? 'Community' : 'Official'}</Text>
          </View>
          {event.event_type === 'community' ? <View style={styles.softBadge}><Text style={styles.softBadgeText}>{formatGenderPreference(event.gender_preference)}</Text></View> : null}
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.metaText}>{formatCategory(event.category)} - {formatEventDate(event.date)}</Text>
        <Text style={styles.metaText}>{formatVenue(event)}</Text>
        <Text style={styles.priceText}>{formatPrice(event.price)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.bodyText}>{event.description}</Text>
        </View>

        {event.event_type === 'community' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this outing</Text>
            <View style={styles.organizerRow}>
              {organizer?.avatar_url ? <Image source={{ uri: organizer.avatar_url }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{getInitial(organizer?.full_name)}</Text></View>}
              <Text style={styles.bodyText}>Organized by {organizer?.full_name ?? 'EventBuddy member'}</Text>
            </View>
            <InfoRow label="Group so far" value={`${event.current_group_size} people already going`} />
            <InfoRow label="Slots left" value={`${spotsOpen} spots open`} />
            <InfoRow label="Gender preference" value={formatGenderPreference(event.gender_preference)} />
            {event.gender_preference === 'mixed' ? <InfoRow label="Mixed slots" value={`${event.men_slots ?? 0} men slots, ${event.women_slots ?? 0} women slots remaining`} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function getInitial(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || 'E';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  loadingText: { ...typography.bodyMd, color: colors.muted, padding: spacing.base },
  coverImage: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, marginBottom: spacing.base },
  coverPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, marginBottom: spacing.base },
  coverText: { ...typography.displaySm, color: colors.muted },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeBadge: { borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: spacing.sm },
  officialBadge: { backgroundColor: colors.ink },
  communityBadge: { backgroundColor: colors.primary },
  typeBadgeText: { ...typography.badge, color: colors.canvas },
  softBadge: { borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceSoft },
  softBadgeText: { ...typography.badge, color: colors.ink },
  title: { ...typography.displayXl, color: colors.ink, marginBottom: spacing.xs },
  metaText: { ...typography.bodySm, color: colors.muted },
  priceText: { ...typography.titleMd, color: colors.ink, marginTop: spacing.sm },
  section: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft, paddingTop: spacing.base, marginTop: spacing.lg },
  sectionTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.sm },
  bodyText: { ...typography.bodyMd, color: colors.body },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  avatarFallback: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarInitial: { ...typography.titleMd, color: colors.canvas },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft },
  infoLabel: { ...typography.bodySm, color: colors.muted, flex: 1 },
  infoValue: { ...typography.bodySm, color: colors.ink, flex: 1, textAlign: 'right' },
});
