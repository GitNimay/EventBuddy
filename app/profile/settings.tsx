import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function SettingsScreen() {
  const [buddyAlerts, setBuddyAlerts] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [chatMessages, setChatMessages] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This action is permanent. All your data including profile, events, messages, and badges will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { data: userData } = await supabase.auth.getUser();
              const userId = userData.user?.id;
              if (!userId) return;

              const { error } = await supabase.functions.invoke('delete-account', {
                body: { user_id: userId },
              });
              if (error) throw error;

              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (e: any) {
              Alert.alert('Deletion failed', e?.message ?? 'Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Buddy alerts"
            description="Get notified when a buddy match is found"
            value={buddyAlerts}
            onValueChange={setBuddyAlerts}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Event reminders"
            description="Reminders 24 hours before events"
            value={eventReminders}
            onValueChange={setEventReminders}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Chat messages"
            description="Notifications for new group messages"
            value={chatMessages}
            onValueChange={setChatMessages}
          />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Pressable onPress={handleLogout} style={styles.row} disabled={loggingOut}>
            <Ionicons name="log-out-outline" color={colors.error} size={22} />
            <Text style={styles.dangerText}>{loggingOut ? 'Logging out...' : 'Log Out'}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={handleDeleteAccount} style={styles.row} disabled={deleting}>
            <Ionicons name="trash-outline" color={colors.error} size={22} />
            <Text style={styles.dangerText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>EventBuddy v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={toggleStyles.copy}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Text style={toggleStyles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.hairline, true: colors.primaryDisabled }}
        thumbColor={value ? colors.primary : colors.mutedSoft}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  copy: { flex: 1, marginRight: spacing.md },
  label: { ...typography.bodyMd, color: colors.ink },
  description: { ...typography.captionSm, color: colors.muted, marginTop: spacing.xxs },
});

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
  content: { padding: spacing.base, paddingBottom: 100 },
  sectionTitle: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm, marginTop: spacing.lg },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    paddingHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  divider: { height: 1, backgroundColor: colors.hairlineSoft },
  dangerText: { ...typography.bodyMd, color: colors.error, flex: 1 },
  version: { ...typography.captionSm, color: colors.mutedSoft, textAlign: 'center', marginTop: spacing.xxl },
});
