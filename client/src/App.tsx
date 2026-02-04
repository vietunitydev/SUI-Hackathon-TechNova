import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { CreateEventForm } from './components/CreateEventForm';
import { EventCard } from './components/EventCard';
import { TicketCard } from './components/TicketCard';
import { ticketingService } from './services/ticketingService';
import type { EventConfig, Ticket, CreateEventParams } from './types/ticket';
import './App.css';

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [activeTab, setActiveTab] = useState<'events' | 'myTickets' | 'createEvent'>('events');
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (account?.address) {
      loadMyTickets();
    }
  }, [account?.address]);

  const loadEvents = async () => {
    try {
      const allEvents = await ticketingService.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      showMessage('error', 'Không thể tải danh sách sự kiện');
    }
  };

  const loadMyTickets = async () => {
    if (!account?.address) return;
    try {
      const tickets = await ticketingService.getUserTickets(account.address);
      setMyTickets(tickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateEvent = async (params: CreateEventParams) => {
    if (!account?.address) {
      showMessage('error', 'Vui lòng kết nối ví trước!');
      return;
    }

    try {
      setLoading(true);
      const tx = await ticketingService.createEvent(params);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result: any) => {
            console.log('Transaction result:', result);
            
            // Extract created object IDs from transaction digest
            try {
              const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
              
              // Retry logic: Transaction might not be indexed immediately
              let txDetails = null;
              let retries = 5;
              
              while (retries > 0 && !txDetails) {
                try {
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
                  txDetails = await client.getTransactionBlock({
                    digest: result.digest,
                    options: {
                      showEffects: true,
                      showObjectChanges: true,
                    },
                  });
                  break; // Success, exit loop
                } catch (err: any) {
                  retries--;
                  if (retries === 0) throw err; // Last retry failed
                  console.log(`Retry ${5 - retries}/5...`);
                }
              }
              
              console.log('Transaction details:', txDetails);
              
              // Extract EventConfig ID from created objects
              if (txDetails?.objectChanges) {
                for (const change of txDetails.objectChanges) {
                  // EventConfig is a shared object that was created
                  // Filter by objectType to exclude TransferPolicy
                  if (change.type === 'created' && 
                      change.owner && 
                      typeof change.owner === 'object' && 
                      'Shared' in change.owner &&
                      change.objectType?.includes('::dynamic_ticket::EventConfig')) {
                    const eventId = change.objectId;
                    console.log('✅ Found Event ID:', eventId);
                    ticketingService.trackEventId(eventId);
                  }
                }
              }
            } catch (err) {
              console.error('Error extracting event ID:', err);
            }
            
            showMessage('success', 'Tạo sự kiện thành công! 🎉');
            setTimeout(() => loadEvents(), 2000); // Wait a bit for indexing
            setActiveTab('events');
          },
          onError: (error: Error) => {
            console.error('Error creating event:', error);
            showMessage('error', 'Lỗi khi tạo sự kiện: ' + error.message);
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      showMessage('error', 'Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = async (eventId: string) => {
    if (!account?.address) {
      showMessage('error', 'Vui lòng kết nối ví trước!');
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    try {
      setLoading(true);
      const tx = await ticketingService.mintTicket({
        eventConfigId: eventId,
        payment: event.originalPrice,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            showMessage('success', 'Mua vé thành công! 🎫');
            loadEvents();
            loadMyTickets();
          },
          onError: (error: Error) => {
            console.error('Error buying ticket:', error);
            showMessage('error', 'Lỗi khi mua vé: ' + error.message);
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      showMessage('error', 'Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (ticketId: string, eventId: string) => {
    if (!account?.address) return;

    try {
      setLoading(true);
      const tx = await ticketingService.checkInTicket({
        ticketId,
        eventConfigId: eventId,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            showMessage('success', 'Check-in thành công! ✓');
            loadMyTickets();
          },
          onError: (error: Error) => {
            console.error('Error checking in:', error);
            showMessage('error', 'Lỗi khi check-in: ' + error.message);
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      showMessage('error', 'Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransform = async (ticketId: string, eventId: string) => {
    if (!account?.address) return;

    try {
      setLoading(true);
      const tx = await ticketingService.transformToCommemorative({
        ticketId,
        eventConfigId: eventId,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            showMessage('success', 'Chuyển đổi thành công! 🏆');
            loadMyTickets();
          },
          onError: (error: Error) => {
            console.error('Error transforming:', error);
            showMessage('error', 'Lỗi khi chuyển đổi: ' + error.message);
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      showMessage('error', 'Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="wallet-button">
        <ConnectButton />
      </div>

      <div className="header">
        <h1>🎫 Dynamic Ticketing</h1>
        <p>Hệ thống vé NFT chống phe vé với Sui Blockchain</p>
        <p style={{ fontSize: '16px', marginTop: '8px' }}>
          ✨ Vé thay đổi trạng thái tự động | 🛡️ Chống bán lại cao hơn giá gốc | 🏆 POAP kỷ niệm
        </p>
        {/*<div style={{ */}
        {/*  marginTop: '16px', */}
        {/*  padding: '12px', */}
        {/*  background: '#fef3c7', */}
        {/*  border: '2px solid #f59e0b',*/}
        {/*  borderRadius: '8px',*/}
        {/*  fontSize: '14px'*/}
        {/*}}>*/}
        {/*  ⚠️ <strong>QUAN TRỌNG:</strong> Vui lòng chuyển ví Sui Wallet của bạn sang <strong style={{ color: '#d97706' }}>TESTNET</strong><br/>*/}
        {/*  📍 Cách chuyển: Mở Sui Wallet → Click network (góc trên phải) → Chọn "Testnet"*/}
        {/*</div>*/}
      </div>

      {message && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📅 Sự kiện
          </button>
          <button
            className={`tab ${activeTab === 'myTickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTickets')}
          >
            🎫 Vé của tôi
          </button>
          <button
            className={`tab ${activeTab === 'createEvent' ? 'active' : ''}`}
            onClick={() => setActiveTab('createEvent')}
          >
            ➕ Tạo sự kiện
          </button>
        </div>
      </div>

      {activeTab === 'events' && (
        <div>
          <h2 style={{ color: 'white', marginBottom: '20px' }}>Sự kiện sắp diễn ra</h2>
          {events.length === 0 ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#718096' }}>
                Chưa có sự kiện nào. Hãy tạo sự kiện đầu tiên! 🎉
              </p>
            </div>
          ) : (
            <div className="ticket-grid">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onBuyTicket={handleBuyTicket}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'myTickets' && (
        <div>
          <h2 style={{ color: 'white', marginBottom: '20px' }}>Vé của tôi</h2>
          {!account?.address ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#718096' }}>
                Vui lòng kết nối ví để xem vé của bạn 👛
              </p>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#718096' }}>
                Bạn chưa có vé nào. Hãy mua vé cho sự kiện! 🎫
              </p>
            </div>
          ) : (
            <div className="ticket-grid">
              {myTickets.map((ticket) => {
                const event = events.find((e) => e.id === ticket.eventId);
                const isOrganizer = event?.organizer === account.address;
                return (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    event={event || null}
                    onCheckIn={() => handleCheckIn(ticket.id, ticket.eventId)}
                    onTransform={() => handleTransform(ticket.id, ticket.eventId)}
                    isOrganizer={isOrganizer}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'createEvent' && (
        <div>
          {!account?.address ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#718096' }}>
                Vui lòng kết nối ví để tạo sự kiện 👛
              </p>
            </div>
          ) : (
            <CreateEventForm onSubmit={handleCreateEvent} loading={loading} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
