import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { PACKAGE_ID, MODULE_NAME, SUI_NETWORK, NETWORK_CONFIG } from '../config/constants';
import type {
  CreateEventParams,
  MintTicketParams,
  CheckInTicketParams,
  TransformTicketParams,
  JoinWaitlistParams,
  SellBackTicketParams,
  EventConfig,
  Ticket,
  WaitingList,
} from '../types/ticket';

export class TicketingService {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({
      url: NETWORK_CONFIG[SUI_NETWORK as keyof typeof NETWORK_CONFIG].url,
    });
  }

  /**
   * Get SuiClient instance
   */
  getClient(): SuiClient {
    return this.client;
  }

  /**
   * Get Package ID
   */
  getPackageId(): string {
    return PACKAGE_ID;
  }

  /**
   * Tạo sự kiện mới
   */
  async createEvent(params: CreateEventParams): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_event`,
      arguments: [
        tx.pure(bcs.vector(bcs.U8).serialize(Array.from(new TextEncoder().encode(params.name)))),
        tx.pure(bcs.U64.serialize(params.eventTime)),
        tx.pure(bcs.U64.serialize(params.originalPrice)),
        tx.pure(bcs.U64.serialize(params.totalTickets)),
        tx.pure(bcs.vector(bcs.U8).serialize(Array.from(new TextEncoder().encode(params.venue)))),
        tx.pure(bcs.vector(bcs.U8).serialize(Array.from(new TextEncoder().encode(params.description)))),
      ],
    });

    return tx;
  }

  /**
   * Mint vé mới
   */
  async mintTicket(params: MintTicketParams): Promise<Transaction> {
    const tx = new Transaction();

    // Split coin để thanh toán
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(bcs.U64.serialize(params.payment))]);

    // Get clock object
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::mint_ticket`,
      arguments: [
        tx.object(params.eventConfigId),
        tx.object(params.treasuryId),
        coin,
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Check-in vé tại sự kiện
   */
  async checkInTicket(params: CheckInTicketParams): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::check_in_ticket`,
      arguments: [
        tx.object(params.ticketId),
        tx.object(params.eventConfigId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Chuyển vé thành huy hiệu kỷ niệm sau sự kiện
   */
  async transformToCommemorative(
    params: TransformTicketParams
  ): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::transform_to_commemorative`,
      arguments: [
        tx.object(params.ticketId),
        tx.object(params.eventConfigId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Hủy sự kiện (chỉ organizer)
   */
  async cancelEvent(eventConfigId: string): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::cancel_event`,
      arguments: [
        tx.object(eventConfigId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Hoàn tiền vé (ticket owner)
   */
  async refundTicket(ticketId: string, eventConfigId: string, treasuryId: string): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::refund_ticket`,
      arguments: [
        tx.object(ticketId),
        tx.object(eventConfigId),
        tx.object(treasuryId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Tham gia hàng chờ để mua vé resale
   */
  async joinWaitlist(params: JoinWaitlistParams): Promise<Transaction> {
    const tx = new Transaction();

    // Split coin để deposit
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(bcs.U64.serialize(params.payment))]);

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::join_waitlist`,
      arguments: [
        tx.object(params.waitlistId),
        tx.object(params.depositEscrowId),
        tx.object(params.eventConfigId),
        coin,
      ],
    });

    return tx;
  }

  /**
   * Bán vé lại cho hệ thống (không chỉ định người mua)
   * Vé sẽ tự động đến người đầu hàng chờ
   */
  async sellBackTicket(
    params: SellBackTicketParams
  ): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::sell_back_ticket`,
      arguments: [
        tx.object(params.ticket.id), // Ticket object ID
        tx.object(params.waitlistId),
        tx.object(params.depositEscrowId),
        tx.object(params.eventConfigId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Rời khỏi hàng chờ
   */
  async leaveWaitlist(waitlistId: string): Promise<Transaction> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::leave_waitlist`,
      arguments: [
        tx.object(waitlistId),
      ],
    });

    return tx;
  }

  /**
   * Lấy thông tin sự kiện
   */
  async getEvent(eventId: string): Promise<EventConfig | null> {
    try {
      const object = await this.client.getObject({
        id: eventId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      // Validate it's an EventConfig object
      if (object.data?.content?.dataType === 'moveObject') {
        const objectType = object.data.type as string;
        console.log(`🔍 Checking object ${eventId.slice(0, 10)}... Type: ${objectType}`);
        
        // Skip if not EventConfig (e.g., TransferPolicy)
        if (!objectType?.includes('::dynamic_ticket::EventConfig')) {
          console.log(`⚠️ Skipping non-EventConfig object: ${eventId}`);
          return null;
        }

        const fields = object.data.content.fields as any;
        
        // Validate required fields exist
        if (!fields.event_time || !fields.name) {
          console.log(`⚠️ Invalid EventConfig fields: ${eventId}`);
          return null;
        }

        console.log(`✅ Valid EventConfig: ${fields.name}`);
        return {
          id: fields.id.id,
          name: fields.name,
          organizer: fields.organizer,
          eventTime: Number(fields.event_time),  // Convert to Number for date-fns
          originalPrice: Number(fields.original_price),
          totalTickets: Number(fields.total_tickets),
          mintedTickets: Number(fields.minted_tickets),
          activeTickets: Number(fields.active_tickets),
          venue: fields.venue,
          description: fields.description,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  /**
   * Lấy thông tin vé
   */
  async getTicket(ticketId: string): Promise<Ticket | null> {
    try {
      const object = await this.client.getObject({
        id: ticketId,
        options: {
          showContent: true,
        },
      });

      if (object.data?.content?.dataType === 'moveObject') {
        const fields = object.data.content.fields as any;
        return {
          id: fields.id.id,
          eventId: fields.event_id,
          ticketNumber: parseInt(fields.ticket_number),
          originalPrice: parseInt(fields.original_price),
          state: parseInt(fields.state),
          owner: fields.owner,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  }

  /**
   * Lấy danh sách vé của user
   */
  async getUserTickets(userAddress: string): Promise<Ticket[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${PACKAGE_ID}::${MODULE_NAME}::Ticket`,
        },
        options: {
          showContent: true,
        },
      });

      const tickets: Ticket[] = [];
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as any;
          tickets.push({
            id: fields.id.id,
            eventId: fields.event_id,
            ticketNumber: parseInt(fields.ticket_number),
            originalPrice: parseInt(fields.original_price),
            state: parseInt(fields.state),
            owner: fields.owner,
          });
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  /**
   * Get all events by querying EventCreated events from blockchain
   */
  async getAllEvents(): Promise<EventConfig[]> {
    try {
      // Query EventCreated events from blockchain
      const eventType = `${PACKAGE_ID}::${MODULE_NAME}::EventCreated`;
      
      const eventsResponse = await this.client.queryEvents({
        query: { MoveEventType: eventType },
        order: 'descending', // Mới nhất trước
        limit: 50, // Lấy tối đa 50 events
      });

      console.log(`📡 Found ${eventsResponse.data.length} EventCreated events`);

      const events: EventConfig[] = [];

      for (const eventData of eventsResponse.data) {
        try {
          const parsedJson = eventData.parsedJson as any;
          const eventId = parsedJson.event_id;
          const treasuryId = parsedJson.treasury_id;
          const waitlistId = parsedJson.waitlist_id;
          const depositEscrowId = parsedJson.deposit_escrow_id;

          // Fetch full event details
          const event = await this.getEvent(eventId);
          if (event) {
            event.treasuryId = treasuryId;
            event.waitlistId = waitlistId;
            event.depositEscrowId = depositEscrowId;
            events.push(event);
          }
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      }

      console.log(`✅ Loaded ${events.length} events`);
      return events;
    } catch (error) {
      console.error('Error fetching events from blockchain:', error);
      
      // Fallback to localStorage tracking
      console.log('⚠️ Falling back to localStorage');
      const eventIds = this.getTrackedEventIds();
      const events: EventConfig[] = [];

      for (const eventId of eventIds) {
        const event = await this.getEvent(eventId);
        if (event) {
          events.push(event);
        }
      }

      return events;
    }
  }

  /**
   * Track event ID in localStorage
   */
  trackEventId(eventId: string): void {
    const eventIds = this.getTrackedEventIds();
    if (!eventIds.includes(eventId)) {
      eventIds.push(eventId);
      localStorage.setItem('sui_event_ids', JSON.stringify(eventIds));
    }
  }

  /**
   * Get tracked event IDs from localStorage
   */
  private getTrackedEventIds(): string[] {
    const stored = localStorage.getItem('sui_event_ids');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Lấy thông tin waitlist cho sự kiện
   */
  async getWaitlist(waitlistId: string): Promise<WaitingList | null> {
    try {
      const obj = await this.client.getObject({
        id: waitlistId,
        options: {
          showContent: true,
        },
      });

      if (obj.data?.content?.dataType === 'moveObject') {
        const fields = obj.data.content.fields as any;
        return {
          id: fields.id.id,
          eventId: fields.event_id,
          queue: fields.queue || [],
          queueLength: fields.queue ? fields.queue.length : 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      return null;
    }
  }

  /**
   * Kiểm tra user có trong waitlist không
   */
  async isInWaitlist(waitlistId: string, userAddress: string): Promise<boolean> {
    try {
      const waitlist = await this.client.getObject({
        id: waitlistId,
        options: {
          showContent: true,
        },
      });

      if (waitlist.data?.content?.dataType === 'moveObject') {
        const fields = waitlist.data.content.fields as any;
        const queue = fields.queue || [];
        return queue.includes(userAddress);
      }

      return false;
    } catch (error) {
      console.error('Error checking waitlist:', error);
      return false;
    }
  }
}

export const ticketingService = new TicketingService();
