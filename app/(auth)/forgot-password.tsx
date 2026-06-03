import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordRoute() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim().toLowerCase());

    if (error) {
      setError('root', { message: error.message });
      return;
    }

    setError('root', { type: 'success', message: 'Check your email for a reset link.' });
  }

  const isSuccess = errors.root?.type === 'success';

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <AuthHero />
          <View style={styles.contentCard}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter your email and we will send a reset link.</Text>

            <View style={styles.formStack}>
              {errors.root?.message ? (
                <View style={[styles.messageBanner, isSuccess ? styles.successBanner : styles.errorBanner]}>
                  <Text style={[styles.messageBannerText, isSuccess ? styles.successText : styles.errorText]}>
                    {errors.root.message}
                  </Text>
                </View>
              ) : null}

              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      placeholderTextColor={colors.mutedSoft}
                      style={[styles.textInput, errors.email ? styles.textInputError : null]}
                    />
                    {errors.email?.message ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
                  </View>
                )}
              />

              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
              >
                <Text style={styles.primaryButtonLabel}>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</Text>
              </Pressable>

              <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.backLinkWrap}>
                <Text style={styles.backLink}>Back to Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AuthHero() {
  return (
    <View style={styles.heroBand}>
      <View style={styles.heroTextureLarge} />
      <View style={styles.heroTextureSmall} />
      <View style={styles.heroTextureDot} />
      <View style={styles.heroWave} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.section,
  },
  heroBand: {
    height: 220,
    overflow: 'hidden',
    backgroundColor: colors.authPeach,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  heroTextureLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: radius.full,
    backgroundColor: colors.authCoral,
    opacity: 0.72,
    top: -92,
    left: -56,
    transform: [{ rotate: '-18deg' }],
  },
  heroTextureSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: radius.full,
    backgroundColor: colors.authApricot,
    opacity: 0.62,
    top: 22,
    right: -42,
  },
  heroTextureDot: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 14,
    borderColor: colors.canvas,
    opacity: 0.24,
    top: 72,
    left: 44,
  },
  heroWave: {
    position: 'absolute',
    left: -24,
    right: -24,
    bottom: -46,
    height: 100,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 38,
    backgroundColor: colors.canvas,
  },
  contentCard: {
    flex: 1,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.section,
  },
  title: {
    ...typography.displayXl,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  formStack: {
    gap: spacing.base,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  textInput: {
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.base,
    ...typography.bodyMd,
    color: colors.ink,
  },
  textInputError: {
    borderColor: colors.error,
  },
  messageBanner: {
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorBanner: {
    borderColor: colors.error,
  },
  successBanner: {
    borderColor: colors.ink,
  },
  messageBannerText: {
    ...typography.bodySm,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
  },
  successText: {
    color: colors.ink,
  },
  primaryButton: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  primaryButtonLabel: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
  backLinkWrap: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  backLink: {
    ...typography.buttonSm,
    color: colors.primary,
  },
});
