import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTicketSplit, useCreateTicketSplit } from '@/hooks/useTicketSplit';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function TicketSplitScreen() {
  const { id: eventId, groupId, price, eventName } = useLocalSearchParams<{
    id: string;
    groupId: string;
    price: string;
    eventName: string;
  }>();

  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.authUser?.id;
  const existingSplitQuery = useTicketSplit(eventId, groupId);
  const createSplitMutation = useCreateTicketSplit();

  const [splitCount, setSplitCount] = useState('');
  const [creating, setCreating] = useState(false);

  const eventPrice = parseFloat(price ?? '0') || 0;
  const people = parseInt(splitCount, 10) || 0;
  const perPerson = people > 0 ? (eventPrice / people).toFixed(2) : '0.00';

  const existingSplit = existingSplitQuery.data;

  function generateUpiLink(amount: number): string {
    const upiId = 'eventbuddy@upi';
    const name = encodeURIComponent('EventBuddy Split');
    return `upi://pay?pa=${upiId}&pn=${name}&am=${amount.toFixed(2)}&cu=INR`;
  }

  async function handleCreate() {
    if (!userId || !eventId || !groupId) return;
    if (people < 2) {
      Alert.alert('Invalid split', 'At least 2 people are required.');
      return;
    }

    setCreating(true);
    try {
      const upiLink = generateUpiLink(eventPrice / people);
      await createSplitMutation.mutateAsync({
        event_id: eventId,
        group_id: groupId,
        total_amount: eventPrice,
        split_count: people,
        per_person_amount: eventPrice / people,
        upi_link: upiLink,
        created_by: userId,
      });
      Alert.alert('Split created', 'Share the UPI link with your group.');
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleShare() {
    const link = existingSplit?.upi_link ?? generateUpiLink(eventPrice / people);
    if (!(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync(link, {
      dialogTitle: `Pay ₹${perPerson} for ${eventName ?? 'event'}`,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Ticket Split</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.eventCard}>
          <Text style={styles.eventName} numberOfLines={1}>{eventName ?? 'Event'}</Text>
          <Text style={styles.totalPrice}>₹{eventPrice.toFixed(2)}</Text>
        </View>

        {existingSplit ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Split already created</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>People</Text>
              <Text style={styles.resultValue}>{existingSplit.split_count}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Per person</Text>
              <Text style={styles.resultValueBig}>₹{existingSplit.per_person_amount?.toFixed(2)}</Text>
            </View>
            <Pressable onPress={handleShare} style={styles.shareBtn}>
              <Ionicons name="share-outline" color={colors.onPrimary} size={20} />
              <Text style={styles.shareBtnText}>Share UPI Link</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.splitCard}>
            <Text style={styles.label}>How many people splitting?</Text>
            <TextInput
              style={styles.input}
              value={splitCount}
              onChangeText={setSplitCount}
              placeholder="2"
              placeholderTextColor={colors.mutedSoft}
              keyboardType="number-pad"
              maxLength={3}
            />

            {people >= 2 && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Each person pays</Text>
                <Text style={styles.resultBig}>₹{perPerson}</Text>
              </View>
            )}

            <Pressable
              onPress={handleCreate}
              disabled={creating || people < 2}
              style={[styles.createBtn, (creating || people < 2) && styles.createBtnDisabled]}
            >
              {creating ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.createBtnText}>Generate UPI Link</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
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
  content: { flex: 1, padding: spacing.base },
  eventCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  eventName: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.sm },
  totalPrice: { ...typography.ratingDisplay, color: colors.primary },
  splitCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
  label: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    height: 56,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.base,
    ...typography.displayMd,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resultCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
  resultTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.base },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resultLabel: { ...typography.bodyMd, color: colors.muted },
  resultValue: { ...typography.titleMd, color: colors.ink },
  resultBig: { ...typography.displayMd, color: colors.primary },
  resultValueBig: { ...typography.displaySm, color: colors.primary },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { ...typography.buttonMd, color: colors.onPrimary },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 48,
    marginTop: spacing.md,
  },
  shareBtnText: { ...typography.buttonMd, color: colors.onPrimary },
});
