import React, { useState, useEffect } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TICKET_STATE, TICKET_STATE_LABELS } from '../config/constants';
import type { Ticket, EventConfig } from '../types/ticket';
import QRCode from 'qrcode';

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(`TICKET:${ticket.id}`, {
      width: 200,
      margin: 2,
      color: {
        dark: '#667eea',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, [ticket.id]);

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
              <div style={{ fontSize: '48px', fontWeight: 'bold' }}>🎫</div>
              <div style={{ fontSize: '18px', marginTop: '10px' }}>Vé #{ticket.ticketNumber}</div>
            </div>
          )}
          {ticket.state === TICKET_STATE.CHECKED_IN && (
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold' }}>✓</div>
              <div style={{ fontSize: '18px', marginTop: '10px' }}>Đã Sử Dụng</div>
            </div>
          )}
          {ticket.state === TICKET_STATE.COMMEMORATIVE && (
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold' }}>🏆</div>
              <div style={{ fontSize: '18px', marginTop: '10px' }}>Huy Hiệu Kỷ Niệm</div>
            </div>
          )}
        </div>
      </div>

      <div className="ticket-content">
        <span className={`ticket-badge ${getStateClass()}`}>
          {TICKET_STATE_LABELS[ticket.state]}
        </span>

        <h3 style={{ margin: '12px 0' }}>{event?.name || 'Loading...'}</h3>

        <div className="info-item" style={{ marginBottom: '12px' }}>
          <div className="info-label">Ticket ID</div>
          <div 
            className="info-value" 
            style={{ 
              fontFamily: 'monospace', 
              fontSize: '11px',
              wordBreak: 'break-all',
              background: '#f7fafc',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
            }}
          >
            {ticket.id}
          </div>
        </div>

        <div className="info-item" style={{ marginBottom: '12px' }}>
          <div className="info-label">Số vé</div>
          <div className="info-value">#{ticket.ticketNumber}</div>
        </div>

        <div className="info-item" style={{ marginBottom: '12px' }}>
          <div className="info-label">Giá gốc</div>
          <div className="info-value">{(ticket.originalPrice / 1e9).toFixed(2)} SUI</div>
        </div>

        {event && ticket.state === TICKET_STATE.PENDING && (
          <>
            <div className="info-item" style={{ marginBottom: '12px' }}>
              <div className="info-label">Thời gian sự kiện</div>
              <div className="info-value" style={{ fontSize: '14px' }}>
                {format(event.eventTime, 'dd/MM/yyyy HH:mm', { locale: vi })}
              </div>
            </div>

            <div className="countdown">{countdown}</div>

            {qrCodeUrl && (
              <div className="qr-code-container">
                <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '150px' }} />
              </div>
            )}

            {/* Cả organizer và ticket owner đều có thể check-in */}
            {onCheckIn && (
              <button 
                className="button button-secondary" 
                onClick={onCheckIn} 
                style={{ width: '100%', marginBottom: '8px' }}
              >
                ✓ {isOrganizer ? 'Check-in vé này' : 'Tự check-in'}
              </button>
            )}

            {/* Button hoàn tiền */}
            {!isOrganizer && onRefund && (
              <button 
                className="button" 
                onClick={onRefund} 
                style={{ 
                  width: '100%', 
                  marginBottom: '8px',
                  background: '#f56565',
                  color: 'white',
                }}
              >
                💸 Hoàn tiền vé
              </button>
            )}

            {!isOrganizer && canSellBack && onSellBack && (
              <button 
                className="button" 
                onClick={onSellBack} 
                style={{ 
                  width: '100%', 
                  marginTop: '8px',
                  background: '#ed8936',
                }}
              >
                💰 Bán lại cho hệ thống
              </button>
            )}

            {canSellBack && onSellBack && (
              <div style={{ 
                fontSize: '12px', 
                color: '#718096', 
                marginTop: '8px',
                textAlign: 'center',
                padding: '8px',
                background: '#fef3c7',
                borderRadius: '4px'
              }}>
                🛡️ Vé sẽ tự động đến người đầu hàng chờ (giá gốc)
              </div>
            )}
          </>
        )}

        {ticket.state === TICKET_STATE.CHECKED_IN && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#48bb78', fontSize: '16px', fontWeight: '600' }}>
              ✓ Vé đã được sử dụng thành công!
            </p>
            {canTransform && onTransform && (
              <button
                className="button"
                onClick={onTransform}
                style={{ width: '100%', marginTop: '12px' }}
              >
                🏆 Chuyển thành huy hiệu kỷ niệm
              </button>
            )}
          </div>
        )}

        {ticket.state === TICKET_STATE.COMMEMORATIVE && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#ed8936', fontSize: '16px', fontWeight: '600' }}>
              🏆 Huy hiệu kỷ niệm độc đáo!
            </p>
            <p style={{ color: '#718096', fontSize: '14px', marginTop: '8px' }}>
              Cảm ơn bạn đã tham dự sự kiện
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
