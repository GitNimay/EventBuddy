'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
  totalUsers: number;
  totalEvents: number;
  openReports: number;
  newSignupsToday: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalEvents: 0, openReports: 0, newSignupsToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [usersRes, eventsRes, reportsRes, signupsRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      ]);

      setStats({
        totalUsers: usersRes.count ?? 0,
        totalEvents: eventsRes.count ?? 0,
        openReports: reportsRes.count ?? 0,
        newSignupsToday: signupsRes.count ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#6a6a6a' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#222222', marginBottom: '24px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard label="Total Events" value={stats.totalEvents} icon="📅" />
        <StatCard label="Open Reports" value={stats.openReports} icon="🚩" />
        <StatCard label="New Signups Today" value={stats.newSignupsToday} icon="✨" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{
      padding: '24px',
      borderRadius: '14px',
      border: '1px solid #ebebeb',
      backgroundColor: '#f7f7f7',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#222222' }}>{value}</div>
      <div style={{ fontSize: '14px', color: '#6a6a6a', marginTop: '4px' }}>{label}</div>
    </div>
  );
}
