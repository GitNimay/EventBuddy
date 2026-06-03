import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';

export type VerificationRecord = {
  id: string;
  user_id: string;
  method: string;
  verified_at: string;
  status: string;
};

export type RatingRecord = {
  id: string;
  event_id: string;
  rater_id: string;
  rated_user_id: string;
  score: number;
  comment: string | null;
  created_at: string;
};

export type ReportRecord = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  event_id: string | null;
  status: string;
  created_at: string;
};

export type LiveLocationRecord = {
  id: string;
  user_id: string;
  group_id: string;
  latitude: number | null;
  longitude: number | null;
  is_sharing: boolean;
  last_updated: string;
};

export const reportReasons = ['harassment', 'spam', 'fake_profile', 'inappropriate_content', 'other'] as const;
export type ReportReason = (typeof reportReasons)[number];

const ratingCommentSchema = z.string().max(200, 'Comment must be 200 characters or less.').optional();
const reportDescriptionSchema = z.string().max(300, 'Description must be 300 characters or less.').optional();

export function useVerification() {
  return useQuery({
    queryKey: ['verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verifications')
        .select('id, user_id, method, verified_at, status')
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as VerificationRecord | null;
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in to verify.');
      if (!authData.user.email_confirmed_at) {
        throw new Error('Your email is not yet confirmed. Check your inbox.');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', authData.user.id);
      if (updateError) throw updateError;

      const { error: insertError } = await supabase.from('verifications').upsert(
        { user_id: authData.user.id, method: 'email', status: 'verified', verified_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
      if (insertError) throw insertError;

      return true;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['verification'] }),
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
        queryClient.invalidateQueries({ queryKey: ['buddy-profile'] }),
      ]);
    },
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user?.email) throw new Error('No email found.');

      const { error } = await supabase.auth.resend({ type: 'signup', email: authData.user.email });
      if (error) throw error;
      return true;
    },
  });
}

export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      ratedUserId,
      score,
      comment,
    }: {
      eventId: string;
      ratedUserId: string;
      score: number;
      comment?: string;
    }) => {
      if (score < 1 || score > 5) throw new Error('Rating must be between 1 and 5.');

      const sanitizedComment = comment ? ratingCommentSchema.parse(comment.trim() || undefined) : undefined;

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in to rate.');

      const { error } = await supabase.from('ratings').insert({
        event_id: eventId,
        rater_id: authData.user.id,
        rated_user_id: ratedUserId,
        score,
        comment: sanitizedComment ?? null,
      });
      if (error) throw error;

      const { error: rpcError } = await supabase.functions.invoke('calculate-trust-score', {
        body: { user_id: ratedUserId },
      });
      if (rpcError) console.warn('Trust score update failed:', rpcError.message);

      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['buddy-profile'] });
    },
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportedUserId,
      reason,
      description,
      eventId,
    }: {
      reportedUserId: string;
      reason: ReportReason;
      description?: string;
      eventId?: string;
    }) => {
      const sanitizedDescription = description ? reportDescriptionSchema.parse(description.trim() || undefined) : undefined;

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in to report.');

      const { error: reportError } = await supabase.from('reports').insert({
        reporter_id: authData.user.id,
        reported_user_id: reportedUserId,
        reason,
        description: sanitizedDescription ?? null,
        event_id: eventId ?? null,
      });
      if (reportError) throw reportError;

      const { error: blockError } = await supabase.from('blocked_users').upsert(
        { blocker_id: authData.user.id, blocked_id: reportedUserId },
        { onConflict: 'blocker_id,blocked_id' },
      );
      if (blockError) console.warn('Auto-block failed:', blockError.message);

      return true;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buddy-connections'] }),
        queryClient.invalidateQueries({ queryKey: ['buddy-matches'] }),
      ]);
    },
  });
}

export function useLiveLocation(groupId?: string) {
  return useQuery({
    queryKey: ['live-location', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_location')
        .select('id, user_id, group_id, latitude, longitude, is_sharing, last_updated, user:users!live_location_user_id_fkey(id, full_name, avatar_url)')
        .eq('group_id', groupId);

      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...row,
        user: normalizeJoinedUser(row.user),
      })) as (LiveLocationRecord & { user: { id: string; full_name: string | null; avatar_url: string | null } | null })[];
    },
    enabled: Boolean(groupId),
  });
}

export function useUpdateLiveLocation() {
  return useMutation({
    mutationFn: async ({ groupId, latitude, longitude, isSharing }: { groupId: string; latitude: number; longitude: number; isSharing: boolean }) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in.');

      const { error } = await supabase.from('live_location').upsert(
        {
          user_id: authData.user.id,
          group_id: groupId,
          latitude,
          longitude,
          is_sharing: isSharing,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
      return true;
    },
  });
}

function normalizeJoinedUser(user: unknown) {
  if (!user) return null;
  if (Array.isArray(user)) return (user[0] ?? null);
  return user;
}
