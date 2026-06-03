import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { useSavedEvents } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function SavedRoute() {
  const savedEventsQuery = useSavedEvents();

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={savedEventsQuery.data ?? []}
        keyExtractor={(event) => event.id}
        renderItem={({ item }) => <EventCard event={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={savedEventsQuery.isRefetching} onRefresh={savedEventsQuery.refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Saved Events</Text>
            <Text style={styles.subtitle}>Events you want to come back to.</Text>
          </View>
        }
        ListEmptyComponent={
          savedEventsQuery.isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>Loading saved events...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No saved events yet.</Text>
              <Text style={styles.emptyText}>Tap the heart on any event to save it.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  title: {
    ...typography.displayXl,
    color: colors.ink,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.muted,
    marginTop: spacing.xs,
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
