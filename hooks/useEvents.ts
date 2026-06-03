import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type EventCategoryFilter = 'all' | 'music' | 'trek' | 'hackathon' | 'art' | 'food' | 'comedy' | 'sports' | 'tech' | 'gaming';
export type BudgetFilter = 'any' | 'free' | 'under500' | 'under1000';
export type GroupSizeFilter = 'any' | '2-3' | '4-6' | '7plus';
export type DateRangeFilter = 'any' | 'today' | 'week' | 'month';

export type EventFilters = {
  category?: EventCategoryFilter;
  budget?: BudgetFilter;
  groupSize?: GroupSizeFilter;
  dateRange?: DateRangeFilter;
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
  status: 'live' | 'pending';
  event_type: 'official' | 'community';
  created_at: string;
};

export type MyEventsFilter = 'upcoming' | 'past' | 'pending';

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
