// Type definitions for Dynamic Ticketing System

export interface EventConfig {
  id: string;
  name: string;
  organizer: string;
  eventTime: number;
  originalPrice: number;
  totalTickets: number;
  soldTickets: number;
  venue: string;
  description: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketNumber: number;
  originalPrice: number;
  state: TicketState;
  owner: string;
  metadata?: TicketMetadata;
}

export interface TicketMetadata {
  imageUrl: string;
  description: string;
  qrCode: string;
  lastUpdated: number;
}

export enum TicketState {
  PENDING = 0,
  CHECKED_IN = 1,
  COMMEMORATIVE = 2,
}

export interface CreateEventParams {
  name: string;
  eventTime: number;
  originalPrice: number;
  totalTickets: number;
  venue: string;
  description: string;
}

export interface MintTicketParams {
  eventConfigId: string;
  payment: number;
}

export interface CheckInTicketParams {
  ticketId: string;
  eventConfigId: string;
}

export interface TransformTicketParams {
  ticketId: string;
  eventConfigId: string;
}

export interface WaitingList {
  id: string;
  eventId: string;
  queue: string[];
  queueLength: number;
}

export interface JoinWaitlistParams {
  waitlistId: string;
}

export interface SellBackTicketParams {
  ticket: any; // Ticket object
  waitlistId: string;
  eventConfigId: string;
  payment: number;
}

// Event types emitted by smart contract
export interface EventCreatedEvent {
  eventId: string;
  name: string;
  organizer: string;
  eventTime: number;
}

export interface TicketMintedEvent {
  ticketId: string;
  eventId: string;
  owner: string;
  ticketNumber: number;
}

export interface TicketCheckedInEvent {
  ticketId: string;
  eventId: string;
  timestamp: number;
}

export interface TicketTransformedEvent {
  ticketId: string;
  newState: number;
  timestamp: number;
}

export interface JoinedWaitlistEvent {
  eventId: string;
  user: string;
  position: number;
}

export interface TicketSoldBackEvent {
  ticketId: string;
  seller: string;
  buyer: string;
  eventId: string;
  timestamp: number;
}
