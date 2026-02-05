import { useState, useEffect } from 'react';
import type { EventConfig, Ticket } from '../types/ticket';
import { TicketState } from '../types/ticket';
import { ticketingService } from '../services/ticketingService';

interface EventDetailPageProps {
  event: EventConfig | null;
  onBack: () => void;
  onCheckIn: (ticketId: string, eventId: string) => void;
  loading: boolean;
  allTickets?: Ticket[];
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
  allTickets = [],
}) => {
  const [ticketId, setTicketId] = useState('');
  const [eventTickets, setEventTickets] = useState<TicketInfo[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'tickets'>('overview');

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
  const soldPercentage = (event.mintedTickets / event.totalTickets) * 100;
  const revenue = (event.mintedTickets * event.originalPrice) / 1_000_000_000;

  // Statistics data
  const userEventTickets = allTickets.filter(t => t.eventId === event.id);
  const pendingTickets = userEventTickets.filter(t => t.state === TicketState.PENDING);
  const checkedInUserTickets = userEventTickets.filter(t => t.state === TicketState.CHECKED_IN);
  const commemorativeTickets = userEventTickets.filter(t => t.state === TicketState.COMMEMORATIVE);

  const stats = [
    { label: 'Tổng vé', value: event.totalTickets, color: '#60a5fa' },
    { label: 'Đã bán', value: event.mintedTickets, color: '#34d399' },
    { label: 'Còn lại', value: event.totalTickets - event.mintedTickets, color: '#fbbf24' },
    { label: 'Check-in', value: checkedInTickets, color: '#f472b6' },
  ];

  const ticketStates = [
    {
      label: 'Chưa check-in',
      count: pendingTickets.length,
      percentage: userEventTickets.length > 0 ? (pendingTickets.length / userEventTickets.length) * 100 : 0,
      color: '#60a5fa',
    },
    {
      label: 'Đã check-in',
      count: checkedInUserTickets.length,
      percentage: userEventTickets.length > 0 ? (checkedInUserTickets.length / userEventTickets.length) * 100 : 0,
      color: '#34d399',
    },
    {
      label: 'Kỷ niệm',
      count: commemorativeTickets.length,
      percentage: userEventTickets.length > 0 ? (commemorativeTickets.length / userEventTickets.length) * 100 : 0,
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
        {[
          { id: 'overview', label: 'Tổng quan' },
          { id: 'checkin', label: 'Check-in' },
          { id: 'tickets', label: 'Danh sách vé' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
              color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
              fontSize: '15px',
              fontWeight: activeTab === tab.id ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Event Info */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
              Thông tin sự kiện
            </h4>
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

          {/* Statistics */}
          <h4 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
            Thống kê
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className="card"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                  border: `1px solid ${stat.color}40`,
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
                <div style={{ color: stat.color, fontSize: '32px', fontWeight: '800' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="card" style={{ marginBottom: '24px' }}>
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
              {event.mintedTickets} / {event.totalTickets} vé đã bán
            </div>
          </div>

          {/* Doanh thu */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #a78bfa15 0%, #a78bfa05 100%)', border: '1px solid #a78bfa40' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
              Doanh thu ước tính
            </div>
            <div style={{ color: '#a78bfa', fontSize: '32px', fontWeight: '800' }}>
              {revenue.toFixed(2)} SUI
            </div>
          </div>

          {userEventTickets.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
                Trạng thái vé đã bán
              </h4>
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
            </div>
          )}
        </div>
      )}

      {activeTab === 'checkin' && (
        <div>
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
              style={{
                width: '100%',
                padding: '14px 24px',
                background: loading || !ticketId.trim()
                  ? 'rgba(100, 116, 139, 0.2)'
                  : 'linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #db2777 100%)',
                border: '1px solid rgba(244, 114, 182, 0.3)',
                borderRadius: '12px',
                color: loading || !ticketId.trim() ? '#64748b' : 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading || !ticketId.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading || !ticketId.trim()
                  ? 'none'
                  : '0 8px 24px rgba(244, 114, 182, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                if (!loading && ticketId.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(244, 114, 182, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && ticketId.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(244, 114, 182, 0.3)';
                }
              }}
            >
              {loading ? '⏳ Đang xử lý...' : '✓ Check-in ngay'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div>
          {/* Tickets List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ color: '#e2e8f0', margin: 0, fontSize: '18px', fontWeight: '700' }}>
                Danh sách vé
              </h4>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                {loadingTickets ? 'Đang tải...' : `${eventTickets.length} vé`}
              </div>
            </div>

            {loadingTickets ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ color: '#94a3b8', fontSize: '15px' }}>Đang tải danh sách vé...</div>
              </div>
            ) : eventTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ color: '#94a3b8', fontSize: '15px' }}>Chưa có vé nào được bán</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
                        Số vé
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
                        Chủ sở hữu
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
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
                        <td style={{ padding: '16px 12px', color: '#e2e8f0', fontSize: '15px', fontWeight: '600' }}>
                          #{ticket.ticketNumber}
                        </td>
                        <td style={{ padding: '16px 12px', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
                          {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              ...(ticket.state === 0
                                ? { background: 'rgba(96, 165, 250, 0.15)', border: '1px solid rgba(96, 165, 250, 0.3)', color: '#60a5fa' }
                                : ticket.state === 1
                                ? { background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e' }
                                : { background: 'rgba(244, 114, 182, 0.15)', border: '1px solid rgba(244, 114, 182, 0.3)', color: '#f472b6' }),
                            }}
                          >
                            {ticket.state === 0 ? 'Chưa sử dụng' : ticket.state === 1 ? 'Đã check-in' : 'Kỷ niệm'}
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
      )}
    </div>
  );
};
