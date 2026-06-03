import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useResendVerificationEmail, useVerification, useVerifyEmail } from '@/hooks/useSafety';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function VerifyProfileRoute() {
  const currentUserQuery = useCurrentUser();
  const verificationQuery = useVerification();
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationEmail();
  const profile = currentUserQuery.data?.profile;
  const authUser = currentUserQuery.data?.authUser;
  const isEmailConfirmed = Boolean(authUser?.email_confirmed_at);
  const isAlreadyVerified = Boolean(profile?.is_verified);
  const [resendSent, setResendSent] = useState(false);

  const email = authUser?.email ?? profile?.email ?? '';

  async function handleVerify() {
    if (!isEmailConfirmed) {
      Alert.alert('Email not confirmed', 'Please confirm your email first. Check your inbox for the confirmation link.');
      return;
    }

    verifyMutation.mutate(undefined, {
      onSuccess: () => Alert.alert('You are verified!', 'The verified badge will now appear on your profile.'),
      onError: (error) => Alert.alert('Verification failed', getErrorMessage(error)),
    });
  }

  function handleResend() {
    resendMutation.mutate(undefined, {
      onSuccess: () => setResendSent(true),
      onError: (error) => Alert.alert('Could not resend', getErrorMessage(error)),
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>

        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" color={isAlreadyVerified ? colors.primary : colors.muted} size={56} />
        </View>

        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>Confirmed emails earn a verified badge that appears on your profile and all buddy cards.</Text>

        <View style={styles.stepCard}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, isEmailConfirmed ? styles.stepDotDone : null]}>
              <Text style={[styles.stepDotText, isEmailConfirmed ? styles.stepDotTextDone : null]}>{isEmailConfirmed ? '✓' : '1'}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>Your email</Text>
              <Text style={styles.stepBody}>{email || 'No email on file'}</Text>
            </View>
          </View>
        </View>

        {isAlreadyVerified ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" color={colors.primary} size={28} />
            <View style={styles.successCopy}>
              <Text style={styles.successTitle}>You are verified</Text>
              <Text style={styles.successBody}>Your profile displays the verified badge across the app.</Text>
            </View>
          </View>
        ) : isEmailConfirmed ? (
          <Pressable onPress={handleVerify} disabled={verifyMutation.isPending} style={[styles.primaryButton, verifyMutation.isPending ? styles.disabledButton : null]}>
            <Text style={styles.primaryButtonLabel}>{verifyMutation.isPending ? 'Verifying...' : 'Verify Now'}</Text>
          </Pressable>
        ) : (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingBody}>Check your inbox for a confirmation email, then return here.</Text>
            <Pressable onPress={handleResend} disabled={resendMutation.isPending} style={[styles.outlineButton, resendMutation.isPending ? styles.disabledOutlineButton : null]}>
              <Text style={[styles.outlineButtonLabel, resendSent ? styles.sentLabel : null]}>
                {resendMutation.isPending ? 'Sending...' : resendSent ? 'Email sent ✓' : 'Resend Email'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Badge preview</Text>
          <View style={styles.previewRow}>
            <Ionicons name="checkmark-circle" color={colors.primary} size={20} />
            <Text style={styles.previewLabel}>Verified Buddy</Text>
          </View>
          <Text style={styles.previewBody}>This badge will appear next to your name on profiles, group cards, and chat messages.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  backButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, marginBottom: spacing.lg },
  heroIcon: { width: 88, height: 88, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, alignSelf: 'center', marginBottom: spacing.lg },
  title: { ...typography.displayMd, color: colors.ink, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.bodySm, color: colors.muted, textAlign: 'center', marginBottom: spacing.xl },
  stepCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.canvas, padding: spacing.base, marginBottom: spacing.base },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepDot: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong },
  stepDotDone: { backgroundColor: colors.primary },
  stepDotText: { ...typography.badge, color: colors.muted },
  stepDotTextDone: { color: colors.onPrimary },
  stepCopy: { flex: 1 },
  stepTitle: { ...typography.titleSm, color: colors.ink },
  stepBody: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  primaryButton: { height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginBottom: spacing.base },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  disabledButton: { backgroundColor: colors.primaryDisabled },
  outlineButton: { height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  outlineButtonLabel: { ...typography.buttonSm, color: colors.ink },
  disabledOutlineButton: { borderColor: colors.hairline, backgroundColor: colors.surfaceSoft },
  sentLabel: { color: colors.primary },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.canvas, padding: spacing.base, marginBottom: spacing.base },
  successCopy: { flex: 1 },
  successTitle: { ...typography.titleMd, color: colors.ink },
  successBody: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  pendingCard: { gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.canvas, padding: spacing.base, marginBottom: spacing.base },
  pendingBody: { ...typography.bodySm, color: colors.body },
  previewCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.surfaceSoft, padding: spacing.base },
  previewTitle: { ...typography.titleSm, color: colors.ink, marginBottom: spacing.md },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  previewLabel: { ...typography.titleMd, color: colors.ink },
  previewBody: { ...typography.bodySm, color: colors.muted },
});
