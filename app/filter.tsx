import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type BudgetFilter,
  type DateRangeFilter,
  type EventCategoryFilter,
  type GroupSizeFilter,
} from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const categoryOptions: { label: string; value: EventCategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Music', value: 'music' },
  { label: 'Trek', value: 'trek' },
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Art', value: 'art' },
  { label: 'Food', value: 'food' },
  { label: 'Comedy', value: 'comedy' },
  { label: 'Sports', value: 'sports' },
  { label: 'Meetup', value: 'meetup' },
  { label: 'Gaming', value: 'gaming' },
];

const budgetOptions: { label: string; value: BudgetFilter }[] = [
  { label: 'Free', value: 'free' },
  { label: 'Under ₹500', value: 'under500' },
  { label: 'Under ₹1000', value: 'under1000' },
  { label: 'Any', value: 'any' },
];

const groupSizeOptions: { label: string; value: GroupSizeFilter }[] = [
  { label: '2-3', value: '2-3' },
  { label: '4-6', value: '4-6' },
  { label: '7+', value: '7plus' },
  { label: 'Any', value: 'any' },
];

const dateRangeOptions: { label: string; value: DateRangeFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Any', value: 'any' },
];

export default function FilterRoute() {
  const params = useLocalSearchParams<{
    category?: EventCategoryFilter;
    budget?: BudgetFilter;
    groupSize?: GroupSizeFilter;
    dateRange?: DateRangeFilter;
  }>();
  const [category, setCategory] = useState<EventCategoryFilter>(normalizeCategory(params.category));
  const [budget, setBudget] = useState<BudgetFilter>(normalizeBudget(params.budget));
  const [groupSize, setGroupSize] = useState<GroupSizeFilter>(normalizeGroupSize(params.groupSize));
  const [dateRange, setDateRange] = useState<DateRangeFilter>(normalizeDateRange(params.dateRange));

  function clearAll() {
    setCategory('all');
    setBudget('any');
    setGroupSize('any');
    setDateRange('any');
  }

  function applyFilters() {
    router.replace({
      pathname: '/(tabs)',
      params: { category, budget, groupSize, dateRange },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Filters</Text>
        <Pressable onPress={clearAll} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FilterSection title="Category">
          <ChipGroup options={categoryOptions} value={category} onChange={setCategory} />
        </FilterSection>

        <FilterSection title="Budget">
          <ChipGroup options={budgetOptions} value={budget} onChange={setBudget} />
        </FilterSection>

        <FilterSection title="Group Size">
          <ChipGroup options={groupSizeOptions} value={groupSize} onChange={setGroupSize} />
        </FilterSection>

        <FilterSection title="Date Range">
          <ChipGroup options={dateRangeOptions} value={dateRange} onChange={setDateRange} />
        </FilterSection>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={applyFilters} style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>Apply Filters</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FilterSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isSelected ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipLabel, isSelected ? styles.chipLabelSelected : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function normalizeCategory(value?: string): EventCategoryFilter {
  return categoryOptions.some((option) => option.value === value) ? (value as EventCategoryFilter) : 'all';
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  title: {
    ...typography.displayXl,
    color: colors.ink,
  },
  clearButton: {
    minHeight: 48,
    justifyContent: 'center',
  },
  clearButtonText: {
    ...typography.buttonSm,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.section,
  },
  section: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    gap: spacing.base,
  },
  sectionTitle: {
    ...typography.displaySm,
    color: colors.ink,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  chipSelected: {
    backgroundColor: colors.ink,
  },
  chipLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  chipLabelSelected: {
    color: colors.canvas,
  },
  footer: {
    padding: spacing.base,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
  },
  primaryButton: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
});
