import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type NotificationRecord, type NotificationType, useMarkAllRead, useNotifications } from '@/hooks/useNotifications';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type NotificationListItem =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'notification'; id: string; notification: NotificationRecord };

export default function NotificationsRoute() {
  const notificationsQuery = useNotifications();
  const markAllReadMutation = useMarkAllRead();
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const groupedItems = groupNotifications(notifications);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={groupedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (item.kind === 'section' ? <Text style={styles.sectionTitle}>{item.title}</Text> : <NotificationRow notification={item.notification} />)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={notificationsQuery.isRefetching} onRefresh={notificationsQuery.refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>{unreadCount === 0 ? 'You are all caught up.' : `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}`}</Text>
            </View>
            <Pressable onPress={() => markAllReadMutation.mutate()} disabled={unreadCount === 0 || markAllReadMutation.isPending} style={[styles.markReadButton, unreadCount === 0 ? styles.disabledButton : null]}>
              <Text style={[styles.markReadText, unreadCount === 0 ? styles.disabledText : null]}>Mark all read</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          notificationsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Loading notifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-outline" color={colors.primary} size={32} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.stateText}>Buddy alerts, event reminders, and chat messages will appear here.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function NotificationRow({ notification }: { notification: NotificationRecord }) {
  const iconName = getNotificationIcon(notification.type);

  return (
    <View style={[styles.notificationCard, !notification.is_read ? styles.unreadCard : null]}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} color={colors.primary} size={20} />
      </View>
      <View style={styles.notificationCopy}>
        <View style={styles.notificationTitleRow}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          {!notification.is_read ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.notificationBody}>{notification.body}</Text>
        <Text style={styles.notificationTime}>{formatNotificationTime(notification.created_at)}</Text>
      </View>
    </View>
  );
}

function groupNotifications(notifications: NotificationRecord[]) {
  if (notifications.length === 0) return [];

  const today: NotificationListItem[] = [];
  const earlier: NotificationListItem[] = [];

  notifications.forEach((notification) => {
    const item: NotificationListItem = { kind: 'notification', id: notification.id, notification };

    if (isToday(notification.created_at)) {
      today.push(item);
      return;
    }

    earlier.push(item);
  });

  return [
    ...(today.length > 0 ? [{ kind: 'section' as const, id: 'today', title: 'Today' }, ...today] : []),
    ...(earlier.length > 0 ? [{ kind: 'section' as const, id: 'earlier', title: 'Earlier' }, ...earlier] : []),
  ];
}

function isToday(date: string) {
  const value = new Date(date);
  const now = new Date();

  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate();
}

function getNotificationIcon(type: NotificationType): keyof typeof Ionicons.glyphMap {
  if (type === 'buddy_request') return 'person-add-outline';
  if (type === 'new_member') return 'people-outline';
  if (type === 'event_reminder') return 'calendar-outline';

  return 'chatbubble-ellipses-outline';
}

function formatNotificationTime(date: string) {
  return new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, marginBottom: spacing.lg, paddingTop: spacing.lg },
  headerCopy: { flex: 1 },
  title: { ...typography.displayXl, color: colors.ink },
  subtitle: { ...typography.bodySm, color: colors.muted, marginTop: spacing.xs },
  markReadButton: { minHeight: 40, borderRadius: radius.full, borderWidth: 1, borderColor: colors.ink, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  markReadText: { ...typography.buttonSm, color: colors.ink },
  disabledButton: { borderColor: colors.hairline, backgroundColor: colors.surfaceSoft },
  disabledText: { color: colors.muted },
  sectionTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.md, marginTop: spacing.sm },
  notificationCard: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, backgroundColor: colors.canvas, padding: spacing.base, marginBottom: spacing.md },
  unreadCard: { borderColor: colors.primaryDisabled, backgroundColor: colors.surfaceSoft },
  iconWrap: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairlineSoft },
  notificationCopy: { flex: 1 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notificationTitle: { ...typography.titleSm, color: colors.ink, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  notificationBody: { ...typography.bodySm, color: colors.body, marginTop: spacing.xs },
  notificationTime: { ...typography.captionSm, color: colors.muted, marginTop: spacing.sm },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyCard: { alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairlineSoft, padding: spacing.xl, backgroundColor: colors.canvas },
  emptyTitle: { ...typography.titleMd, color: colors.ink },
  stateText: { ...typography.bodySm, color: colors.muted, textAlign: 'center' },
});
