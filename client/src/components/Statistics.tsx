import React from 'react';
import type { EventConfig, Ticket } from '../types/ticket';
import { TICKET_STATE } from '../config/constants';

interface StatisticsProps {
  events: EventConfig[];
  tickets: Ticket[];
}

export const Statistics: React.FC<StatisticsProps> = ({ events, tickets }) => {
  // Calculate statistics
  const totalEvents = events.length;
  const activeEvents = events.filter(e => Date.now() < e.eventTime).length;
  const totalTicketsSold = events.reduce((sum, e) => sum + e.soldTickets, 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.soldTickets * e.originalPrice), 0) / 1e9;
  
  const pendingTickets = tickets.filter(t => t.state === TICKET_STATE.PENDING).length;
  const checkedInTickets = tickets.filter(t => t.state === TICKET_STATE.CHECKED_IN).length;
  const commemorativeTickets = tickets.filter(t => t.state === TICKET_STATE.COMMEMORATIVE).length;

  const stats = [
    {
      label: 'Tổng sự kiện',
      value: totalEvents,
      sublabel: `${activeEvents} đang hoạt động`,
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    },
    {
      label: 'Vé đã bán',
      value: totalTicketsSold,
      sublabel: 'Tất cả sự kiện',
      gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    },
    {
      label: 'Tổng doanh thu',
      value: `${totalRevenue.toFixed(2)} SUI`,
      sublabel: 'Toàn hệ thống',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    {
      label: 'Vé chờ sự kiện',
      value: pendingTickets,
      sublabel: `${checkedInTickets} đã check-in`,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>
        Thống kê hệ thống
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            className="card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '24px',
            }}
          >
            {/* Gradient overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: stat.gradient,
                opacity: 0.1,
                borderRadius: '50%',
                transform: 'translate(30%, -30%)',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '4px',
                  lineHeight: '1.2',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                {stat.sublabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket state breakdown */}
      {tickets.length > 0 && (
        <div className="card" style={{ marginTop: '20px', padding: '24px' }}>
          <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>
            Phân bổ trạng thái vé
          </h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>{pendingTickets}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Chờ sự kiện</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>{checkedInTickets}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Đã check-in</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>{commemorativeTickets}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Kỷ niệm</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(pendingTickets / tickets.length) * 100}%`, background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', transition: 'width 0.3s ease' }} />
            <div style={{ width: `${(checkedInTickets / tickets.length) * 100}%`, background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)', transition: 'width 0.3s ease' }} />
            <div style={{ width: `${(commemorativeTickets / tickets.length) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
            <span>{((pendingTickets / tickets.length) * 100).toFixed(1)}%</span>
            <span>{((checkedInTickets / tickets.length) * 100).toFixed(1)}%</span>
            <span>{((commemorativeTickets / tickets.length) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
