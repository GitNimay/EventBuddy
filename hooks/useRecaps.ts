import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EventRecap {
  id: string;
  event_id: string;
  user_id: string;
  photo_urls: string[];
  caption: string | null;
  created_at: string;
  user?: { id: string; full_name: string; avatar_url: string | null } | null;
  event?: { id: string; title: string; date: string } | null;
}

export function useEventRecaps(eventId?: string) {
  return useQuery({
    queryKey: ['recaps', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_recaps')
        .select('*, user:users(id, full_name, avatar_url), event:events(id, title, date)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EventRecap[];
    },
    enabled: !!eventId,
  });
}

export function useCreateRecap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recap: { event_id: string; user_id: string; photo_urls: string[]; caption?: string }) => {
      const { data, error } = await supabase
        .from('event_recaps')
        .insert(recap)
        .select()
        .single();
      if (error) throw error;
      return data as EventRecap;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['recaps', vars.event_id] });
    },
  });
}
