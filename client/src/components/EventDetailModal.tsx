import { useState, useEffect } from 'react';
import type { EventConfig } from '../types/ticket';
import { ticketingService } from '../services/ticketingService';

interface EventDetailModalProps {
  event: EventConfig;
  onClose: () => void;
  onCheckIn: (ticketId: string, eventId: string) => void;
  loading: boolean;
}

interface TicketInfo {
  id: string;
  ticketNumber: number;
  owner: string;
  state: number;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onCheckIn,
  loading,
}) => {
  const [ticketId, setTicketId] = useState('');
  const [eventTickets, setEventTickets] = useState<TicketInfo[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [scanMode, setScanMode] = useState<'manual' | 'qr'>('manual');

  useEffect(() => {
    loadEventTickets();
  }, [event.id]);

  const loadEventTickets = async () => {
    setLoadingTickets(true);
    try {
      // Query all TicketMinted events for this event
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

  const handleCheckIn = () => {
    if (!ticketId.trim()) return;
    onCheckIn(ticketId.trim(), event.id);
    setTicketId('');
  };

  const handleQRScan = () => {
    alert('📷 Tính năng quét QR sẽ được thêm trong phiên bản tiếp theo!\n\nHiện tại vui lòng nhập Ticket ID thủ công.');
  };

  const mintedTickets = eventTickets.length;
  const checkedInTickets = eventTickets.filter(t => t.state >= 1).length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <h2 style={{ marginTop: 0, color: '#2d3748' }}>{event.name}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ color: '#718096', marginBottom: '24px' }}>{event.description}</p>

        {/* Thống kê */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px',
              background: '#f7fafc',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2d3748' }}>
              {mintedTickets}
            </div>
            <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
              Vé đã bán
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
              {checkedInTickets}
            </div>
            <div style={{ fontSize: '14px', color: '#15803d', marginTop: '4px' }}>
              Đã check-in
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              background: '#fef3c7',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>
              {mintedTickets - checkedInTickets}
            </div>
            <div style={{ fontSize: '14px', color: '#b45309', marginTop: '4px' }}>
              Chưa check-in
            </div>
          </div>
        </div>

        {/* Check-in Section */}
        <div
          style={{
            padding: '20px',
            background: '#f7fafc',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#2d3748' }}>🎫 Check-in vé</h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className={`tab ${scanMode === 'manual' ? 'active' : ''}`}
              onClick={() => setScanMode('manual')}
              style={{ flex: 1 }}
            >
              ⌨️ Nhập ID
            </button>
            <button
              className={`tab ${scanMode === 'qr' ? 'active' : ''}`}
              onClick={() => setScanMode('qr')}
              style={{ flex: 1 }}
            >
              📷 Quét QR
            </button>
          </div>

          {scanMode === 'manual' ? (
            <div>
              <input
                type="text"
                placeholder="Nhập Ticket ID (0x...)"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '12px',
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleCheckIn}
                disabled={!ticketId.trim() || loading}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Đang check-in...' : '✓ Check-in'}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '40px',
                background: 'white',
                borderRadius: '8px',
                border: '2px dashed #cbd5e0',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <p style={{ color: '#718096', marginBottom: '16px' }}>
                Quét mã QR trên vé để check-in
              </p>
              <button
                className="btn btn-primary"
                onClick={handleQRScan}
              >
                Bật camera
              </button>
            </div>
          )}
        </div>

        {/* Danh sách vé */}
        <div>
          <h3 style={{ color: '#2d3748' }}>📋 Danh sách vé ({eventTickets.length})</h3>
          
          {loadingTickets ? (
            <p style={{ textAlign: 'center', color: '#718096' }}>Đang tải...</p>
          ) : eventTickets.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096' }}>Chưa có vé nào được bán</p>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Số vé</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Chủ sở hữu</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {eventTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      style={{ borderBottom: '1px solid #e2e8f0' }}
                    >
                      <td style={{ padding: '12px' }}>#{ticket.ticketNumber}</td>
                      <td
                        style={{
                          padding: '12px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      >
                        {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {ticket.state === 0 ? (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: '#fef3c7',
                              color: '#d97706',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          >
                            ⏳ Chưa check-in
                          </span>
                        ) : ticket.state === 1 ? (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: '#d1fae5',
                              color: '#16a34a',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          >
                            ✓ Đã check-in
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: '#e0e7ff',
                              color: '#4f46e5',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          >
                            🏆 POAP
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
