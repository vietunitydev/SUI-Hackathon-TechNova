import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
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
   * Tạo sự kiện mới
   */
  async createEvent(params: CreateEventParams, signer: string): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_event`,
      arguments: [
        tx.pure(Array.from(new TextEncoder().encode(params.name))),
        tx.pure(params.eventTime),
        tx.pure(params.originalPrice),
        tx.pure(params.totalTickets),
        tx.pure(Array.from(new TextEncoder().encode(params.venue))),
        tx.pure(Array.from(new TextEncoder().encode(params.description))),
      ],
    });

    return tx;
  }

  /**
   * Mint vé mới
   */
  async mintTicket(params: MintTicketParams, signer: string): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    // Split coin để thanh toán
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(params.payment)]);

    // Get clock object
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::mint_ticket`,
      arguments: [
        tx.object(params.eventConfigId),
        coin,
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Check-in vé tại sự kiện
   */
  async checkInTicket(params: CheckInTicketParams, signer: string): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

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
    params: TransformTicketParams,
    signer: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

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
   * Tham gia hàng chờ để mua vé resale
   */
  async joinWaitlist(params: JoinWaitlistParams, signer: string): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::join_waitlist`,
      arguments: [
        tx.object(params.waitlistId),
      ],
    });

    return tx;
  }

  /**
   * Bán vé lại cho hệ thống (không chỉ định người mua)
   * Vé sẽ tự động đến người đầu hàng chờ
   */
  async sellBackTicket(
    params: SellBackTicketParams,
    signer: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    // Split coin để thanh toán (system cần coin để hoàn tiền)
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(params.payment)]);

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::sell_back_ticket`,
      arguments: [
        tx.object(params.ticket.id), // Ticket object ID
        tx.object(params.waitlistId),
        tx.object(params.eventConfigId),
        coin,
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Rời khỏi hàng chờ
   */
  async leaveWaitlist(waitlistId: string, signer: string): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

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
        },
      });

      if (object.data?.content?.dataType === 'moveObject') {
        const fields = object.data.content.fields as any;
        return {
          id: fields.id.id,
          name: fields.name,
          organizer: fields.organizer,
          eventTime: parseInt(fields.event_time),
          originalPrice: parseInt(fields.original_price),
          totalTickets: parseInt(fields.total_tickets),
          soldTickets: parseInt(fields.sold_tickets),
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
   * Lấy tất cả sự kiện
   */
  async getAllEvents(): Promise<EventConfig[]> {
    try {
      // Query shared objects of EventConfig type
      const objects = await this.client.getOwnedObjects({
        filter: {
          StructType: `${PACKAGE_ID}::${MODULE_NAME}::EventConfig`,
        },
        options: {
          showContent: true,
        },
      });

      const events: EventConfig[] = [];
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as any;
          events.push({
            id: fields.id.id,
            name: fields.name,
            organizer: fields.organizer,
            eventTime: parseInt(fields.event_time),
            originalPrice: parseInt(fields.original_price),
            totalTickets: parseInt(fields.total_tickets),
            soldTickets: parseInt(fields.sold_tickets),
            venue: fields.venue,
            description: fields.description,
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Lấy thông tin waitlist cho sự kiện
   */
  async getWaitlist(eventId: string): Promise<WaitingList | null> {
    try {
      // Query all WaitingList objects
      const objects = await this.client.getOwnedObjects({
        filter: {
          StructType: `${PACKAGE_ID}::${MODULE_NAME}::WaitingList`,
        },
        options: {
          showContent: true,
        },
      });

      // Find waitlist for this event
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as any;
          if (fields.event_id === eventId) {
            return {
              id: fields.id.id,
              eventId: fields.event_id,
              queue: fields.queue || [],
              queueLength: fields.queue ? fields.queue.length : 0,
            };
          }
        }
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

  /**
   * Get SuiClient instance
   */
  getClient(): SuiClient {
    return this.client;
  }
}

export const ticketingService = new TicketingService();
