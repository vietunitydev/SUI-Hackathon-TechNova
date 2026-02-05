# Dynamic Ticketing System - Sequence Diagrams

## 1. TẠO SỰ KIỆN (Create Event)

```mermaid
sequenceDiagram
    actor User as 👤 Organizer
    participant UI as 🖥️ UI (CreateEventPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant BC as ⛓️ Blockchain
    
    User->>UI: Nhập thông tin event
    UI->>Service: createEvent(name, time, price, tickets, venue, desc)
    Service->>Contract: create_event()
    
    Note over Contract: Tạo 4 Shared Objects
    Contract->>Contract: EventConfig {id, name, organizer, ...}
    Contract->>Contract: WaitingList {id, queue: []}
    Contract->>Contract: DepositEscrow {id, deposits: Table}
    Contract->>Contract: EventTreasury {id, balance: 0}
    
    Contract->>BC: Share 4 objects
    Contract-->>BC: Emit EventCreated {event_id, treasury_id, waitlist_id, deposit_escrow_id}
    
    BC-->>UI: Transaction success + Event data
    UI->>UI: Save IDs to localStorage
    UI-->>User: ✅ "Sự kiện đã được tạo!"
```

**Objects Created:**
- `EventConfig` - Shared (mutable)
- `WaitingList` - Shared (mutable) 
- `DepositEscrow` - Shared (mutable)
- `EventTreasury` - Shared (mutable)

---

## 2. MUA VÉ (Mint Ticket)

```mermaid
sequenceDiagram
    actor User as 👤 Buyer
    participant UI as 🖥️ UI (EventDetailPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Treasury as 💰 EventTreasury
    participant BC as ⛓️ Blockchain
    
    User->>UI: Click "Mua vé ngay"
    UI->>UI: Check treasuryId exists?
    UI->>Service: mintTicket({eventConfigId, treasuryId, payment})
    Service->>Service: Split coin từ gas
    Service->>Contract: mint_ticket(event_config, treasury, payment, clock)
    
    Note over Contract: Validation
    Contract->>Contract: Assert: time < event_time
    Contract->>Contract: Assert: payment >= price
    Contract->>Contract: Assert: active_tickets < total_tickets
    
    Note over Contract: Update State
    Contract->>Contract: minted_tickets++
    Contract->>Contract: active_tickets++
    Contract->>Contract: Create Ticket NFT {id, event_id, ticket_number, state: PENDING}
    Contract->>Contract: Add dynamic field: TicketMetadata
    
    Contract->>Treasury: coin::join(payment) 💸
    Contract-->>BC: Emit TicketMinted {ticket_id, owner, ticket_number}
    Contract->>User: transfer::public_transfer(ticket) 🎫
    
    BC-->>UI: Transaction success
    UI-->>User: ✅ "Mua vé thành công!" + Ticket NFT
```

**Flow tiền:**
- User gas → Treasury balance
- Ticket NFT → User wallet

---

## 3. HOÀN TIỀN VÉ (Refund Ticket)

```mermaid
sequenceDiagram
    actor User as 👤 Ticket Owner
    participant UI as 🖥️ UI (MyTicketsPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Treasury as 💰 EventTreasury
    participant BC as ⛓️ Blockchain
    
    User->>UI: Click "Hoàn tiền"
    UI->>UI: Find event by ticket.eventId
    UI->>UI: Check treasuryId exists?
    UI->>Service: refundTicket(ticketId, eventConfigId, treasuryId)
    Service->>Contract: refund_ticket(ticket, event_config, treasury, clock)
    
    Note over Contract: Validation
    Contract->>Contract: Assert: ticket.state == PENDING
    Contract->>Contract: Assert: time < event_time
    Contract->>Contract: Assert: treasury.balance >= refund_amount
    
    Note over Contract: Update State
    Contract->>Contract: active_tickets-- (minted_tickets KHÔNG giảm)
    Contract->>Contract: Destroy ticket (object::delete)
    
    Contract->>Treasury: coin::split(refund_amount) 💸
    Contract->>User: transfer::public_transfer(refund_coin)
    Contract-->>BC: Emit TicketSoldBack event
    
    BC-->>UI: Transaction success
    UI-->>User: ✅ "Hoàn tiền thành công!" + SUI coin
```

**Flow:**
- Ticket → Destroyed ❌
- Treasury balance → User wallet 💰
- `minted_tickets`: không đổi (statistic)
- `active_tickets`: giảm 1 (slot available)

---

## 4. CHECK-IN VÉ (Check In Ticket)

```mermaid
sequenceDiagram
    actor Organizer as 👤 Organizer
    participant UI as 🖥️ UI (EventStatisticsPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Ticket as 🎫 Ticket NFT
    participant BC as ⛓️ Blockchain
    
    Organizer->>UI: Scan QR / Enter ticket ID
    UI->>Service: checkInTicket(ticketId, eventConfigId)
    Service->>Contract: check_in_ticket(&mut ticket, event_config, clock)
    
    Note over Contract: Authorization
    Contract->>Contract: Assert: sender == organizer (CHỈ organizer)
    Contract->>Contract: Assert: ticket.state == PENDING
    
    Note over Contract: Update Ticket
    Contract->>Ticket: ticket.state = CHECKED_IN
    Contract->>Ticket: Update metadata.image_url → "checked-in.png"
    Contract->>Ticket: Update metadata.description → "Successfully Checked In"
    Contract->>Ticket: Update metadata.last_updated
    
    Contract-->>BC: Emit TicketCheckedIn {ticket_id, event_id, timestamp}
    BC-->>UI: Transaction success
    UI-->>Organizer: ✅ "Check-in thành công!"
```

**Quyền hạn:**
- ⚠️ CHỈ organizer mới check-in được
- Ticket owner pass `&mut Ticket` = auto-verified ownership

---

## 5. THAM GIA HÀNG CHỜ (Join Waitlist)

```mermaid
sequenceDiagram
    actor User as 👤 Buyer
    participant UI as 🖥️ UI (EventDetailPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Waitlist as 📋 WaitingList
    participant Escrow as 🔒 DepositEscrow
    participant BC as ⛓️ Blockchain
    
    User->>UI: Click "Vào hàng chờ"
    UI->>Service: joinWaitlist({waitlistId, depositEscrowId, eventConfigId, payment})
    Service->>Service: Split coin từ gas
    Service->>Contract: join_waitlist(waitlist, deposit_escrow, event_config, payment)
    
    Note over Contract: Validation
    Contract->>Waitlist: Assert: user NOT in queue
    Contract->>Contract: Assert: payment >= original_price
    
    Note over Contract: Add to Queue (FIFO)
    Contract->>Waitlist: vector::push_back(user)
    Contract->>Escrow: table::add(user, payment) 🔒
    
    Contract-->>BC: Emit JoinedWaitlist {event_id, user, position}
    BC-->>UI: Transaction success
    UI-->>User: ✅ "Đã vào hàng chờ vị trí #X"
```

**Deposit Escrow:**
- Payment coin được lock trong DepositEscrow
- Sẽ dùng để mua vé khi có người sell back
- FIFO queue (first in, first out)

---

## 6. BÁN LẠI VÉ (Sell Back Ticket)

```mermaid
sequenceDiagram
    actor Seller as 👤 Seller
    actor Buyer as 👤 Buyer (first in queue)
    participant UI as 🖥️ UI (MyTicketsPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Waitlist as 📋 WaitingList
    participant Escrow as 🔒 DepositEscrow
    participant BC as ⛓️ Blockchain
    
    Seller->>UI: Click "Bán lại vé"
    UI->>Service: sellBackTicket({ticket, waitlistId, depositEscrowId, eventConfigId})
    Service->>Contract: sell_back_ticket(ticket, waitlist, deposit_escrow, event_config, clock)
    
    Note over Contract: Validation
    Contract->>Contract: Assert: ticket.state == PENDING
    Contract->>Waitlist: Assert: queue.length > 0
    Contract->>Contract: Assert: time < event_time
    
    Note over Contract: FIFO Matching
    Contract->>Waitlist: buyer = vector::remove(0) [FIRST in queue]
    Contract->>Escrow: buyer_payment = table::remove(buyer)
    
    Note over Contract: Transfer Assets
    Contract->>Seller: transfer::public_transfer(buyer_payment) 💰
    Contract->>Contract: Update ticket metadata
    Contract->>Buyer: transfer::public_transfer(ticket) 🎫
    
    Contract-->>BC: Emit TicketSoldBack event
    BC-->>UI: Transaction success
    UI-->>Seller: ✅ "Bán vé thành công!" + nhận tiền
    UI-->>Buyer: ✅ "Mua vé thành công!" + nhận ticket
```

**Anti-Scalping:**
- ✅ FIFO queue (không chỉ định buyer)
- ✅ Original price (deposit == original_price)
- ✅ Automatic matching (không thương lượng)

---

## 7. ORGANIZER RÚT TIỀN (Organizer Withdraw)

```mermaid
sequenceDiagram
    actor Organizer as 👤 Organizer
    participant UI as 🖥️ UI (MyEventsPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Treasury as 💰 EventTreasury
    participant BC as ⛓️ Blockchain
    
    Organizer->>UI: Click "Rút tiền"
    UI->>Service: organizerWithdraw(eventConfigId, treasuryId)
    Service->>Contract: organizer_withdraw(event_config, treasury, clock)
    
    Note over Contract: Authorization
    Contract->>Contract: Assert: sender == organizer
    Contract->>Contract: Assert: time > event_time (event ended)
    
    Note over Contract: Withdraw All
    Contract->>Treasury: amount = coin::value(balance)
    Contract->>Treasury: withdrawal = coin::split(amount)
    Contract->>Organizer: transfer::public_transfer(withdrawal) 💰
    
    BC-->>UI: Transaction success
    UI-->>Organizer: ✅ "Rút tiền thành công!" + toàn bộ doanh thu
```

**Điều kiện:**
- ⚠️ CHỈ organizer
- ⚠️ SAU khi event kết thúc (không còn refund)

---

## 8. CHUYỂN THÀNH KỶ NIỆM (Transform to POAP)

```mermaid
sequenceDiagram
    actor User as 👤 Ticket Owner
    participant UI as 🖥️ UI (MyTicketsPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant Ticket as 🎫 Ticket NFT
    participant BC as ⛓️ Blockchain
    
    User->>UI: Click "Chuyển thành kỷ niệm"
    UI->>Service: transformToCommemorative(ticketId, eventConfigId)
    Service->>Contract: transform_to_commemorative(&mut ticket, event_config, clock)
    
    Note over Contract: Validation
    Contract->>Contract: Assert: time > event_time + 1 day
    
    Note over Contract: Transform to POAP
    Contract->>Ticket: ticket.state = COMMEMORATIVE
    Contract->>Ticket: metadata.image_url → "poap-badge.png"
    Contract->>Ticket: metadata.description → "Commemorative Badge"
    Contract->>Ticket: metadata.last_updated = current_time
    
    Contract-->>BC: Emit TicketTransformed event
    BC-->>UI: Transaction success
    UI-->>User: ✅ "Ticket đã chuyển thành huy hiệu kỷ niệm!" 🏅
```

---

## 9. HỦY SỰ KIỆN (Cancel Event)

```mermaid
sequenceDiagram
    actor Organizer as 👤 Organizer
    participant UI as 🖥️ UI (MyEventsPage)
    participant Service as ⚙️ TicketingService
    participant Contract as 📜 Smart Contract
    participant BC as ⛓️ Blockchain
    
    Organizer->>UI: Click "Hủy sự kiện"
    UI->>Service: cancelEvent(eventConfigId)
    Service->>Contract: cancel_event(event_config, clock)
    
    Note over Contract: Authorization
    Contract->>Contract: Assert: sender == organizer
    Contract->>Contract: Assert: time < event_time
    
    Note over Contract: Calculate Refund
    Contract->>Contract: refunded_amount = active_tickets * original_price
    
    Contract-->>BC: Emit EventCancelled {event_id, refunded_amount, timestamp}
    BC-->>UI: Transaction success
    UI-->>Organizer: ⚠️ "Sự kiện đã hủy"
    
    Note over UI: Ticket holders phải gọi<br/>refund_ticket() để lấy tiền
```

---

## KEY SECURITY PATTERNS

### 🔐 Sui Ownership System
```mermaid
graph LR
    A[ticket: Ticket] -->|CHỈ owner pass được| B[Owned Object]
    C[&mut Ticket] -->|CHỈ owner borrow được| B
    B -->|Auto-verified| D[No manual check needed]
```

### 💰 Treasury Escrow Flow
```mermaid
graph LR
    A[Buyer Payment] -->|mint_ticket| B[Treasury Balance]
    B -->|refund_ticket| C[User Refund]
    B -->|organizer_withdraw| D[Organizer Revenue]
```

### 📊 Ticket Counters
```mermaid
graph TD
    A[total_tickets: 100] --> B[minted_tickets]
    A --> C[active_tickets]
    B -->|Never decreases| D[All-time statistics]
    C -->|Decreases on refund| E[Available slots]
    E --> F[total - active = slots left]
```

---

## ERROR CODES

| Code | Name | Description |
|------|------|-------------|
| 0 | `ENotEventOrganizer` | CHỈ organizer |
| 1 | `EEventAlreadyStarted` | Event đã bắt đầu |
| 2 | `ETicketAlreadyUsed` | Vé đã check-in |
| 3 | `EInvalidPrice` | Giá sai |
| 6 | `EWaitlistEmpty` | Không có người chờ |
| 7 | `EAlreadyInWaitlist` | Đã trong hàng chờ |
| 8 | `ECannotSellCheckedInTicket` | Không bán vé đã check-in |
| 9 | `EInsufficientTreasury` | Treasury không đủ tiền |
| 10 | `ESoldOut` | Hết vé (active_tickets >= total_tickets) |

---

## COMPLETE DATA FLOW

```mermaid
graph TB
    subgraph "CREATE EVENT"
        A1[Organizer] -->|create_event| A2[4 Shared Objects]
        A2 --> A3[EventConfig]
        A2 --> A4[Treasury]
        A2 --> A5[Waitlist]
        A2 --> A6[DepositEscrow]
    end
    
    subgraph "MINT TICKET"
        B1[Buyer] -->|payment| B2[Treasury]
        B2 -->|ticket NFT| B1
    end
    
    subgraph "REFUND"
        C1[Owner] -->|destroy ticket| C2[Contract]
        C2 -->|SUI from Treasury| C1
        C2 -->|active_tickets--| C3[Slot Available]
    end
    
    subgraph "SELL BACK"
        D1[Seller] -->|ticket| D2[FIFO Queue]
        D2 -->|deposit| D1
        D2 -->|ticket| D3[Buyer from Queue]
    end
    
    subgraph "WITHDRAW"
        E1[Organizer] -->|after event| E2[Treasury Balance]
        E2 -->|all funds| E1
    end
```
