import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TicketSplit {
  id: string;
  event_id: string;
  group_id: string;
  total_amount: number | null;
  split_count: number | null;
  per_person_amount: number | null;
  upi_link: string | null;
  created_by: string;
  created_at: string;
}

export function useTicketSplit(eventId?: string, groupId?: string) {
  return useQuery({
    queryKey: ['ticket-split', eventId, groupId],
    queryFn: async () => {
      if (!eventId || !groupId) return null;
      const { data, error } = await supabase
        .from('ticket_splits')
        .select('*')
        .eq('event_id', eventId)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TicketSplit | null;
    },
    enabled: !!eventId && !!groupId,
  });
}

export function useCreateTicketSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (split: {
      event_id: string;
      group_id: string;
      total_amount: number;
      split_count: number;
      per_person_amount: number;
      upi_link: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('ticket_splits')
        .insert(split)
        .select()
        .single();
      if (error) throw error;
      return data as TicketSplit;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-split', vars.event_id, vars.group_id] });
    },
  });
}
