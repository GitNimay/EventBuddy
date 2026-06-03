import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { type EventRecord } from './useEvents';

export interface Club {
  id: string;
  name: string;
  college: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string;
  user?: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface ClubEvent {
  id: string;
  club_id: string;
  event_id: string;
  event?: EventRecord | null;
}

export function useClubs(search?: string) {
  return useQuery({
    queryKey: ['clubs', search],
    queryFn: async () => {
      let query = supabase.from('clubs').select('*').order('created_at', { ascending: false });
      if (search && search.trim()) {
        query = query.or(`name.ilike.%${search}%,college.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Club[];
    },
  });
}

export function useClub(clubId?: string) {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      if (!clubId) return null;
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      if (error) throw error;
      return data as Club;
    },
    enabled: !!clubId,
  });
}

export function useClubMembers(clubId?: string) {
  return useQuery({
    queryKey: ['club-members', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from('club_members')
        .select('*, user:users(id, full_name, avatar_url)')
        .eq('club_id', clubId)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return data as ClubMember[];
    },
    enabled: !!clubId,
  });
}

export function useClubEvents(clubId?: string) {
  return useQuery({
    queryKey: ['club-events', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from('club_events')
        .select('*, event:events(*)')
        .eq('club_id', clubId);
      if (error) throw error;
      return data as ClubEvent[];
    },
    enabled: !!clubId,
  });
}

export function useUserClubs(userId?: string) {
  return useQuery({
    queryKey: ['user-clubs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map((m) => m.club_id);
    },
    enabled: !!userId,
  });
}

export function useJoinClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const { error } = await supabase
        .from('club_members')
        .insert({ club_id: clubId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['club-members', vars.clubId] });
      queryClient.invalidateQueries({ queryKey: ['user-clubs', vars.userId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useLeaveClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['club-members', vars.clubId] });
      queryClient.invalidateQueries({ queryKey: ['user-clubs', vars.userId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (club: { name: string; college?: string; description?: string; avatar_url?: string; created_by: string }) => {
      const { data, error } = await supabase
        .from('clubs')
        .insert(club)
        .select()
        .single();
      if (error) throw error;
      return data as Club;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useLinkClubEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, eventId }: { clubId: string; eventId: string }) => {
      const { error } = await supabase
        .from('club_events')
        .insert({ club_id: clubId, event_id: eventId });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['club-events', vars.clubId] });
    },
  });
}
