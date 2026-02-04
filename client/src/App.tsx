import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { Layout } from './components/Layout';
import { BrowsePage } from './pages/BrowsePage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { UserInfoPage } from './pages/UserInfoPage';
import { EventStatisticsPage } from './pages/EventStatisticsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ticketingService } from './services/ticketingService';
import type { EventConfig, Ticket, CreateEventParams } from './types/ticket';
import './App.css';

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [currentPage, setCurrentPage] = useState<string>('browse');
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [myEvents, setMyEvents] = useState<EventConfig[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventConfig | null>(null);
  const [statisticsEvent, setStatisticsEvent] = useState<EventConfig | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (account?.address) {
      loadMyTickets();
      loadMyEvents();
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

  const loadMyEvents = async () => {
    if (!account?.address) return;
    try {
      const allEvents = await ticketingService.getAllEvents();
      const ownedEvents = allEvents.filter(e => e.organizer === account.address);
      setMyEvents(ownedEvents);
    } catch (error) {
      console.error('Error loading my events:', error);
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
            
            showMessage('success', 'Tạo sự kiện thành công!');
            setTimeout(() => loadEvents(), 2000); // Wait a bit for indexing
            setCurrentPage('myEvents');
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
            showMessage('success', 'Mua vé thành công!');
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

  const handleCancelEvent = async (eventId: string) => {
    if (!account?.address) return;
    
    if (!confirm('Bạn có chắc muốn hủy sự kiện này? Hành động không thể hoàn tác!')) {
      return;
    }

    try {
      setLoading(true);
      const tx = await ticketingService.cancelEvent(eventId);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            showMessage('success', 'Đã hủy sự kiện thành công!');
            loadMyEvents();
            loadEvents();
          },
          onError: (error: Error) => {
            console.error('Error cancelling event:', error);
            showMessage('error', 'Lỗi khi hủy sự kiện: ' + error.message);
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

  const handleRefund = async (ticketId: string, eventId: string) => {
    if (!account?.address) return;

    if (!confirm('Bạn có chắc muốn hoàn tiền vé này? Vé sẽ bị hủy!')) {
      return;
    }

    try {
      setLoading(true);
      const tx = await ticketingService.refundTicket(ticketId, eventId);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            showMessage('success', 'Hoàn tiền thành công!');
            loadMyTickets();
            loadEvents(); // Cập nhật số vé đã bán
            loadMyEvents(); // Cập nhật event của tôi
          },
          onError: (error: Error) => {
            console.error('Error refunding ticket:', error);
            showMessage('error', 'Lỗi khi hoàn tiền: ' + error.message);
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
    <Layout
      currentPage={statisticsEvent ? 'statistics' : selectedEvent ? 'eventDetail' : currentPage}
      onNavigate={(page) => {
        setCurrentPage(page);
        setStatisticsEvent(null);
        setSelectedEvent(null);
      }}
      userAddress={account?.address}
    >
      {/* Message Toast */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Page Rendering */}
      {statisticsEvent ? (
        <EventStatisticsPage
          event={statisticsEvent}
          tickets={myTickets}
          onBack={() => {
            setStatisticsEvent(null);
            setCurrentPage('myEvents');
          }}
        />
      ) : selectedEvent ? (
        <EventDetailPage
          event={selectedEvent}
          onBack={() => {
            setSelectedEvent(null);
            setCurrentPage('myEvents');
          }}
          onCheckIn={handleCheckIn}
          loading={loading}
        />
      ) : currentPage === 'browse' ? (
        <BrowsePage
          events={events}
          onBuyTicket={handleBuyTicket}
          loading={loading}
        />
      ) : currentPage === 'myTickets' ? (
        <MyTicketsPage
          tickets={myTickets}
          events={events}
          userAddress={account?.address}
          onCheckIn={handleCheckIn}
          onTransform={handleTransform}
          onRefund={handleRefund}
        />
      ) : currentPage === 'myEvents' ? (
        <MyEventsPage
          events={myEvents}
          userAddress={account?.address}
          onViewDetails={setSelectedEvent}
          onViewStatistics={setStatisticsEvent}
          onCreateEvent={() => setCurrentPage('create')}
          onCancelEvent={handleCancelEvent}
          loading={loading}
        />
      ) : currentPage === 'create' ? (
        <CreateEventPage
          userAddress={account?.address}
          onSubmit={handleCreateEvent}
          loading={loading}
        />
      ) : currentPage === 'userInfo' ? (
        <UserInfoPage
          userAddress={account?.address}
          events={events}
          tickets={myTickets}
        />
      ) : null}
    </Layout>
  );
}

export default App;