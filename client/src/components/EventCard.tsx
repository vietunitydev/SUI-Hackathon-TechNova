import React, { useState } from 'react';
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
  const soldPercentage = (event.soldTickets / event.totalTickets) * 100;
  const isEventPassed = Date.now() > event.eventTime;
  const isSoldOut = event.soldTickets >= event.totalTickets;

  return (
    <div className="card" style={{ position: 'relative' }}>
      {isSoldOut && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: '#f56565',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          HẾT VÉ
        </div>
      )}

      <h2 style={{ marginTop: 0, color: '#2d3748' }}>{event.name}</h2>
      <p style={{ color: '#718096', marginBottom: '20px' }}>{event.description}</p>

      <div className="event-info">
        <div className="info-item">
          <div className="info-label">📅 Thời gian</div>
          <div className="info-value" style={{ fontSize: '14px' }}>
            {format(event.eventTime, 'dd/MM/yyyy HH:mm', { locale: vi })}
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">📍 Địa điểm</div>
          <div className="info-value" style={{ fontSize: '14px' }}>
            {event.venue}
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">💰 Giá vé</div>
          <div className="info-value">
            {(event.originalPrice / 1e9).toFixed(2)} SUI
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">🎫 Số vé</div>
          <div className="info-value">
            {event.soldTickets} / {event.totalTickets}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${soldPercentage}%`,
              height: '100%',
              background: soldPercentage < 50 ? '#48bb78' : soldPercentage < 80 ? '#ed8936' : '#f56565',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
          {soldPercentage.toFixed(0)}% đã bán
        </p>
      </div>

      <button
        className="button"
        onClick={() => onBuyTicket(event.id)}
        disabled={loading || isEventPassed || isSoldOut}
        style={{ width: '100%', marginTop: '16px' }}
      >
        {loading ? 'Đang xử lý...' : isSoldOut ? '❌ Hết vé' : isEventPassed ? '⏰ Đã kết thúc' : '🎫 Mua vé ngay'}
      </button>

      <p style={{ fontSize: '12px', color: '#718096', marginTop: '12px', textAlign: 'center' }}>
        🛡️ Chống phe vé: Không được bán lại cao hơn giá gốc
      </p>
    </div>
  );
};
