import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type EventCategoryFilter = 'all' | 'music' | 'trek' | 'hackathon' | 'meetup' | 'art' | 'food' | 'comedy' | 'sports' | 'gaming';
export type EventTypeFilter = 'all' | 'official' | 'community';
export type BudgetFilter = 'any' | 'free' | 'under500' | 'under1000';
export type GroupSizeFilter = 'any' | '2-3' | '4-6' | '7plus';
export type DateRangeFilter = 'any' | 'today' | 'week' | 'month';

export type EventFilters = {
  category?: EventCategoryFilter;
  budget?: BudgetFilter;
  groupSize?: GroupSizeFilter;
  dateRange?: DateRangeFilter;
  eventType?: EventTypeFilter;
};

export type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  date: string;
  venue_name: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number;
  max_attendees: number | null;
  cover_image_url: string | null;
  organizer_id: string | null;
  status: 'live' | 'pending' | 'past' | 'cancelled';
  event_type: 'official' | 'community';
  current_group_size: number;
  gender_preference: 'any' | 'women_only' | 'men_only' | 'mixed';
  men_slots: number | null;
  women_slots: number | null;
  created_at: string;
};

export type MyEventsFilter = 'upcoming' | 'past' | 'pending';

export type CreateEventInput = Omit<EventRecord, 'id' | 'organizer_id' | 'created_at' | 'status'> & {
  status?: EventRecord['status'];
};

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const today = startOfToday();
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'live')
        .gte('date', today.toISOString())
        .order('date', { ascending: true });

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.eventType && filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.budget === 'free') {
        query = query.eq('price', 0);
      }

      if (filters.budget === 'under500') {
        query = query.lte('price', 500);
      }

      if (filters.budget === 'under1000') {
        query = query.lte('price', 1000);
      }

      const dateLimit = getDateLimit(filters.dateRange);

      if (dateLimit) {
        query = query.lt('date', dateLimit.toISOString());
      }

      if (filters.groupSize === '2-3') {
        query = query.gte('max_attendees', 2).lte('max_attendees', 3);
      }

      if (filters.groupSize === '4-6') {
        query = query.gte('max_attendees', 4).lte('max_attendees', 6);
      }

      if (filters.groupSize === '7plus') {
        query = query.gte('max_attendees', 7);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []) as EventRecord[];
    },
  });
}

export function useEventById(eventId?: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      return data as EventRecord;
    },
    enabled: Boolean(eventId),
  });
}

export const useEventDetail = useEventById;

export function useEventOrganizer(organizerId?: string | null) {
  return useQuery({
    queryKey: ['event-organizer', organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', organizerId)
        .single();

      if (error) throw error;

      return data as { id: string; full_name: string | null; avatar_url: string | null };
    },
    enabled: Boolean(organizerId),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEventInput) => {
      const { data, error } = await supabase.functions.invoke('create-event', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.event as EventRecord;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['my-created-events'] }),
      ]);
    },
  });
}

export function useIsSaved(eventId?: string) {
  return useQuery({
    queryKey: ['is-saved', eventId],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user || !eventId) return false;

      const { data, error } = await supabase
        .from('saved_events')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (error) throw error;

      return Boolean(data);
    },
    enabled: Boolean(eventId),
  });
}

export function useToggleSave(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user || !eventId) throw new Error('Please sign in to save events.');

      const { data: existing, error: existingError } = await supabase
        .from('saved_events')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase
          .from('saved_events')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', authData.user.id);

        if (error) throw error;
        return false;
      }

      const { error } = await supabase.from('saved_events').insert({ event_id: eventId, user_id: authData.user.id });

      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['is-saved', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['saved-events'] }),
      ]);
    },
  });
}

export function useIsAttending(eventId?: string) {
  return useQuery({
    queryKey: ['is-attending', eventId],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user || !eventId) return false;

      const { data, error } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (error) throw error;

      return Boolean(data);
    },
    enabled: Boolean(eventId),
  });
}

export function useToggleAttend(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user || !eventId) throw new Error('Please sign in to attend events.');

      const { data: existing, error: existingError } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', authData.user.id);

        if (error) throw error;
        return false;
      }

      const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: authData.user.id });

      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['is-attending', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['event-attendee-count', eventId] }),
      ]);
    },
  });
}

export function useEventAttendeeCount(eventId: string) {
  return useQuery({
    queryKey: ['event-attendee-count', eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (error) throw error;

      return count ?? 0;
    },
    enabled: Boolean(eventId),
  });
}

export function useMyCreatedEvents(filter: MyEventsFilter) {
  return useQuery({
    queryKey: ['my-created-events', filter],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) return [];

      const today = startOfToday();
      let query = supabase
        .from('events')
        .select('*')
        .eq('organizer_id', authData.user.id)
        .order('date', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.gte('date', today.toISOString()).eq('status', 'live');
      }

      if (filter === 'past') {
        query = query.lt('date', today.toISOString()).eq('status', 'live');
      }

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []) as EventRecord[];
    },
  });
}

export function useSavedEvents() {
  return useQuery({
    queryKey: ['saved-events'],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) return [];

      const { data, error } = await supabase
        .from('saved_events')
        .select('id, saved_at, event:events(*)')
        .eq('user_id', authData.user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      return (data ?? [])
        .map((row) => normalizeJoinedEvent(row.event))
        .filter((event): event is EventRecord => Boolean(event));
    },
  });
}

export function useNearbyEvents() {
  return useQuery({
    queryKey: ['nearby-events'],
    queryFn: async () => {
      const today = startOfToday();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'live')
        .gte('date', today.toISOString())
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data ?? []) as EventRecord[];
    },
  });
}

function normalizeJoinedEvent(event: unknown) {
  if (!event) return null;
  if (Array.isArray(event)) return (event[0] ?? null) as EventRecord | null;

  return event as EventRecord;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date;
}

function getDateLimit(dateRange?: DateRangeFilter) {
  const today = startOfToday();

  if (dateRange === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  if (dateRange === 'week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  if (dateRange === 'month') {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  return null;
}
