# Dynamic Ticketing System - Sequence Diagrams

## 1. TẠO SỰ KIỆN (Create Event)

```
User (Organizer)  →  UI (CreateEventPage)
                   ↓
UI                 →  TicketingService.createEvent()
                   ↓
Service            →  Contract: create_event(name, time, price, tickets, venue, desc)
                   ↓
Contract:
  ├─ Tạo EventConfig { id, name, organizer, event_time, total_tickets, ... }
  ├─ Tạo WaitingList { id, event_id, queue: [] }
  ├─ Tạo DepositEscrow { id, event_id, deposits: Table }
  ├─ Tạo EventTreasury { id, event_id, balance: 0 }
  ├─ Emit EventCreated { event_id, treasury_id, waitlist_id, deposit_escrow_id }
  └─ Share objects: EventConfig, WaitingList, DepositEscrow, Treasury
                   ↓
Blockchain         ←  4 Shared Objects created
                   ↓
UI                 ←  Event EventCreated (contains all IDs)
                   ↓
LocalStorage       ←  Save event IDs for tracking
                   ↓
User               ←  "Sự kiện đã được tạo!"
```

**Các Object được tạo:**
- `EventConfig` - Shared (mutable)
- `WaitingList` - Shared (mutable)
- `DepositEscrow` - Shared (mutable)
- `EventTreasury` - Shared (mutable)

---

## 2. MUA VÉ (Mint Ticket)

```
User (Buyer)       →  UI (EventDetailPage / BrowsePage)
                   ↓
UI                 →  Check: treasuryId exists?
                   ↓
UI                 →  TicketingService.mintTicket({ eventConfigId, treasuryId, payment })
                   ↓
Service            →  TX: Split coin từ gas
                   ↓
Service            →  Contract: mint_ticket(event_config, treasury, payment, clock)
                   ↓
Contract:
  ├─ Assert: current_time < event_time (chưa bắt đầu)
  ├─ Assert: payment >= original_price
  ├─ Assert: minted_tickets < total_tickets (ESoldOut)
  ├─ minted_tickets++
  ├─ active_tickets++
  ├─ Tạo Ticket { id, event_id, ticket_number, original_price, state: PENDING }
  ├─ Add dynamic field: TicketMetadata { image_url, qr_code, description }
  ├─ Emit TicketMinted { ticket_id, event_id, owner, ticket_number }
  ├─ coin::join(&mut treasury.balance, payment)  // Nạp vào treasury
  └─ transfer::public_transfer(ticket, buyer)    // Transfer ticket
                   ↓
Blockchain         ←  Ticket object created (owned by buyer)
Blockchain         ←  Treasury balance += payment
                   ↓
UI                 ←  Transaction success
                   ↓
User               ←  "Mua vé thành công!" + Ticket NFT vào ví
```

**Flow tiền:**
- User → Gas (split coin)
- Gas coin → Treasury balance
- Ticket → User (owned object)

---

## 3. HOÀN TIỀN VÉ (Refund Ticket)

```
User (Ticket Owner) →  UI (MyTicketsPage)
                   ↓
UI                 →  Find event by ticket.eventId
                   ↓
UI                 →  Check: event.treasuryId exists?
                   ↓
UI                 →  TicketingService.refundTicket(ticketId, eventConfigId, treasuryId)
                   ↓
Service            →  Contract: refund_ticket(ticket, event_config, treasury, clock)
                   ↓
Contract:
  ├─ Assert: ticket.state == PENDING (chưa check-in)
  ├─ Assert: current_time < event_time (event chưa bắt đầu)
  ├─ Assert: treasury.balance >= ticket.original_price
  ├─ active_tickets-- (minted_tickets KHÔNG giảm)
  ├─ Destroy ticket (object::delete)
  ├─ coin::split(&mut treasury.balance, refund_amount) 
  ├─ transfer::public_transfer(refund_coin, owner)
  └─ Emit TicketSoldBack event
                   ↓
Blockchain         ←  Ticket destroyed
Blockchain         ←  Treasury balance -= refund_amount
Blockchain         ←  Refund coin → User
                   ↓
UI                 ←  Transaction success
                   ↓
User               ←  "Hoàn tiền thành công!" + SUI coin về ví
```

**Flow tiền:**
- Treasury balance → Refund coin
- Refund coin → User wallet
- Ticket → Destroyed

**Số liệu:**
- `minted_tickets`: KHÔNG thay đổi (statistic)
- `active_tickets`: Giảm 1 (có thể refund)

---

## 4. CHECK-IN VÉ (Check In Ticket)

```
Organizer          →  UI (EventStatisticsPage)
                   ↓
UI                 →  TicketingService.checkInTicket(ticketId, eventConfigId)
                   ↓
Service            →  Contract: check_in_ticket(&mut ticket, event_config, clock)
                   ↓
Contract:
  ├─ Assert: sender == event_config.organizer (CHỈ organizer)
  ├─ Assert: ticket.state == PENDING (chưa check-in)
  ├─ ticket.state = CHECKED_IN
  ├─ Update metadata: image_url → "checked-in.png"
  ├─ Update metadata: description → "Successfully Checked In"
  ├─ Update metadata: last_updated = current_time
  └─ Emit TicketCheckedIn { ticket_id, event_id, timestamp }
                   ↓
Blockchain         ←  Ticket state changed (mutable)
                   ↓
UI                 ←  Transaction success
                   ↓
Organizer          ←  "Check-in thành công!"
```

**Quyền:**
- CHỈ organizer mới check-in được (ENotEventOrganizer)
- Ticket owner pass `&mut Ticket` = auto-verified ownership

---

## 5. THAM GIA HÀNG CHỜ (Join Waitlist)

```
User (Buyer)       →  UI (EventDetailPage)
                   ↓
UI                 →  Check: waitlistId, depositEscrowId, eventConfigId
                   ↓
UI                 →  TicketingService.joinWaitlist({ waitlistId, depositEscrowId, eventConfigId, payment })
                   ↓
Service            →  TX: Split coin từ gas
                   ↓
Service            →  Contract: join_waitlist(waitlist, deposit_escrow, event_config, payment)
                   ↓
Contract:
  ├─ Assert: user NOT in waitlist (EAlreadyInWaitlist)
  ├─ Assert: payment >= original_price
  ├─ vector::push_back(&mut waitlist.queue, user)  // FIFO queue
  ├─ table::add(&mut deposit_escrow.deposits, user, payment)  // Lưu deposit
  └─ Emit JoinedWaitlist { event_id, user, position }
                   ↓
Blockchain         ←  WaitingList.queue += user
Blockchain         ←  DepositEscrow.deposits[user] = payment coin
                   ↓
UI                 ←  Transaction success
                   ↓
User               ←  "Đã vào hàng chờ vị trí #X"
```

**Flow tiền:**
- User → Gas (split coin)
- Gas coin → DepositEscrow (locked)
- Deposit sẽ dùng để mua vé khi có người sell back

---

## 6. BÁN LẠI VÉ (Sell Back Ticket)

```
Seller (Ticket Owner) →  UI (MyTicketsPage)
                   ↓
UI                 →  TicketingService.sellBackTicket({ ticket, waitlistId, depositEscrowId, eventConfigId })
                   ↓
Service            →  Contract: sell_back_ticket(ticket, waitlist, deposit_escrow, event_config, clock)
                   ↓
Contract:
  ├─ Assert: ticket.state == PENDING (chưa check-in)
  ├─ Assert: waitlist.queue.length > 0 (có người chờ)
  ├─ Assert: current_time < event_time
  ├─ buyer = vector::remove(&mut waitlist.queue, 0)  // FIFO: lấy người đầu
  ├─ buyer_payment = table::remove(&mut deposit_escrow.deposits, buyer)
  ├─ transfer::public_transfer(buyer_payment, seller)  // Seller nhận tiền
  ├─ Update ticket metadata: last_updated
  ├─ Emit TicketSoldBack event
  └─ transfer::public_transfer(ticket, buyer)  // Buyer nhận vé
                   ↓
Blockchain         ←  WaitingList.queue remove buyer
Blockchain         ←  DepositEscrow.deposits remove buyer
Blockchain         ←  Deposit coin → Seller
Blockchain         ←  Ticket ownership → Buyer
                   ↓
UI                 ←  Transaction success
                   ↓
Seller             ←  "Bán vé thành công!" + nhận tiền
Buyer              ←  "Mua vé thành công!" + nhận ticket
```

**Anti-Scalping:**
- FIFO queue (không chỉ định buyer)
- Original price (deposit == original_price)
- Automatic matching (không thương lượng giá)

---

## 7. ORGANIZER RÚT TIỀN (Organizer Withdraw)

```
Organizer          →  UI (MyEventsPage)
                   ↓
UI                 →  TicketingService.organizerWithdraw(eventConfigId, treasuryId)
                   ↓
Service            →  Contract: organizer_withdraw(event_config, treasury, clock)
                   ↓
Contract:
  ├─ Assert: sender == event_config.organizer (CHỈ organizer)
  ├─ Assert: current_time > event_time (event đã kết thúc)
  ├─ amount = coin::value(&treasury.balance)
  ├─ withdrawal = coin::split(&mut treasury.balance, amount)
  └─ transfer::public_transfer(withdrawal, organizer)
                   ↓
Blockchain         ←  Treasury balance = 0
Blockchain         ←  Withdrawal coin → Organizer
                   ↓
UI                 ←  Transaction success
                   ↓
Organizer          ←  "Rút tiền thành công!" + toàn bộ doanh thu
```

**Điều kiện:**
- CHỈ organizer
- SAU khi event kết thúc (không còn refund)

---

## 8. CHUYỂN THÀNH KỶ NIỆM (Transform to POAP)

```
User (Ticket Owner) →  UI (MyTicketsPage)
                   ↓
UI                 →  TicketingService.transformToCommemorative(ticketId, eventConfigId)
                   ↓
Service            →  Contract: transform_to_commemorative(&mut ticket, event_config, clock)
                   ↓
Contract:
  ├─ Assert: current_time > event_time + 1 day (sau event 1 ngày)
  ├─ ticket.state = COMMEMORATIVE
  ├─ Update metadata: image_url → "poap-badge.png"
  ├─ Update metadata: description → "Commemorative Badge - Thank you!"
  └─ Emit TicketTransformed event
                   ↓
Blockchain         ←  Ticket state = COMMEMORATIVE (NFT collectible)
                   ↓
UI                 ←  Transaction success
                   ↓
User               ←  "Ticket đã chuyển thành huy hiệu kỷ niệm!"
```

---

## 9. HỦY SỰ KIỆN (Cancel Event)

```
Organizer          →  UI (MyEventsPage)
                   ↓
UI                 →  TicketingService.cancelEvent(eventConfigId)
                   ↓
Service            →  Contract: cancel_event(event_config, clock)
                   ↓
Contract:
  ├─ Assert: sender == organizer
  ├─ Assert: current_time < event_time (trước event)
  ├─ refunded_amount = active_tickets * original_price
  └─ Emit EventCancelled { event_id, refunded_amount, timestamp }
                   ↓
UI                 ←  Transaction success
                   ↓
Organizer          ←  "Sự kiện đã hủy - Ticket holders cần claim refund"
```

**Note:** Event chỉ emit, ticket holders phải gọi `refund_ticket` để lấy tiền

---

## KEY SECURITY PATTERNS

### 1. Sui Ownership System
```
ticket: Ticket  →  CHỈ owner mới pass được
&mut Ticket     →  CHỈ owner mới borrow được
```
→ KHÔNG cần manual owner check

### 2. Treasury Escrow
```
mint_ticket:   payment → treasury.balance
refund_ticket: treasury.balance → user
organizer_withdraw: treasury.balance → organizer (after event)
```
→ 100% on-chain refund

### 3. Deposit Escrow
```
join_waitlist:    payment → deposit_escrow.deposits[user]
sell_back_ticket: deposit_escrow.deposits[buyer] → seller
```
→ Anti-scalping FIFO queue

### 4. Ticket Counters
```
minted_tickets:  NEVER decreases (all-time statistics)
active_tickets:  Decreases on refund (refundable tickets)
```
→ Accurate data separation

---

## ERROR CODES

```move
ENotEventOrganizer = 0          // CHỈ organizer
EEventAlreadyStarted = 1        // Event đã bắt đầu
ETicketAlreadyUsed = 2          // Vé đã check-in
EInvalidPrice = 3               // Giá sai
EWaitlistEmpty = 6              // Không có người chờ
EAlreadyInWaitlist = 7          // Đã trong hàng chờ
ECannotSellCheckedInTicket = 8  // Không bán vé đã check-in
EInsufficientTreasury = 9       // Treasury không đủ tiền
ESoldOut = 10                   // Hết vé
```

---

## DATA FLOW SUMMARY

### CREATE EVENT
```
User → EventConfig + Treasury + Waitlist + DepositEscrow (4 shared objects)
```

### MINT TICKET
```
User → [Payment] → Treasury
User ← Ticket NFT (owned)
```

### REFUND
```
User → [Ticket destroyed]
User ← [SUI from Treasury]
active_tickets--
```

### SELL BACK
```
Seller → [Ticket transfer]
Seller ← [Deposit from buyer]
Buyer → [Remove from waitlist]
Buyer ← [Ticket NFT]
```

### ORGANIZER WITHDRAW
```
Organizer ← [All Treasury balance]
(After event ends)
```
