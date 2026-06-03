import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type ReportReason, reportReasons, useSubmitReport } from '@/hooks/useSafety';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const reasonLabels: Record<ReportReason, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  fake_profile: 'Fake Profile',
  inappropriate_content: 'Inappropriate Content',
  other: 'Other',
};

export default function ReportUserRoute() {
  const params = useLocalSearchParams<{ userId?: string; userName?: string; eventId?: string }>();
  const reportedUserId = params.userId;
  const userName = params.userName ?? 'this user';
  const eventId = params.eventId;
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const submitReportMutation = useSubmitReport();

  function handleSubmit() {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Choose a reason for reporting this user.');
      return;
    }

    if (!reportedUserId) {
      Alert.alert('Missing info', 'Cannot submit report right now.');
      return;
    }

    Alert.alert(
      'Report and block?',
      `This will report ${userName} and prevent them from appearing in your results.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: () =>
            submitReportMutation.mutate(
              { reportedUserId, reason: selectedReason, description, eventId },
              {
                onSuccess: () => {
                  Alert.alert('Report submitted', `${userName} has been blocked. They will no longer appear in your results.`, [
                    { text: 'OK', onPress: () => router.back() },
                  ]);
                },
                onError: (error) => Alert.alert('Could not submit report', error instanceof Error ? error.message : 'Please try again.'),
              },
            ),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>

        <Text style={styles.title}>Report {userName}</Text>
        <Text style={styles.subtitle}>Help us keep the community safe. This user will be blocked from your results after submitting.</Text>

        <Text style={styles.sectionTitle}>Reason</Text>
        <View style={styles.reasonGrid}>
          {reportReasons.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[styles.reasonChip, isSelected ? styles.reasonChipSelected : null]}
              >
                <Text style={[styles.reasonLabel, isSelected ? styles.reasonLabelSelected : null]}>{reasonLabels[reason]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add details to help us review..."
            placeholderTextColor={colors.mutedSoft}
            multiline
            maxLength={300}
            style={styles.input}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitReportMutation.isPending || !selectedReason}
          style={[styles.submitButton, (submitReportMutation.isPending || !selectedReason) ? styles.disabledButton : null]}
        >
          <Text style={styles.submitButtonLabel}>{submitReportMutation.isPending ? 'Submitting...' : 'Submit Report'}</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonLabel}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  backButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, marginBottom: spacing.lg },
  title: { ...typography.displayMd, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { ...typography.bodySm, color: colors.muted, marginBottom: spacing.xl },
  sectionTitle: { ...typography.titleSm, color: colors.ink, marginBottom: spacing.md },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  reasonChip: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.hairline, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.canvas },
  reasonChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  reasonLabel: { ...typography.buttonSm, color: colors.ink },
  reasonLabelSelected: { color: colors.onPrimary },
  inputGroup: { marginBottom: spacing.xl },
  inputLabel: { ...typography.caption, color: colors.ink, marginBottom: spacing.sm },
  input: { minHeight: 120, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas, padding: spacing.base, color: colors.ink, ...typography.bodyMd, textAlignVertical: 'top' },
  charCount: { ...typography.captionSm, color: colors.muted, textAlign: 'right', marginTop: spacing.xs },
  submitButton: { height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error, marginBottom: spacing.md },
  submitButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  disabledButton: { backgroundColor: colors.primaryDisabled },
  cancelButton: { height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cancelButtonLabel: { ...typography.buttonMd, color: colors.muted },
});
