import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginRoute() {
  const scrollRef = useRef<ScrollView>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const email = values.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: values.password,
    });

    if (error) {
      setError('root', { message: error.message });
      return;
    }

    if (!data.user) {
      setError('root', { message: 'Could not log you in. Please try again.' });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('vibe_type')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      setError('root', { message: profileError.message });
      return;
    }

    router.replace(profile?.vibe_type ? '/(tabs)' : '/(auth)/profile-setup');
  }

  function scrollToFormOffset(y: number) {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 120);
  }

  return (
    <AuthScreenShell scrollRef={scrollRef} title="Log in" subtitle="Welcome back. Find your next event buddy.">
      {errors.root?.message ? <ErrorBanner message={errors.root.message} /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onFocus={() => scrollToFormOffset(0)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onFocus={() => scrollToFormOffset(96)}
            secureTextEntry
            textContentType="password"
            error={errors.password?.message}
          />
        )}
      />

      <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLinkWrap}>
        <Text style={styles.forgotLink}>Forgot password?</Text>
      </Pressable>

      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
      >
        <Text style={styles.primaryButtonLabel}>{isSubmitting ? 'Logging in...' : 'Log In'}</Text>
      </Pressable>

      <View style={styles.inlineLinkRow}>
        <Text style={styles.mutedText}>Don't have an account? </Text>
        <Pressable onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.inlineLink}>Sign Up</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

function AuthScreenShell({
  children,
  scrollRef,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  scrollRef: React.RefObject<ScrollView | null>;
  title: string;
  subtitle: string;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <AuthHero />
          <View style={styles.contentCard}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.formStack}>{children}</View>
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

type FormFieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

function FormField({ label, error, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.mutedSoft}
        style={[styles.textInput, error ? styles.textInputError : null]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
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
  errorText: {
    ...typography.bodySm,
    color: colors.error,
  },
  errorBanner: {
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
  },
  errorBannerText: {
    ...typography.bodySm,
    color: colors.error,
  },
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  forgotLink: {
    ...typography.buttonSm,
    color: colors.primary,
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
  inlineLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  mutedText: {
    ...typography.bodySm,
    color: colors.muted,
  },
  inlineLink: {
    ...typography.buttonSm,
    color: colors.primary,
  },
});
