import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcceptBuddyConnection, useBuddyConnections, type BuddyConnection, type BuddyProfile } from '@/hooks/useBuddies';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function BuddiesRoute() {
  const currentUserQuery = useCurrentUser();
  const connectionsQuery = useBuddyConnections();
  const acceptConnectionMutation = useAcceptBuddyConnection();
  const currentUserId = currentUserQuery.data?.authUser?.id;
  const connections = connectionsQuery.data ?? [];
  const accepted = connections.filter((connection) => connection.status === 'accepted');
  const pending = connections.filter((connection) => connection.status === 'pending');
  const isRefreshing = connectionsQuery.isRefetching || currentUserQuery.isRefetching;

  async function refresh() {
    await Promise.all([connectionsQuery.refetch(), currentUserQuery.refetch()]);
  }

  function accept(connectionId: string) {
    acceptConnectionMutation.mutate(connectionId, {
      onError: (error) => Alert.alert('Could not accept request', error instanceof Error ? error.message : 'Please try again.'),
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Text style={styles.eyebrow}>EventBuddy</Text>
        <Text style={styles.title}>Buddies</Text>
        <Text style={styles.subtitle}>Requests and accepted buddies from your event matches.</Text>

        <Section title="Requests">
          {connectionsQuery.isLoading ? <Text style={styles.mutedText}>Loading buddies...</Text> : null}
          {!connectionsQuery.isLoading && pending.length === 0 ? <EmptyCard text="No pending buddy requests." /> : null}
          {pending.map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} currentUserId={currentUserId} onAccept={() => accept(connection.id)} />
          ))}
        </Section>

        <Section title="Your buddies">
          {!connectionsQuery.isLoading && accepted.length === 0 ? <EmptyCard text="Accepted buddies will show here." /> : null}
          {accepted.map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} currentUserId={currentUserId} onAccept={() => accept(connection.id)} />
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ConnectionRow({ connection, currentUserId, onAccept }: { connection: BuddyConnection; currentUserId?: string; onAccept: () => void }) {
  const otherProfile = getOtherProfile(connection, currentUserId);
  const isIncoming = connection.status === 'pending' && connection.receiver_id === currentUserId;

  return (
    <Pressable onPress={() => otherProfile?.id && router.push({ pathname: '/user/[id]', params: { id: otherProfile.id } })} style={styles.connectionCard}>
      {otherProfile?.avatar_url ? <Image source={{ uri: otherProfile.avatar_url }} style={styles.avatar} /> : <AvatarFallback name={otherProfile?.full_name} />}
      <View style={styles.connectionCopy}>
        <Text style={styles.connectionName}>{otherProfile?.full_name ?? 'EventBuddy member'}</Text>
        <Text style={styles.connectionMeta}>{connection.status === 'accepted' ? 'Buddy connected' : isIncoming ? 'Wants to connect' : 'Request sent'}</Text>
      </View>
      {isIncoming ? (
        <Pressable onPress={onAccept} style={styles.acceptButton}>
          <Text style={styles.acceptButtonLabel}>Accept</Text>
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" color={colors.muted} size={20} />
      )}
    </Pressable>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="people-outline" color={colors.muted} size={22} />
      <Text style={styles.mutedText}>{text}</Text>
    </View>
  );
}

function AvatarFallback({ name }: { name?: string | null }) {
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>{name?.trim().charAt(0).toUpperCase() || 'E'}</Text>
    </View>
  );
}

function getOtherProfile(connection: BuddyConnection, currentUserId?: string) {
  if (connection.requester_id === currentUserId) return connection.receiver as BuddyProfile | null;

  return connection.requester as BuddyProfile | null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  eyebrow: { ...typography.uppercaseTag, color: colors.primary, marginBottom: spacing.xs, textTransform: 'uppercase' },
  title: { ...typography.displayXl, color: colors.ink },
  subtitle: { ...typography.bodyMd, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.lg },
  section: { gap: spacing.md, marginBottom: spacing.xl },
  sectionTitle: { ...typography.titleMd, color: colors.ink },
  mutedText: { ...typography.bodySm, color: colors.muted },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairlineSoft, padding: spacing.base, backgroundColor: colors.canvas },
  connectionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairlineSoft, padding: spacing.md, backgroundColor: colors.canvas },
  avatar: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  avatarFallback: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  avatarInitial: { ...typography.titleMd, color: colors.muted },
  connectionCopy: { flex: 1 },
  connectionName: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.xs },
  connectionMeta: { ...typography.bodySm, color: colors.muted },
  acceptButton: { height: 38, borderRadius: radius.sm, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  acceptButtonLabel: { ...typography.buttonSm, color: colors.onPrimary },
});
