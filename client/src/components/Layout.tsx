import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Khám phá sự kiện' },
    { path: '/my-tickets', label: 'Vé của tôi' },
    { path: '/my-events', label: 'Quản lý sự kiện' },
    { path: '/user-info', label: 'Thông tin cá nhân' },
  ];
  
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Khám phá sự kiện';
    if (path === '/my-tickets') return 'Vé của tôi';
    if (path === '/my-events') return 'Quản lý sự kiện';
    if (path === '/user-info') return 'Thông tin cá nhân';
    if (path === '/create-event') return 'Tạo sự kiện mới';
    if (path.includes('/statistics')) return 'Thống kê sự kiện';
    if (path.includes('/event/')) return 'Chi tiết sự kiện';
    return '';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Dynamic Ticket
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            Hệ thống vé NFT chống phe vé
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  textAlign: 'left',
                  textDecoration: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(96, 165, 250, 0.3)'
                    : '1px solid transparent',
                  borderRadius: '12px',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '280px', flex: 1, padding: '24px 32px' }}>
        {/* Top Bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            padding: '16px 0',
          }}
        >
          <div>
            <h2 style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: '700', margin: 0 }}>
              {getCurrentPageTitle()}
            </h2>
          </div>
          <ConnectButton />
        </header>

        {/* Page Content */}
        <div>{children}</div>
      </main>
    </div>
  );
};
