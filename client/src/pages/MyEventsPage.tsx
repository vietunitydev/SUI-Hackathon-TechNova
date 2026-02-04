import React from 'react';
import type { EventConfig } from '../types/ticket';

interface MyEventsPageProps {
  events: EventConfig[];
  userAddress?: string;
  onViewDetails: (event: EventConfig) => void;
  onViewStatistics: (event: EventConfig) => void;
  onCreateEvent: () => void;
  onCancelEvent: (eventId: string) => void;
  loading: boolean;
}

export const MyEventsPage: React.FC<MyEventsPageProps> = ({
  events,
  userAddress,
  onViewDetails,
  onViewStatistics,
  onCreateEvent,
  onCancelEvent,
  loading,
}) => {
  if (!userAddress) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Vui lòng kết nối ví</h3>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
          Bạn cần kết nối ví Sui Wallet để quản lý sự kiện của mình
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button
            onClick={onCreateEvent}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(96, 165, 250, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.3)';
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            Tạo sự kiện mới
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Chưa có sự kiện nào</h3>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            Hãy tạo sự kiện đầu tiên và bắt đầu bán vé!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
          Bạn đang quản lý <span style={{ color: '#60a5fa', fontWeight: '700' }}>{events.length}</span> sự kiện
        </div>
        <button
          onClick={onCreateEvent}
          style={{
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
            border: 'none',
            borderRadius: '14px',
            color: 'white',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(96, 165, 250, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          Tạo sự kiện mới
        </button>
      </div>

      <div className="ticket-grid">
        {events.map((event) => {
          const isUpcoming = Date.now() < event.eventTime;
          const soldPercentage = (event.soldTickets / event.totalTickets) * 100;

          return (
            <div key={event.id} className="card" style={{ position: 'relative' }}>
              <h2 style={{ marginTop: 0, color: '#e2e8f0', marginBottom: '8px', paddingRight: '110px' }}>{event.name}</h2>
              
              {/* Status Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  ...(isUpcoming
                    ? {
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#22c55e',
                      }
                    : {
                        background: 'rgba(100, 116, 139, 0.15)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        color: '#64748b',
                      }),
                }}
              >
                {isUpcoming ? 'Đang bán' : 'Đã diễn ra'}
              </div>

              <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>{event.description}</p>

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
                  <div className="info-value">{(event.originalPrice / 1_000_000_000).toFixed(2)} SUI</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Vé đã bán</div>
                  <div className="info-value">
                    {event.soldTickets} / {event.totalTickets}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
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
                      background:
                        soldPercentage < 50
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button
                  className="button"
                  onClick={() => onViewStatistics(event)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                  }}
                >
                  Thống kê
                </button>

                <button className="button" onClick={() => onViewDetails(event)} style={{ flex: 1 }}>
                  Chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
