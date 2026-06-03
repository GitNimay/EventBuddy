'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { logAdminAction } from '../../lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  }

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleBan(user: User) {
    const action = user.role === 'admin' ? 'unban_user' : 'ban_user';
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    await supabase.from('users').update({ role: newRole }).eq('id', user.id);
    await logAdminAction(user.id, action as any, user.id, `Changed role to ${newRole}`);
    fetchUsers();
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#222222', marginBottom: '24px' }}>Users</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
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
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Verified</th>
              <th style={thStyle}>Joined</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ebebeb' }}>
                <td style={tdStyle}>{user.full_name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: user.role === 'admin' ? '#ffd1da' : '#f7f7f7',
                    color: user.role === 'admin' ? '#c13515' : '#6a6a6a',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={tdStyle}>{user.is_verified ? '✅' : '—'}</td>
                <td style={tdStyle}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => toggleBan(user)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dddddd',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {user.role === 'admin' ? 'Demote' : 'Promote'}
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
