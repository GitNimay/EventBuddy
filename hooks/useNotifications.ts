import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type NotificationType = 'buddy_request' | 'new_member' | 'event_reminder' | 'chat_message';

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, body, is_read, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as NotificationRecord[];
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in to update notifications.');

      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', authData.user.id).eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
