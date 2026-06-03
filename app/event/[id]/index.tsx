import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCategory, formatEventDate, formatGenderPreference, formatPrice, formatVenue } from '@/components/EventCard';
import {
  useEventAttendeeCount,
  useEventDetail,
  useEventOrganizer,
  useIsAttending,
  useIsSaved,
  useToggleAttend,
  useToggleSave,
} from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function EventDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = params.id;
  const eventQuery = useEventDetail(eventId);
  const event = eventQuery.data;
  const organizerQuery = useEventOrganizer(event?.organizer_id);
  const organizer = organizerQuery.data;
  const attendeeCountQuery = useEventAttendeeCount(eventId ?? '');
  const isSavedQuery = useIsSaved(eventId);
  const isAttendingQuery = useIsAttending(eventId);
  const toggleSaveMutation = useToggleSave(eventId);
  const toggleAttendMutation = useToggleAttend(eventId);
  const attendeeCount = attendeeCountQuery.data ?? 0;
  const isSaved = Boolean(isSavedQuery.data);
  const isAttending = Boolean(isAttendingQuery.data);

  if (eventQuery.isLoading) {
    return <SafeAreaView style={styles.screen}><Text style={styles.loadingText}>Loading event...</Text></SafeAreaView>;
  }

  if (!event) {
    return <SafeAreaView style={styles.screen}><Text style={styles.loadingText}>Event not found.</Text></SafeAreaView>;
  }

  const maxAttendees = event.max_attendees ?? event.current_group_size ?? attendeeCount;
  const spotsOpen = Math.max(maxAttendees - event.current_group_size, 0);

  function showPhaseNotice(title: string, message: string) {
    Alert.alert(title, message);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.coverWrap}>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}><Text style={styles.coverText}>{formatCategory(event.category)}</Text></View>
          )}

          <View style={styles.floatingControls}>
            <Pressable onPress={() => router.back()} style={styles.floatingButton}>
              <Ionicons name="arrow-back" color={colors.ink} size={22} />
            </Pressable>
            <Pressable onPress={() => toggleSaveMutation.mutate()} disabled={toggleSaveMutation.isPending} style={styles.floatingButton}>
              <Ionicons name={isSaved ? 'heart' : 'heart-outline'} color={isSaved ? colors.primary : colors.ink} size={22} />
            </Pressable>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryChip}><Text style={styles.categoryChipText}>{formatCategory(event.category)}</Text></View>
            <View style={[styles.typeBadge, event.event_type === 'community' ? styles.communityBadge : styles.officialBadge]}>
              <Text style={styles.typeBadgeText}>{event.event_type === 'community' ? 'Community' : 'Official'}</Text>
            </View>
          </View>

          <Text style={styles.title}>{event.title}</Text>
          <InfoLine icon="calendar-outline" text={formatEventDate(event.date)} />
          <InfoLine icon="location-outline" text={formatVenue(event)} />
          <InfoLine icon="ticket-outline" text={formatPrice(event.price)} />
          <Text style={styles.attendeeText}>{attendeeCount} people going</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.bodyText}>{event.description}</Text>

          {event.event_type === 'community' ? (
            <View style={styles.sectionCard}>
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
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => toggleAttendMutation.mutate()} disabled={toggleAttendMutation.isPending} style={[styles.primaryButton, isAttending ? styles.attendingButton : null]}>
          <Text style={[styles.primaryButtonLabel, isAttending ? styles.attendingButtonLabel : null]}>{isAttending ? 'Attending' : 'Attend'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/event/[id]/groups', params: { id: event.id } })} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>Find Buddy Group</Text>
        </Pressable>
        <Pressable onPress={() => showPhaseNotice('Phase 10', 'Split Ticket will be connected in Phase 10.')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>Split Ticket</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View style={styles.infoLine}><Ionicons name={icon} color={colors.muted} size={18} /><Text style={styles.metaText}>{text}</Text></View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function getInitial(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || 'E';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: 180 },
  loadingText: { ...typography.bodyMd, color: colors.muted, padding: spacing.base },
  coverWrap: { position: 'relative', backgroundColor: colors.surfaceSoft },
  coverImage: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceSoft },
  coverPlaceholder: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  coverText: { ...typography.displaySm, color: colors.muted },
  floatingControls: { position: 'absolute', top: spacing.xl, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between' },
  floatingButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, ...shadow.card },
  metaBlock: { padding: spacing.base },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  categoryChip: { borderRadius: radius.full, backgroundColor: colors.surfaceSoft, paddingVertical: 5, paddingHorizontal: spacing.sm },
  categoryChipText: { ...typography.badge, color: colors.ink },
  typeBadge: { borderRadius: radius.full, paddingVertical: 5, paddingHorizontal: spacing.sm },
  officialBadge: { backgroundColor: colors.ink },
  communityBadge: { backgroundColor: colors.primary },
  typeBadgeText: { ...typography.badge, color: colors.canvas },
  title: { ...typography.displayXl, color: colors.ink, marginBottom: spacing.md },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  metaText: { ...typography.bodySm, color: colors.muted, flex: 1 },
  attendeeText: { ...typography.titleSm, color: colors.ink, marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.hairlineSoft, marginVertical: spacing.lg },
  sectionTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.sm },
  bodyText: { ...typography.bodyMd, color: colors.body },
  sectionCard: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft, paddingTop: spacing.base, marginTop: spacing.lg },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  avatarFallback: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarInitial: { ...typography.titleMd, color: colors.canvas },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft },
  infoLabel: { ...typography.bodySm, color: colors.muted, flex: 1 },
  infoValue: { ...typography.bodySm, color: colors.ink, flex: 1, textAlign: 'right' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: spacing.sm, padding: spacing.base, paddingBottom: spacing.lg, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  primaryButton: { height: 48, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  attendingButton: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.ink },
  attendingButtonLabel: { color: colors.ink },
  secondaryButton: { height: 48, borderRadius: radius.sm, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonLabel: { ...typography.buttonMd, color: colors.ink },
});
