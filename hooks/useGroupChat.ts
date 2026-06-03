import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';

const messageSchema = z.string().trim().min(1, 'Message cannot be empty.').max(1000, 'Message must be 1000 characters or less.');

export type ChatUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  sender: ChatUser | null;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  user: ChatUser | null;
};

export type GroupSummary = {
  id: string;
  name: string | null;
  max_members: number;
  event: {
    id: string;
    title: string;
    date: string;
  } | null;
};

export function useGroupMessages(groupId?: string) {
  return useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, group_id, sender_id, content, sent_at, sender:users!messages_sender_id_fkey(id, full_name, avatar_url)')
        .eq('group_id', groupId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data ?? [])
        .map((message) => ({ ...message, sender: normalizeJoinedUser(message.sender) }))
        .reverse() as GroupMessage[];
    },
    enabled: Boolean(groupId),
  });
}

export function useSendMessage(groupId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!groupId) throw new Error('Group not found.');

      const sanitizedContent = messageSchema.parse(stripTags(content));
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in to send messages.');

      const { data, error } = await supabase
        .from('messages')
        .insert({ group_id: groupId, sender_id: authData.user.id, content: sanitizedContent })
        .select('id, group_id, sender_id, content, sent_at, sender:users!messages_sender_id_fkey(id, full_name, avatar_url)')
        .single();

      if (error) throw error;

      return { ...data, sender: normalizeJoinedUser(data.sender) } as GroupMessage;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
    },
  });
}

export function useGroupMembers(groupId?: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buddy_group_members')
        .select('id, group_id, user_id, joined_at, user:users!buddy_group_members_user_id_fkey(id, full_name, avatar_url)')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((member) => ({ ...member, user: normalizeJoinedUser(member.user) })) as GroupMember[];
    },
    enabled: Boolean(groupId),
  });
}

export function useGroupSummary(groupId?: string) {
  return useQuery({
    queryKey: ['group-summary', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buddy_groups')
        .select('id, name, max_members, event:events(id, title, date)')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      return { ...data, event: normalizeJoinedEvent(data.event) } as GroupSummary;
    },
    enabled: Boolean(groupId),
  });
}

export function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, '').trim();
}

function normalizeJoinedUser(user: unknown) {
  if (!user) return null;
  if (Array.isArray(user)) return (user[0] ?? null) as ChatUser | null;

  return user as ChatUser;
}

function normalizeJoinedEvent(event: unknown) {
  if (!event) return null;
  if (Array.isArray(event)) return (event[0] ?? null) as GroupSummary['event'];

  return event as GroupSummary['event'];
}
