import React, { useState, useEffect } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TICKET_STATE, TICKET_STATE_LABELS } from '../config/constants';
import type { Ticket, EventConfig } from '../types/ticket';

interface TicketCardProps {
  ticket: Ticket;
  event: EventConfig | null;
  onCheckIn?: () => void;
  onTransform?: () => void;
  onSellBack?: () => void;
  onRefund?: () => void;
  isOrganizer?: boolean;
  canSellBack?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  event,
  onCheckIn,
  onTransform,
  onSellBack,
  onRefund,
  isOrganizer,
  canSellBack = false,
}) => {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (ticket.state === TICKET_STATE.PENDING && event) {
      const interval = setInterval(() => {
        const now = Date.now();
        const eventTime = event.eventTime;
        const diff = differenceInSeconds(eventTime, now);

        if (diff <= 0) {
          setCountdown('Sự kiện đang diễn ra!');
        } else {
          const days = Math.floor(diff / 86400);
          const hours = Math.floor((diff % 86400) / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const seconds = diff % 60;
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [ticket.state, event]);

  const getStateClass = () => {
    switch (ticket.state) {
      case TICKET_STATE.PENDING:
        return 'badge-pending';
      case TICKET_STATE.CHECKED_IN:
        return 'badge-checked-in';
      case TICKET_STATE.COMMEMORATIVE:
        return 'badge-commemorative';
      default:
        return '';
    }
  };

  const getImageGradient = () => {
    switch (ticket.state) {
      case TICKET_STATE.PENDING:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case TICKET_STATE.CHECKED_IN:
        return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case TICKET_STATE.COMMEMORATIVE:
        return 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const canTransform = event && Date.now() > event.eventTime + 86400000; // +1 day

  return (
    <div className="ticket-card">
      <div
        className="ticket-image"
        style={{ background: getImageGradient() }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {ticket.state === TICKET_STATE.PENDING && (
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '56px', fontWeight: '800', opacity: 0.9 }}>#</div>
              <div style={{ fontSize: '20px', marginTop: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>Vé #{ticket.ticketNumber}</div>
            </div>
          )}
          {ticket.state === TICKET_STATE.CHECKED_IN && (
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '56px', fontWeight: '800', opacity: 0.9 }}>✓</div>
              <div style={{ fontSize: '20px', marginTop: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>Đã Sử Dụng</div>
            </div>
          )}
          {ticket.state === TICKET_STATE.COMMEMORATIVE && (
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '56px', fontWeight: '800', opacity: 0.9 }}>★</div>
              <div style={{ fontSize: '20px', marginTop: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>Huy Hiệu Kỷ Niệm</div>
            </div>
          )}
        </div>
      </div>

      <div className="ticket-content">
        <span className={`ticket-badge ${getStateClass()}`}>
          {TICKET_STATE_LABELS[ticket.state]}
        </span>

        <h3 style={{ margin: '12px 0', color: '#e2e8f0', fontSize: '18px', fontWeight: '700' }}>{event?.name || 'Loading...'}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Số vé</div>
            <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '700' }}>#{ticket.ticketNumber}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá</div>
            <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '700' }}>{(ticket.originalPrice / 1e9).toFixed(2)} SUI</div>
          </div>
        </div>

        {event && ticket.state === TICKET_STATE.PENDING && (
          <>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '8px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Thời gian</div>
              <div style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600' }}>
                {format(event.eventTime, 'dd/MM/yyyy HH:mm', { locale: vi })}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px', fontWeight: '600' }}>{countdown}</div>
            </div>

            {/* Cả organizer và ticket owner đều có thể check-in */}
            {onCheckIn && (
              <button 
                className="button button-secondary" 
                onClick={onCheckIn} 
                style={{ width: '100%', marginBottom: '8px' }}
              >
                {isOrganizer ? 'Check-in vé' : 'Check-in'}
              </button>
            )}

            {/* Button hoàn tiền */}
            {!isOrganizer && onRefund && (
              <button 
                className="button" 
                onClick={onRefund} 
                style={{ 
                  width: '100%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                }}
              >
                Hoàn tiền
              </button>
            )}

            {!isOrganizer && canSellBack && onSellBack && (
              <button 
                className="button" 
                onClick={onSellBack} 
                style={{ 
                  width: '100%', 
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }}
              >
                Bán lại cho hệ thống
              </button>
            )}

            {canSellBack && onSellBack && (
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginTop: '8px',
                textAlign: 'center',
                padding: '8px',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}>
                Vé sẽ tự động đến người đầu hàng chờ (giá gốc)
              </div>
            )}
          </>
        )}

        {ticket.state === TICKET_STATE.CHECKED_IN && (
          <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <p style={{ color: '#34d399', fontSize: '14px', fontWeight: '600', margin: 0, marginBottom: canTransform && onTransform ? '12px' : 0 }}>
              Vé đã sử dụng
            </p>
            {canTransform && onTransform && (
              <button
                className="button"
                onClick={onTransform}
                style={{ 
                  width: '100%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }}
              >
                Chuyển thành POAP
              </button>
            )}
          </div>
        )}

        {ticket.state === TICKET_STATE.COMMEMORATIVE && (
          <div style={{ padding: '16px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)', textAlign: 'center' }}>
            <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: 0 }}>
              Huy hiệu kỷ niệm POAP
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
