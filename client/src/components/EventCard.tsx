import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { EventConfig } from '../types/ticket';

interface EventCardProps {
  event: EventConfig;
  onBuyTicket: (eventId: string) => void;
  loading?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onBuyTicket,
  loading = false,
}) => {
  const soldPercentage = (event.activeTickets / event.totalTickets) * 100;
  const isEventPassed = Date.now() > event.eventTime;
  const isSoldOut = event.activeTickets >= event.totalTickets;

  return (
    <div className="card" style={{ position: 'relative' }}>
      {isSoldOut && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '24px',
            fontWeight: '700',
            fontSize: '12px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          }}
        >
          Hết vé
        </div>
      )}

      <h2 style={{ marginTop: 0, color: '#e2e8f0', fontSize: '24px', fontWeight: '700' }}>{event.name}</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>{event.description}</p>

      <div className="event-info">
        <div className="info-item">
          <div className="info-label">Thời gian</div>
          <div className="info-value" style={{ fontSize: '14px' }}>
            {format(event.eventTime, 'dd/MM/yyyy HH:mm', { locale: vi })}
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
            {(event.originalPrice / 1e9).toFixed(2)} SUI
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">Số vé</div>
          <div className="info-value">
            {event.activeTickets} / {event.totalTickets}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${soldPercentage}%`,
              height: '100%',
              background: soldPercentage < 50 
                ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' 
                : soldPercentage < 80 
                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' 
                : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>
          {soldPercentage.toFixed(0)}% đã bán
        </p>
      </div>

      <button
        className="button"
        onClick={() => onBuyTicket(event.id)}
        disabled={loading || isEventPassed || isSoldOut}
        style={{ width: '100%', marginTop: '20px' }}
      >
        {loading ? 'Đang xử lý...' : isSoldOut ? 'Hết vé' : isEventPassed ? 'Đã kết thúc' : 'Mua vé ngay'}
      </button>
    </div>
  );
};
