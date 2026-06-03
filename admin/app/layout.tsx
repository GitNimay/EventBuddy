'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/reports', label: 'Reports', icon: '🚩' },
  { href: '/clubs', label: 'Clubs', icon: '🏫' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/unauthorized') {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px',
        backgroundColor: '#f7f7f7',
        borderRight: '1px solid #ebebeb',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#222222', marginBottom: '32px', padding: '0 8px' }}>
          EventBuddy
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive ? '#222222' : '#6a6a6a',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '32px', backgroundColor: '#ffffff' }}>
        {children}
      </main>
    </div>
  );
}
