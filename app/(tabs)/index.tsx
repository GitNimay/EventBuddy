import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotifications } from '@/hooks/useNotifications';
import {
  type BudgetFilter,
  type DateRangeFilter,
  type EventCategoryFilter,
  type EventTypeFilter,
  type GroupSizeFilter,
  useEvents,
} from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const categories: { label: string; value: EventCategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Music', value: 'music' },
  { label: 'Trek', value: 'trek' },
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Meetup', value: 'meetup' },
  { label: 'Art', value: 'art' },
];

const eventTypes: { label: string; value: EventTypeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Official', value: 'official' },
  { label: 'Community', value: 'community' },
];

export default function HomeRoute() {
  const params = useLocalSearchParams<{
    category?: EventCategoryFilter;
    budget?: BudgetFilter;
    groupSize?: GroupSizeFilter;
    dateRange?: DateRangeFilter;
  }>();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryFilter>(normalizeCategory(params.category));
  const [selectedEventType, setSelectedEventType] = useState<EventTypeFilter>('all');
  const deferredSearchText = useDeferredValue(searchText);
  const { data: currentUser } = useCurrentUser();
  const eventsQuery = useEvents({
    budget: normalizeBudget(params.budget),
    groupSize: normalizeGroupSize(params.groupSize),
    dateRange: normalizeDateRange(params.dateRange),
    eventType: selectedEventType,
  });

  useEffect(() => {
    setSelectedCategory(normalizeCategory(params.category));
  }, [params.category]);

  const filteredEvents = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase();

    return (eventsQuery.data ?? []).filter((event) => {
      const matchesTitle = query.length === 0 || event.title.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

      return matchesTitle && matchesCategory;
    });
  }, [deferredSearchText, eventsQuery.data, selectedCategory]);

  const firstName = getFirstName(currentUser?.profile?.full_name);
  const notificationsQuery = useNotifications();
  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.is_read).length;
  const isRefreshing = eventsQuery.isRefetching;

  async function handleRefresh() {
    await Promise.all([
      eventsQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ['event-attendee-count'] }),
    ]);
  }

  function openFilters() {
    router.push({
      pathname: '/filter',
      params: {
        category: selectedCategory,
        budget: normalizeBudget(params.budget),
        groupSize: normalizeGroupSize(params.groupSize),
        dateRange: normalizeDateRange(params.dateRange),
      },
    } as never);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>Hey {firstName}</Text>
              <Pressable onPress={() => router.push('/notifications')} style={styles.bellButton}>
                <Ionicons name="notifications-outline" color={colors.ink} size={24} />
                {unreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
            <Text style={styles.subGreeting}>Find the plan, then find your people.</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>Search</Text>
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search events by title"
                  placeholderTextColor={colors.mutedSoft}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.searchInput}
                />
              </View>
            </View>

            <View style={styles.filterCategoryRow}>
              <Pressable onPress={openFilters} style={styles.filterChipButton}>
                <Text style={styles.filterChipButtonText}>Filter</Text>
              </Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChipRow}>
                {eventTypes.map((eventType) => {
                  const isSelected = selectedEventType === eventType.value;

                  return (
                    <Pressable
                      key={eventType.value}
                      onPress={() => setSelectedEventType(eventType.value)}
                      style={[styles.eventTypeChip, isSelected ? styles.eventTypeChipSelected : null]}
                    >
                      <Text style={[styles.eventTypeChipLabel, isSelected ? styles.eventTypeChipLabelSelected : null]}>
                        {eventType.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category.value;

                return (
                  <Pressable
                    key={category.value}
                    onPress={() => setSelectedCategory(category.value)}
                    style={[styles.categoryChip, isSelected ? styles.categoryChipSelected : null]}
                  >
                    <Text style={[styles.categoryChipLabel, isSelected ? styles.categoryChipLabelSelected : null]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{eventsQuery.isLoading ? 'Loading events...' : 'No events found'}</Text>
            <Text style={styles.emptyText}>
              {eventsQuery.isLoading
                ? 'Upcoming events will appear here.'
                : 'Try a different search, category, or smart filter.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function getFirstName(fullName?: string | null) {
  if (!fullName) return 'there';

  return fullName.trim().split(' ')[0] || 'there';
}

function normalizeCategory(value?: string): EventCategoryFilter {
  return categories.some((category) => category.value === value) ? (value as EventCategoryFilter) : 'all';
}

function normalizeBudget(value?: string): BudgetFilter {
  return value === 'free' || value === 'under500' || value === 'under1000' ? value : 'any';
}

function normalizeGroupSize(value?: string): GroupSizeFilter {
  return value === '2-3' || value === '4-6' || value === '7plus' ? value : 'any';
}

function normalizeDateRange(value?: string): DateRangeFilter {
  return value === 'today' || value === 'week' || value === 'month' ? value : 'any';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  greeting: {
    ...typography.displayXl,
    color: colors.ink,
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.badge,
    color: colors.onPrimary,
    lineHeight: 18,
  },
  subGreeting: {
    ...typography.bodySm,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  searchBar: {
    flex: 1,
    height: 56,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    ...shadow.card,
  },
  searchIcon: {
    ...typography.badge,
    color: colors.muted,
    textTransform: 'uppercase',
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySm,
    color: colors.ink,
    minHeight: 48,
  },
  filterCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
    marginTop: spacing.sm,
  },
  typeChipRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  eventTypeChip: {
    minHeight: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTypeChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  eventTypeChipLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  eventTypeChipLabelSelected: {
    color: colors.canvas,
  },
  categoryChip: {
    minHeight: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: {
    backgroundColor: colors.ink,
  },
  categoryChipLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  categoryChipLabelSelected: {
    color: colors.canvas,
  },
  filterChipButton: {
    minHeight: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipButtonText: {
    ...typography.buttonSm,
    color: colors.onPrimary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.displaySm,
    color: colors.ink,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
});
