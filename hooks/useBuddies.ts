import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type BuddyMatch = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  vibe_type: string | null;
  interests: string[];
  bio: string | null;
  trust_score: number;
  is_verified: boolean;
  shared_interest_count: number;
  match_score: number;
};

export type OpenBuddyGroup = {
  group_id: string;
  event_id: string;
  name: string | null;
  max_members: number;
  created_by: string;
  created_at: string;
  member_count: number;
  member_avatars: string[];
  is_current_user_member: boolean;
};

export type BuddyProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  vibe_type: string | null;
  interests: string[];
  bio: string | null;
  trust_score: number;
  is_verified: boolean;
  created_at: string;
};

export type BuddyBadge = {
  id: string;
  badge_type: string;
  earned_at: string;
};

export type BuddyConnection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  requester?: BuddyProfile | null;
  receiver?: BuddyProfile | null;
};

export function useBuddyMatches(eventId?: string) {
  return useQuery({
    queryKey: ['buddy-matches', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_buddy_matches', { p_event_id: eventId });

      if (error) throw error;

      return (data ?? []) as BuddyMatch[];
    },
    enabled: Boolean(eventId),
  });
}

export function useOpenGroups(eventId?: string) {
  return useQuery({
    queryKey: ['open-buddy-groups', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_open_groups', { p_event_id: eventId });

      if (error) throw error;

      return (data ?? []) as OpenBuddyGroup[];
    },
    enabled: Boolean(eventId),
  });
}

export function useCreateBuddyGroup(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, maxMembers }: { name: string; maxMembers: number }) => {
      if (!eventId) throw new Error('Event not found.');

      const { data, error } = await supabase.rpc('create_buddy_group', {
        p_event_id: eventId,
        p_name: name,
        p_max_members: maxMembers,
      });

      if (error) throw error;

      return data as string;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['open-buddy-groups', eventId] });
    },
  });
}

export function useJoinBuddyGroup(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('join_buddy_group', { p_group_id: groupId });

      if (error) throw error;
      return data as string;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['open-buddy-groups', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['buddy-connections'] });
    },
  });
}

export function useBuddyProfile(userId?: string) {
  return useQuery({
    queryKey: ['buddy-profile', userId],
    queryFn: async () => {
      const [profileResult, badgesResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, avatar_url, vibe_type, interests, bio, trust_score, is_verified, created_at')
          .eq('id', userId)
          .single(),
        supabase.from('badges').select('id, badge_type, earned_at').eq('user_id', userId).order('earned_at', { ascending: false }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (badgesResult.error) throw badgesResult.error;

      return {
        profile: profileResult.data as BuddyProfile,
        badges: (badgesResult.data ?? []) as BuddyBadge[],
      };
    },
    enabled: Boolean(userId),
  });
}

export function useBuddyConnections() {
  return useQuery({
    queryKey: ['buddy-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buddy_connections')
        .select(
          'id, requester_id, receiver_id, status, created_at, requester:users!buddy_connections_requester_id_fkey(id, full_name, avatar_url, vibe_type, interests, bio, trust_score, is_verified, created_at), receiver:users!buddy_connections_receiver_id_fkey(id, full_name, avatar_url, vibe_type, interests, bio, trust_score, is_verified, created_at)',
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((connection) => ({
        ...connection,
        requester: normalizeJoinedProfile(connection.requester),
        receiver: normalizeJoinedProfile(connection.receiver),
      })) as BuddyConnection[];
    },
  });
}

export function useRequestBuddyConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('request_buddy_connection', { p_receiver_id: userId });

      if (error) throw error;
      return data as string;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buddy-connections'] }),
        queryClient.invalidateQueries({ queryKey: ['buddy-matches'] }),
      ]);
    },
  });
}

export function useAcceptBuddyConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase.from('buddy_connections').update({ status: 'accepted' }).eq('id', connectionId);

      if (error) throw error;
      return connectionId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['buddy-connections'] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in to block users.');

      const { error } = await supabase.from('blocked_users').upsert(
        { blocker_id: authData.user.id, blocked_id: userId },
        { onConflict: 'blocker_id,blocked_id' },
      );

      if (error) throw error;
      return userId;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buddy-connections'] }),
        queryClient.invalidateQueries({ queryKey: ['buddy-matches'] }),
      ]);
    },
  });
}

function normalizeJoinedProfile(profile: unknown) {
  if (!profile) return null;
  if (Array.isArray(profile)) return (profile[0] ?? null) as BuddyProfile | null;

  return profile as BuddyProfile;
}
