import React from 'react';
import { EventCard } from '../components/EventCard';
import type { EventConfig } from '../types/ticket';

interface BrowsePageProps {
  events: EventConfig[];
  onBuyTicket: (eventId: string) => void;
  loading: boolean;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ events, onBuyTicket, loading }) => {
  return (
    <div>
      <h2 style={{ color: '#e2e8f0', marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
        Sự kiện sắp diễn ra
      </h2>
      
      {events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0, fontWeight: '500' }}>
            Chưa có sự kiện nào. Hãy tạo sự kiện đầu tiên!
          </p>
        </div>
      ) : (
        <div className="ticket-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onBuyTicket={onBuyTicket}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
};
