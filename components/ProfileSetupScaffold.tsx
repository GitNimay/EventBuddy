import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type ProfileSetupScaffoldProps = {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimaryPress: () => void;
  footerLinkLabel?: string;
  onFooterLinkPress?: () => void;
};

export function ProfileSetupScaffold({
  step,
  title,
  subtitle,
  children,
  primaryLabel,
  primaryDisabled = false,
  primaryLoading = false,
  onPrimaryPress,
  footerLinkLabel,
  onFooterLinkPress,
}: ProfileSetupScaffoldProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Step {step} of 3</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {children}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onPrimaryPress}
          disabled={primaryDisabled || primaryLoading}
          style={[styles.primaryButton, primaryDisabled || primaryLoading ? styles.primaryButtonDisabled : null]}
        >
          <Text style={styles.primaryButtonLabel}>{primaryLoading ? 'Working...' : primaryLabel}</Text>
        </Pressable>

        {footerLinkLabel && onFooterLinkPress ? (
          <Pressable onPress={onFooterLinkPress} style={styles.footerLinkWrap}>
            <Text style={styles.footerLink}>{footerLinkLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.section,
  },
  progressHeader: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressText: {
    ...typography.caption,
    color: colors.muted,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.hairlineSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  headerBlock: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.displayXl,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.body,
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.base,
    paddingBottom: spacing.lg,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
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
  footerLinkWrap: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    ...typography.buttonSm,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});

export default ProfileSetupScaffold;
