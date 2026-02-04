import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userAddress?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, userAddress }) => {
  const menuItems = [
    { id: 'browse', label: 'Khám phá sự kiện' },
    { id: 'myTickets', label: 'Vé của tôi' },
    { id: 'myEvents', label: 'Quản lý sự kiện' },
    { id: 'userInfo', label: 'Thông tin cá nhân' },
  ];

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
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '8px',
                background: currentPage === item.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: currentPage === item.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                borderRadius: '12px',
                color: currentPage === item.id ? '#60a5fa' : '#94a3b8',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Info */}
        {/*{userAddress && (*/}
        {/*  <div*/}
        {/*    style={{*/}
        {/*      padding: '16px',*/}
        {/*      background: 'rgba(255, 255, 255, 0.05)',*/}
        {/*      border: '1px solid rgba(255, 255, 255, 0.1)',*/}
        {/*      borderRadius: '12px',*/}
        {/*      marginTop: '20px',*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    /!*<div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>*!/*/}
        {/*    /!*  Ví đã kết nối*!/*/}
        {/*    /!*</div>*!/*/}
        {/*    /!*<div*!/*/}
        {/*    /!*  style={{*!/*/}
        {/*    /!*    fontSize: '13px',*!/*/}
        {/*    /!*    color: '#94a3b8',*!/*/}
        {/*    /!*    fontFamily: 'monospace',*!/*/}
        {/*    /!*    wordBreak: 'break-all',*!/*/}
        {/*    /!*  }}*!/*/}
        {/*    /!*>*!/*/}
        {/*    /!*  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}*!/*/}
        {/*    /!*</div>*!/*/}
        {/*  </div>*/}
        {/*)}*/}
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
              {menuItems.find((item) => item.id === currentPage)?.label || 'Dashboard'}
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
