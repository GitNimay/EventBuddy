'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { logAdminAction } from '../../lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Event {
  id: string;
  title: string;
  date: string;
  status: string;
  city: string | null;
  organizer_id: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  }

  const filtered = events.filter((e) =>
    e.title?.toLowerCase().includes(search.toLowerCase())
  );

  async function deleteEvent(event: Event) {
    if (!confirm(`Delete "${event.title}"?`)) return;
    await supabase.from('events').delete().eq('id', event.id);
    await logAdminAction('system', 'delete_event', event.id, event.title);
    fetchEvents();
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#222222', marginBottom: '24px' }}>Events</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search events..."
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '48px',
          borderRadius: '8px',
          border: '1px solid #dddddd',
          padding: '0 16px',
          fontSize: '16px',
          marginBottom: '24px',
          outline: 'none',
        }}
      />
      {loading ? (
        <p style={{ color: '#6a6a6a' }}>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ebebeb' }}>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>City</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((event) => (
              <tr key={event.id} style={{ borderBottom: '1px solid #ebebeb' }}>
                <td style={tdStyle}>{event.title}</td>
                <td style={tdStyle}>{new Date(event.date).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: event.status === 'upcoming' ? '#f7f7f7' : '#ebebeb',
                    color: event.status === 'upcoming' ? '#222222' : '#6a6a6a',
                  }}>
                    {event.status}
                  </span>
                </td>
                <td style={tdStyle}>{event.city ?? '—'}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => deleteEvent(event)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #c13515',
                      backgroundColor: '#ffffff',
                      color: '#c13515',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 8px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#6a6a6a',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: '14px',
  color: '#222222',
};
