import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fontFamily, fontSize, lineHeight } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen({ title, description = 'Foundation route placeholder.' }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>EventBuddy</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  kicker: {
    color: colors.primary,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;
