import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type ChatUser, type GroupMessage, useGroupMembers, useGroupMessages, useGroupSummary, useSendMessage } from '@/hooks/useGroupChat';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type PresenceState = Record<string, unknown[]>;

export default function GroupChatRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const groupId = params.id;
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data?.authUser;
  const profile = currentUserQuery.data?.profile;
  const summaryQuery = useGroupSummary(groupId);
  const membersQuery = useGroupMembers(groupId);
  const messagesQuery = useGroupMessages(groupId);
  const sendMessageMutation = useSendMessage(groupId);
  const listRef = useRef<FlatList<GroupMessage>>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [draft, setDraft] = useState('');
  const members = membersQuery.data ?? [];
  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);
  const onlineCount = Object.keys(presenceState).length;
  const isMember = Boolean(currentUser?.id && members.some((member) => member.user_id === currentUser.id));
  const isCheckingMembership = membersQuery.isLoading || currentUserQuery.isLoading;

  useEffect(() => {
    if (messagesQuery.data) setMessages(messagesQuery.data);
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!groupId || !currentUser?.id) return;

    const channel = supabase.channel(`group-chat:${groupId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
        const incoming = payload.new as Omit<GroupMessage, 'sender'>;
        const sender = await fetchSender(incoming.sender_id);

        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id)) return current;

          return [...current, { ...incoming, sender }];
        });
        requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
      })
      .on('presence', { event: 'sync' }, () => {
        setPresenceState(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUser?.id]);

  useEffect(() => {
    if (isCheckingMembership || !groupId) return;
    if (!isMember) {
      Alert.alert('Group access required', 'Join this buddy group before opening chat.');
      router.replace('/(tabs)/buddies');
    }
  }, [groupId, isCheckingMembership, isMember]);

  function sendMessage() {
    sendMessageMutation.mutate(draft, {
      onSuccess: () => {
        setDraft('');
        requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
      },
      onError: (error) => Alert.alert('Could not send message', error instanceof Error ? error.message : 'Please try again.'),
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" color={colors.ink} size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title} numberOfLines={1}>{summaryQuery.data?.name ?? 'Buddy chat'}</Text>
            <Text style={styles.subtitle}>{onlineCount} {onlineCount === 1 ? 'member' : 'members'} online</Text>
          </View>
          {groupId ? (
            <Pressable onPress={() => router.push({ pathname: '/group/[id]/location', params: { id: groupId } })} style={styles.iconButton}>
              <Ionicons name="location-outline" color={colors.primary} size={22} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.memberRail}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberAvatarWrap}>
              {member.user?.avatar_url ? <Image source={{ uri: member.user.avatar_url }} style={styles.memberAvatar} /> : <AvatarFallback user={member.user} size={42} />}
              {presenceState[member.user_id] ? <View style={styles.onlineDot} /> : null}
            </View>
          ))}
        </View>

        <FlatList
          ref={listRef}
          data={displayMessages}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => <MessageBubble message={item} isMine={item.sender_id === currentUser?.id} />}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={messagesQuery.isLoading ? <Text style={styles.emptyText}>Loading messages...</Text> : <Text style={styles.emptyText}>Start the pre-event plan here.</Text>}
        />

        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message the group"
            placeholderTextColor={colors.mutedSoft}
            multiline
            maxLength={1000}
            style={styles.input}
          />
          <Pressable onPress={sendMessage} disabled={sendMessageMutation.isPending || draft.trim().length === 0} style={[styles.sendButton, draft.trim().length === 0 ? styles.sendButtonDisabled : null]}>
            <Ionicons name="send" color={colors.onPrimary} size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, isMine }: { message: GroupMessage; isMine: boolean }) {
  return (
    <View style={[styles.messageRow, isMine ? styles.messageRowMine : null]}>
      {!isMine ? (message.sender?.avatar_url ? <Image source={{ uri: message.sender.avatar_url }} style={styles.senderAvatar} /> : <AvatarFallback user={message.sender} size={32} />) : null}
      <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : null]}>
        {!isMine ? <Text style={styles.senderName}>{message.sender?.full_name ?? 'EventBuddy member'}</Text> : null}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMine ? styles.messageTextMine : null]}>{message.content}</Text>
        </View>
        <Text style={[styles.sentAt, isMine ? styles.sentAtMine : null]}>{formatTime(message.sent_at)}</Text>
      </View>
    </View>
  );
}

function AvatarFallback({ user, size }: { user: ChatUser | null; size: number }) {
  return (
    <View style={[styles.fallbackAvatar, { width: size, height: size }]}> 
      <Text style={styles.fallbackInitial}>{user?.full_name?.trim().charAt(0).toUpperCase() || 'E'}</Text>
    </View>
  );
}

async function fetchSender(senderId: string) {
  const { data } = await supabase.from('users').select('id, full_name, avatar_url').eq('id', senderId).maybeSingle();

  return (data ?? null) as ChatUser | null;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  keyboardWrap: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft },
  iconButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  headerCopy: { flex: 1 },
  title: { ...typography.titleMd, color: colors.ink },
  subtitle: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  memberRail: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft },
  memberAvatarWrap: { position: 'relative' },
  memberAvatar: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: radius.full, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.canvas },
  messageList: { padding: spacing.base, gap: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
  emptyText: { ...typography.bodySm, color: colors.muted, textAlign: 'center', paddingVertical: spacing.xl },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  messageRowMine: { justifyContent: 'flex-end' },
  senderAvatar: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  fallbackAvatar: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  fallbackInitial: { ...typography.badge, color: colors.muted },
  bubbleWrap: { maxWidth: '78%' },
  bubbleWrapMine: { alignItems: 'flex-end' },
  senderName: { ...typography.badge, color: colors.muted, marginBottom: spacing.xs },
  bubble: { borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: spacing.xs },
  bubbleOther: { backgroundColor: colors.surfaceSoft, borderBottomLeftRadius: spacing.xs },
  messageText: { ...typography.bodyMd, color: colors.ink },
  messageTextMine: { color: colors.onPrimary },
  sentAt: { ...typography.captionSm, color: colors.muted, marginTop: spacing.xs },
  sentAtMine: { textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.hairlineSoft, backgroundColor: colors.canvas },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.base, paddingVertical: spacing.md, color: colors.ink, ...typography.bodyMd },
  sendButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sendButtonDisabled: { backgroundColor: colors.primaryDisabled },
});
