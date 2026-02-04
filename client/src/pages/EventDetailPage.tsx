import { useState, useEffect } from 'react';
import type { EventConfig } from '../types/ticket';
import { ticketingService } from '../services/ticketingService';

interface EventDetailPageProps {
  event: EventConfig | null;
  onBack: () => void;
  onCheckIn: (ticketId: string, eventId: string) => void;
  loading: boolean;
}

interface TicketInfo {
  id: string;
  ticketNumber: number;
  owner: string;
  state: number;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  event,
  onBack,
  onCheckIn,
  loading,
}) => {
  const [ticketId, setTicketId] = useState('');
  const [eventTickets, setEventTickets] = useState<TicketInfo[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (event) {
      loadEventTickets();
    }
  }, [event?.id]);

  const loadEventTickets = async () => {
    if (!event) return;
    
    setLoadingTickets(true);
    try {
      const eventType = `${ticketingService.getPackageId()}::dynamic_ticket::TicketMinted`;
      const eventsResponse = await ticketingService.getClient().queryEvents({
        query: { MoveEventType: eventType },
        order: 'descending',
        limit: 100,
      });

      const tickets: TicketInfo[] = [];
      for (const eventData of eventsResponse.data) {
        const parsedJson = eventData.parsedJson as any;
        if (parsedJson.event_id === event.id) {
          try {
            const ticket = await ticketingService.getTicket(parsedJson.ticket_id);
            if (ticket) {
              tickets.push({
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                owner: ticket.owner,
                state: ticket.state,
              });
            }
          } catch (err) {
            console.error('Error loading ticket:', err);
          }
        }
      }

      setEventTickets(tickets);
    } catch (error) {
      console.error('Error loading event tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

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

  const handleCheckIn = () => {
    if (!ticketId.trim()) return;
    onCheckIn(ticketId.trim(), event.id);
    setTicketId('');
  };

  const checkedInTickets = eventTickets.filter(t => t.state >= 1).length;
  const soldPercentage = (event.soldTickets / event.totalTickets) * 100;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          className="btn"
          onClick={onBack}
          style={{
            marginBottom: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          ← Quay lại
        </button>
        <h2 style={{ color: '#e2e8f0', marginBottom: '8px', fontSize: '28px', fontWeight: '700' }}>
          Chi tiết sự kiện
        </h2>
        <h3 style={{ color: '#94a3b8', margin: 0, fontSize: '18px', fontWeight: '500' }}>
          {event.name}
        </h3>
      </div>

      {/* Event Info */}
      <div className="card" style={{ marginBottom: '24px' }}>
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
            <div className="info-label">Mô tả</div>
            <div className="info-value" style={{ fontSize: '14px' }}>
              {event.description}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #60a5fa15 0%, #60a5fa05 100%)',
            border: '1px solid #60a5fa40',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
            Tổng vé
          </div>
          <div style={{ color: '#60a5fa', fontSize: '32px', fontWeight: '800' }}>
            {event.totalTickets}
          </div>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #34d39915 0%, #34d39905 100%)',
            border: '1px solid #34d39940',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
            Đã bán
          </div>
          <div style={{ color: '#34d399', fontSize: '32px', fontWeight: '800' }}>
            {event.soldTickets}
          </div>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #fbbf2415 0%, #fbbf2405 100%)',
            border: '1px solid #fbbf2440',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
            Còn lại
          </div>
          <div style={{ color: '#fbbf24', fontSize: '32px', fontWeight: '800' }}>
            {event.totalTickets - event.soldTickets}
          </div>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #f472b615 0%, #f472b605 100%)',
            border: '1px solid #f472b640',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
            Check-in
          </div>
          <div style={{ color: '#f472b6', fontSize: '32px', fontWeight: '800' }}>
            {checkedInTickets}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
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
      </div>

      {/* Check-in Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
          Check-in vé
        </h4>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
            Ticket ID
          </label>
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Nhập Ticket ID để check-in"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCheckIn();
              }
            }}
          />
        </div>

        <button
          onClick={handleCheckIn}
          disabled={loading || !ticketId.trim()}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Đang xử lý...' : 'Check-in'}
        </button>
      </div>

      {/* Tickets List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ color: '#e2e8f0', margin: 0, fontSize: '18px', fontWeight: '700' }}>
            Danh sách vé
          </h4>
          {loadingTickets && (
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Đang tải...</span>
          )}
        </div>

        {eventTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
              {loadingTickets ? 'Đang tải danh sách vé...' : 'Chưa có vé nào được bán'}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
                    #
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Owner
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {eventTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    style={{
                      borderBottom: index < eventTickets.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px', color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>
                      {ticket.ticketNumber}
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
                      {ticket.owner.slice(0, 8)}...{ticket.owner.slice(-6)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          ...(ticket.state === 0
                            ? { background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.3)' }
                            : ticket.state === 1
                            ? { background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }
                            : { background: 'rgba(244, 114, 182, 0.15)', color: '#f472b6', border: '1px solid rgba(244, 114, 182, 0.3)' }),
                        }}
                      >
                        {ticket.state === 0 ? 'Pending' : ticket.state === 1 ? 'Checked-in' : 'Commemorative'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
