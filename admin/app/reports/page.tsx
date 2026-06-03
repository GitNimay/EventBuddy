'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { logAdminAction } from '../../lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  }

  async function resolveReport(report: Report) {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
    await logAdminAction('system', 'resolve_report', report.id, report.reason);
    fetchReports();
  }

  async function dismissReport(report: Report) {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', report.id);
    await logAdminAction('system', 'resolve_report', report.id, `Dismissed: ${report.reason}`);
    fetchReports();
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#222222', marginBottom: '24px' }}>Reports</h1>
      {loading ? (
        <p style={{ color: '#6a6a6a' }}>Loading...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: '#6a6a6a' }}>No reports found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ebebeb' }}>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} style={{ borderBottom: '1px solid #ebebeb' }}>
                <td style={tdStyle}>{report.reason}</td>
                <td style={tdStyle}>{report.description ?? '—'}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: report.status === 'pending' ? '#ffd1da' : '#f7f7f7',
                    color: report.status === 'pending' ? '#c13515' : '#6a6a6a',
                  }}>
                    {report.status}
                  </span>
                </td>
                <td style={tdStyle}>{new Date(report.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  {report.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => resolveReport(report)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #ff385c',
                          backgroundColor: '#ff385c',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => dismissReport(report)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #dddddd',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
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
