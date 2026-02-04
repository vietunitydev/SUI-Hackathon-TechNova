import React from 'react';
import { TicketCard } from '../components/TicketCard';
import type { EventConfig, Ticket } from '../types/ticket';

interface MyTicketsPageProps {
  tickets: Ticket[];
  events: EventConfig[];
  userAddress?: string;
  onCheckIn: (ticketId: string, eventId: string) => void;
  onTransform: (ticketId: string, eventId: string) => void;
  onRefund: (ticketId: string, eventId: string) => void;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({
  tickets,
  events,
  userAddress,
  onCheckIn,
  onTransform,
  onRefund,
}) => {
  if (!userAddress) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '20px', fontWeight: '700' }}>Vui lòng kết nối ví</h3>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
          Kết nối ví Sui Wallet để xem vé của bạn
        </p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Chưa có vé nào</h3>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
          Hãy khám phá và mua vé cho các sự kiện thú vị!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#e2e8f0', margin: 0, marginBottom: '8px', fontSize: '28px', fontWeight: '700' }}>
          Vé của tôi
        </h2>
        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
          <span style={{ color: '#60a5fa', fontWeight: '700' }}>{tickets.length}</span> vé trong bộ sưu tập
        </div>
      </div>

      <div className="ticket-grid">
        {tickets.map((ticket) => {
          const event = events.find((e) => e.id === ticket.eventId);
          const isOrganizer = event?.organizer === userAddress;
          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              event={event || null}
              onCheckIn={() => onCheckIn(ticket.id, ticket.eventId)}
              onTransform={() => onTransform(ticket.id, ticket.eventId)}
              onRefund={() => onRefund(ticket.id, ticket.eventId)}
              isOrganizer={isOrganizer}
            />
          );
        })}
      </div>
    </div>
  );
};
