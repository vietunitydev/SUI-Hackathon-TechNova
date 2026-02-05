import React, { useState } from 'react';
import type { EventConfig, Ticket } from '../types/ticket';
import { TicketState } from '../types/ticket';

interface EventStatisticsPageProps {
  event: EventConfig | null;
  tickets: Ticket[];
  onBack: () => void;
  onWithdraw?: (eventId: string, treasuryId: string) => void;
  currentAddress?: string;
  loading?: boolean;
}

export const EventStatisticsPage: React.FC<EventStatisticsPageProps> = ({ 
  event, 
  tickets, 
  onBack, 
  onWithdraw,
  currentAddress,
  loading = false 
}) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  if (!event) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Không tìm thấy sự kiện</h3>
        <button className="btn btn-primary" onClick={onBack}>
          Quay lại
        </button>
      </div>
    );
  }

  const eventTickets = tickets.filter(t => t.eventId === event.id);
  const pendingTickets = eventTickets.filter(t => t.state === TicketState.PENDING);
  const checkedInTickets = eventTickets.filter(t => t.state === TicketState.CHECKED_IN);
  const commemorativeTickets = eventTickets.filter(t => t.state === TicketState.COMMEMORATIVE);
  
  const soldPercentage = (event.activeTickets / event.totalTickets) * 100;
  const revenue = (event.activeTickets * event.originalPrice) / 1_000_000_000;

  const stats = [
    {
      label: 'Tổng vé',
      value: event.totalTickets,
      color: '#60a5fa',
    },
    {
      label: 'Vé đang hoạt động',
      value: event.activeTickets,
      color: '#34d399',
    },
    {
      label: 'Đã mint (all-time)',
      value: event.mintedTickets,
      color: '#8b5cf6',
    },
    {
      label: 'Còn lại',
      value: event.totalTickets - event.activeTickets,
      color: '#fbbf24',
    },
    {
      label: 'Đã refund',
      value: event.mintedTickets - event.activeTickets,
      color: '#ef4444',
    },
    {
      label: 'Doanh thu',
      value: `${revenue.toFixed(2)} SUI`,
      color: '#a78bfa',
    },
  ];

  const ticketStates = [
    {
      label: 'Chưa check-in',
      count: pendingTickets.length,
      percentage: eventTickets.length > 0 ? (pendingTickets.length / eventTickets.length) * 100 : 0,
      color: '#60a5fa',
    },
    {
      label: 'Đã check-in',
      count: checkedInTickets.length,
      percentage: eventTickets.length > 0 ? (checkedInTickets.length / eventTickets.length) * 100 : 0,
      color: '#34d399',
    },
    {
      label: 'Kỷ niệm',
      count: commemorativeTickets.length,
      percentage: eventTickets.length > 0 ? (commemorativeTickets.length / eventTickets.length) * 100 : 0,
      color: '#f472b6',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#94a3b8', margin: 0, fontSize: '18px', fontWeight: '500' }}>
          {event.name}
        </h3>
      </div>

      {/* Event Info Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>Thông tin sự kiện</h4>
        <div className="event-info">
          <div className="info-item">
            <div className="info-label">Thời gian</div>
            <div className="info-value" style={{ fontSize: '14px' }}>
              {new Date(event.eventTime).toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Địa điểm</div>
            <div className="info-value" style={{ fontSize: '14px' }}>
              {event.venue}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Giá vé</div>
            <div className="info-value">
              {(event.originalPrice / 1_000_000_000).toFixed(2)} SUI
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Người tổ chức</div>
            <div className="info-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {event.organizer}
            </div>
          </div>
        </div>
      </div>

      {/* Object IDs Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h4 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>Object IDs (on-chain)</h4>
        <div className="event-info">
          <div className="info-item">
            <div className="info-label">Event Config ID</div>
            <div className="info-value" style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {event.id}
            </div>
          </div>
          {event.treasuryId && (
            <div className="info-item">
              <div className="info-label">💰 Treasury ID</div>
              <div className="info-value" style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {event.treasuryId}
              </div>
            </div>
          )}
          {event.waitlistId && (
            <div className="info-item">
              <div className="info-label">📋 Waitlist ID</div>
              <div className="info-value" style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {event.waitlistId}
              </div>
            </div>
          )}
          {event.depositEscrowId && (
            <div className="info-item">
              <div className="info-label">🔒 Deposit Escrow ID</div>
              <div className="info-value" style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {event.depositEscrowId}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales Statistics */}
      <h3 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
        Thống kê bán vé
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="card"
            style={{
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
              border: `1px solid ${stat.color}40`,
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </div>
            <div style={{ color: stat.color, fontSize: '28px', fontWeight: '800' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sales Progress */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h4 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>
          Tiến độ bán vé
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="progress-bar" style={{ height: '12px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${soldPercentage}%`,
                  background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                }}
              />
            </div>
          </div>
          <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: '700', minWidth: '60px', textAlign: 'right' }}>
            {soldPercentage.toFixed(1)}%
          </div>
        </div>
        <div style={{ marginTop: '12px', color: '#94a3b8', fontSize: '14px' }}>
          {event.activeTickets} / {event.totalTickets} vé đang hoạt động
        </div>
        <div style={{ marginTop: '4px', color: '#64748b', fontSize: '12px' }}>
          (Đã mint: {event.mintedTickets}, Đã refund: {event.mintedTickets - event.activeTickets})
        </div>
      </div>

      {/* Ticket States */}
      <h3 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
        Trạng thái vé
      </h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {ticketStates.map((state, index) => (
          <div key={index} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {state.label}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {state.count} vé ({state.percentage.toFixed(1)}%)
                </div>
              </div>
              <div style={{ color: state.color, fontSize: '24px', fontWeight: '800' }}>
                {state.count}
              </div>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${state.percentage}%`,
                  background: state.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      {event.mintedTickets === event.totalTickets && (
        <div
          className="card"
          style={{
            marginTop: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ color: '#fca5a5', fontSize: '16px', fontWeight: '700', textAlign: 'center' }}>
            Sự kiện đã hết vé
          </div>
        </div>
      )}

      {/* Organizer Withdraw Button */}
      {onWithdraw && 
       currentAddress && 
       event.organizer === currentAddress && 
       event.treasuryId && 
       new Date(event.eventTime) < new Date() && (
        <div
          className="card"
          style={{
            marginTop: '24px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#22c55e', fontWeight: '600', marginBottom: '4px', fontSize: '18px' }}>
              💰 Rút tiền về ví
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
              Sự kiện đã kết thúc. Bạn có thể rút toàn bộ doanh thu về ví.
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '500' }}>
              Doanh thu: {revenue} SUI
            </div>
          </div>
          <button
            onClick={async () => {
              if (event.treasuryId) {
                setIsWithdrawing(true);
                try {
                  await onWithdraw(event.id, event.treasuryId);
                } catch (error) {
                  console.error('Withdraw failed:', error);
                } finally {
                  setIsWithdrawing(false);
                }
              }
            }}
            disabled={isWithdrawing || loading}
            className="button-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              opacity: (isWithdrawing || loading) ? 0.5 : 1,
            }}
          >
            {isWithdrawing ? '⏳ Đang rút tiền...' : '💸 Rút tiền ngay'}
          </button>
        </div>
      )}
    </div>
  );
};
