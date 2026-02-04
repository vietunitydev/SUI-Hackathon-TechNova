import React from 'react';
import type { EventConfig, Ticket } from '../types/ticket';

interface UserInfoPageProps {
  userAddress?: string;
  events: EventConfig[];
  tickets: Ticket[];
}

export const UserInfoPage: React.FC<UserInfoPageProps> = ({ userAddress, events, tickets }) => {
  if (!userAddress) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Chưa kết nối ví</h3>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
          Vui lòng kết nối ví để xem thông tin cá nhân
        </p>
      </div>
    );
  }

  const myEvents = events.filter(e => e.organizer === userAddress);
  const myTickets = tickets.filter(t => t.owner === userAddress);
  
  const totalRevenue = myEvents.reduce((sum, event) => {
    return sum + (event.soldTickets * event.originalPrice);
  }, 0) / 1_000_000_000;

  const totalSpent = myTickets.reduce((sum, ticket) => {
    const event = events.find(e => e.id === ticket.eventId);
    return sum + (event ? event.originalPrice : 0);
  }, 0) / 1_000_000_000;

  return (
    <div>
      <h2 style={{ color: '#e2e8f0', marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
        Thông tin cá nhân
      </h2>

      {/* Wallet Info */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
          Địa chỉ ví
        </h3>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#94a3b8',
          }}
        >
          {userAddress}
        </div>
      </div>

      {/* Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* Events Created */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #60a5fa15 0%, #60a5fa05 100%)',
            border: '1px solid #60a5fa40',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sự kiện đã tạo
          </div>
          <div style={{ color: '#60a5fa', fontSize: '36px', fontWeight: '800' }}>
            {myEvents.length}
          </div>
        </div>

        {/* Total Revenue */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #34d39915 0%, #34d39905 100%)',
            border: '1px solid #34d39940',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Doanh thu
          </div>
          <div style={{ color: '#34d399', fontSize: '36px', fontWeight: '800' }}>
            {totalRevenue.toFixed(2)}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
            SUI
          </div>
        </div>

        {/* Tickets Owned */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #a78bfa15 0%, #a78bfa05 100%)',
            border: '1px solid #a78bfa40',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Vé đã mua
          </div>
          <div style={{ color: '#a78bfa', fontSize: '36px', fontWeight: '800' }}>
            {myTickets.length}
          </div>
        </div>

        {/* Total Spent */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #f472b615 0%, #f472b605 100%)',
            border: '1px solid #f472b640',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Đã chi tiêu
          </div>
          <div style={{ color: '#f472b6', fontSize: '36px', fontWeight: '800' }}>
            {totalSpent.toFixed(2)}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
            SUI
          </div>
        </div>
      </div>

      {/* Ticket Breakdown */}
      {/*<h3 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>*/}
      {/*  Trạng thái vé của bạn*/}
      {/*</h3>*/}
      {/*<div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>*/}
      {/*  <div className="card">*/}
      {/*    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>*/}
      {/*      <div>*/}
      {/*        <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>*/}
      {/*          Chưa check-in*/}
      {/*        </div>*/}
      {/*        <div style={{ color: '#94a3b8', fontSize: '14px' }}>*/}
      {/*          Vé đang chờ sử dụng*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <div style={{ color: '#60a5fa', fontSize: '28px', fontWeight: '800' }}>*/}
      {/*        {pendingTickets}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="card">*/}
      {/*    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>*/}
      {/*      <div>*/}
      {/*        <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>*/}
      {/*          Đã check-in*/}
      {/*        </div>*/}
      {/*        <div style={{ color: '#94a3b8', fontSize: '14px' }}>*/}
      {/*          Vé đã được sử dụng*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <div style={{ color: '#34d399', fontSize: '28px', fontWeight: '800' }}>*/}
      {/*        {checkedInTickets}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="card">*/}
      {/*    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>*/}
      {/*      <div>*/}
      {/*        <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>*/}
      {/*          Vé kỷ niệm*/}
      {/*        </div>*/}
      {/*        <div style={{ color: '#94a3b8', fontSize: '14px' }}>*/}
      {/*          POAP sau sự kiện*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <div style={{ color: '#f472b6', fontSize: '28px', fontWeight: '800' }}>*/}
      {/*        {commemorativeTickets}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}

      {/* Events Overview */}
      {myEvents.length > 0 && (
        <>
          <h3 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
            Sự kiện của bạn
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {myEvents.map((event) => {
              const soldPercentage = (event.soldTickets / event.totalTickets) * 100;
              const revenue = (event.soldTickets * event.originalPrice) / 1_000_000_000;
              
              return (
                <div key={event.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#e2e8f0', margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: '700' }}>
                        {event.name}
                      </h4>
                      <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {new Date(event.eventTime).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#34d399', fontSize: '18px', fontWeight: '700' }}>
                        {revenue.toFixed(2)} SUI
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                        Doanh thu
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {event.soldTickets} / {event.totalTickets} vé
                      </span>
                      <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600' }}>
                        {soldPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${soldPercentage}%`,
                          background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
