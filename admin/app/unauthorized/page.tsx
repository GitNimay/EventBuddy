export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#222222', marginBottom: '8px' }}>
          Access Denied
        </h1>
        <p style={{ fontSize: '16px', color: '#6a6a6a' }}>
          You do not have admin privileges.
        </p>
      </div>
    </div>
  );
}
