'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { logAdminAction } from '../../lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Club {
  id: string;
  name: string;
  college: string | null;
  created_at: string;
  created_by: string | null;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });
    setClubs(data ?? []);
    setLoading(false);
  }

  const filtered = clubs.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.college?.toLowerCase().includes(search.toLowerCase())
  );

  async function deleteClub(club: Club) {
    if (!confirm(`Delete "${club.name}"?`)) return;
    await supabase.from('clubs').delete().eq('id', club.id);
    await logAdminAction('system', 'delete_club', club.id, club.name);
    fetchClubs();
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#222222', marginBottom: '24px' }}>Clubs</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clubs..."
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
              <th style={thStyle}>Name</th>
              <th style={thStyle}>College</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((club) => (
              <tr key={club.id} style={{ borderBottom: '1px solid #ebebeb' }}>
                <td style={tdStyle}>{club.name}</td>
                <td style={tdStyle}>{club.college ?? '—'}</td>
                <td style={tdStyle}>{new Date(club.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => deleteClub(club)}
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
