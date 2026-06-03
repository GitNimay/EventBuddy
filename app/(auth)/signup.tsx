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
import { fonts, typography } from '@/theme/typography';

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupRoute() {
  const scrollRef = useRef<ScrollView>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: SignupFormValues) {
    const fullName = values.fullName.trim();
    const email = values.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: values.password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError('root', { message: error.message });
      return;
    }

    if (!data.user) {
      setError('root', { message: 'Could not create your account. Please try again.' });
      return;
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      full_name: fullName,
    });

    if (profileError && profileError.code !== '23505') {
      setError('root', { message: profileError.message });
      return;
    }

    router.replace('/(auth)/profile-setup');
  }

  function scrollToFormOffset(y: number) {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 120);
  }

  return (
    <AuthScreenShell
      scrollRef={scrollRef}
      title="Create account"
      subtitle="Start finding events and buddies around you."
    >
      {errors.root?.message ? <ErrorBanner message={errors.root.message} /> : null}

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            label="Full Name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onFocus={() => scrollToFormOffset(0)}
            autoCapitalize="words"
            textContentType="name"
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onFocus={() => scrollToFormOffset(72)}
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
            onFocus={() => scrollToFormOffset(154)}
            secureTextEntry
            textContentType="newPassword"
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            label="Confirm Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onFocus={() => scrollToFormOffset(238)}
            secureTextEntry
            textContentType="newPassword"
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
      >
        <Text style={styles.primaryButtonLabel}>{isSubmitting ? 'Creating account...' : 'Sign Up'}</Text>
      </Pressable>

      <View style={styles.inlineLinkRow}>
        <Text style={styles.mutedText}>Already have an account? </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.inlineLink}>Log In</Text>
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
    height: 184,
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
    top: -112,
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
    top: 10,
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
    top: 58,
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
