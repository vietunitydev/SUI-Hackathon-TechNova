# Sui Dynamic Ticketing System

[![Sui Network](https://img.shields.io/badge/Sui-Network-blue)](https://sui.io)
[![Move Language](https://img.shields.io/badge/Move-Language-orange)](https://github.com/move-language/move)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)

Hệ thống bán vé NFT động trên Sui Blockchain với cơ chế chống phe vé tích hợp sẵn trong smart contract và giao diện web React/TypeScript.

> Built for TechNova Sui Hackathon 2026

## Quick Links

- **Package ID**: `0xe4c711b73e4ef93b4afb440e42bbee5db90a1028f91ce75d700be44b813b87e9`
- **Network**: Sui Testnet
- **Version**: v4 (Latest - Anti-scalping with refund logic)
- **Contract**: [View on Sui Explorer](https://suiexplorer.com/object/0xe4c711b73e4ef93b4afb440e42bbee5db90a1028f91ce75d700be44b813b87e9?network=testnet)
- **Presentation**: [PRESENTATION.md](PRESENTATION.md)

## Core Features

### 1. Anti-Scalping Protection

Cơ chế chống phe vé được tích hợp trực tiếp trong smart contract với **Waitlist Marketplace System**:
- **No Direct Transfer**: Không cho phép 2 người chuyển vé trực tiếp cho nhau
- **Waitlist Queue (FIFO)**: Người muốn mua phải vào hàng chờ, được xếp hàng công bằng
- **System-Controlled**: Hệ thống tự động ghép người bán với người ĐẦU TIÊN trong hàng chờ
- **Fixed Price**: Giá luôn cố định = original_price, seller không thể định giá
- **Seller Cannot Choose Buyer**: Người bán không thể chỉ định người mua để thao túng giá

### 2. Dynamic Ticket States

Vé NFT tự động thay đổi trạng thái theo vòng đời sự kiện:

**PENDING** (Trước khi check-in)
- Trạng thái ban đầu khi mua vé
- Hiển thị countdown đếm ngược đến ngày sự kiện
- Sẵn sàng để check-in tại cổng

**CHECKED_IN** (Sau khi check-in)
- Organizer scan/nhập ticket ID để check-in
- Metadata cập nhật timestamp check-in
- Không thể sử dụng lại vé (prevent fraud)

**COMMEMORATIVE** (Sau sự kiện 24h)
- Chuyển đổi thành POAP (Proof of Attendance)
- Trở thành NFT kỷ niệm có thể sưu tầm
- Badge chứng minh đã tham dự sự kiện

### 3. Multi-Page React Architecture

Giao diện web được xây dựng với React Router DOM v7 với 6 routes chính:

**1. Browse Events (/)** - Trang chủ
- Hiển thị danh sách tất cả sự kiện đang có
- Filter theo trạng thái (Upcoming/Ongoing/Ended)
- Xem chi tiết và mua vé trực tiếp

**2. My Tickets (/my-tickets)** - Quản lý vé đã mua
- Danh sách vé NFT của người dùng
- Hiển thị trạng thái vé (PENDING/CHECKED_IN/COMMEMORATIVE)
- Countdown timer cho sự kiện sắp diễn ra

**3. My Events (/my-events)** - Dashboard cho organizer
- Quản lý các sự kiện đã tạo
- Xem chi tiết từng sự kiện
- Tạo sự kiện mới

**4. Event Detail (/event/:eventId)** - Chi tiết sự kiện với 3 tabs
- **Tab Overview**: Thông tin sự kiện + thống kê (tổng vé/đã bán/còn lại/đã check-in, doanh thu, phân bố trạng thái vé)
- **Tab Check-in**: Form nhập Ticket ID để check-in người tham dự
- **Tab Tickets**: Bảng danh sách tất cả vé đã bán (ID, Buyer, State, Check-in Time)

**5. Create Event (/create-event)** - Form tạo sự kiện mới
- Nhập thông tin: tên, mô tả, địa điểm, thời gian
- Cấu hình vé: giá và số lượng
- Submit để mint Event object on-chain

**6. User Info (/user-info)** - Thông tin người dùng
- Hiển thị SUI balance
- Thống kê cá nhân (số vé đã mua, số sự kiện tham gia)

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐              ┌──────────────┐               │
│  │   Organizer  │              │    Buyer     │               │
│  │  (Web User)  │              │  (Web User)  │               │
│  └──────┬───────┘              └──────┬───────┘               │
│         │                             │                        │
│         │   Sui Wallet Extension      │                        │
│         └─────────────┬───────────────┘                        │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        │ JSON-RPC / Transaction
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    FRONTEND LAYER                               │
│                  (React + TypeScript)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              React Router DOM v7                       │   │
│  │  ┌──────────┬──────────┬──────────┬──────────────┐   │   │
│  │  │   Home   │   My     │   My     │    Event     │   │   │
│  │  │    /     │ Tickets  │  Events  │   Detail     │   │   │
│  │  ├──────────┼──────────┼──────────┼──────────────┤   │   │
│  │  │  Create  │   User   │          │              │   │   │
│  │  │  Event   │   Info   │          │              │   │   │
│  │  └──────────┴──────────┴──────────┴──────────────┘   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           @mysten/dapp-kit                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │ Wallet Conn  │  │  SuiClient   │  │ Transaction│  │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ RPC Calls / Transactions
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    SUI BLOCKCHAIN                               │
│                      (Testnet)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │        Smart Contract (Move - 1060 lines)              │   │
│  │     Package: 0xe4c711...813b87e9                       │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────┐     │   │
│  │  │          SHARED OBJECTS                      │     │   │
│  │  │                                               │     │   │
│  │  │  Event {                                     │     │   │
│  │  │    id: UID                                   │     │   │
│  │  │    organizer: address                        │     │   │
│  │  │    ticket_price: u64                         │     │   │
│  │  │    total_tickets: u64                        │     │   │
│  │  │    sold_tickets: u64                         │     │   │
│  │  │  }                                           │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────┐     │   │
│  │  │          OWNED OBJECTS                       │     │   │
│  │  │                                               │     │   │
│  │  │  Ticket {                                    │     │   │
│  │  │    id: UID                                   │     │   │
│  │  │    event_id: ID                              │     │   │
│  │  │    owner: address                            │     │   │
│  │  │    original_price: u64  // Anti-scalping    │     │   │
│  │  │    state: u8            // Dynamic state     │     │   │
│  │  │    purchase_time: u64                        │     │   │
│  │  │    checkin_time: Option<u64>                 │     │   │
│  │  │  }                                           │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────┐     │   │
│  │  │          ENTRY FUNCTIONS                     │     │   │
│  │  │                                               │     │   │
│  │  │  • create_event()                            │     │   │
│  │  │  • mint_ticket()                             │     │   │
│  │  │  • check_in_ticket()                         │     │   │
│  │  │  • transform_to_commemorative()              │     │   │
│  │  │  • join_waitlist()                           │     │   │
│  │  │  • sell_back_ticket()  // Marketplace       │     │   │
│  │  │  • cancel_event()      // Refund all        │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Sui Framework                             │   │
│  │  • Object Model    • Coin Module    • Clock           │   │
│  │  • Transfer Logic  • Event System   • TxContext       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE EVENT FLOW                            │
└─────────────────────────────────────────────────────────────────┘

Organizer → Connect Wallet → Fill Form → Submit
                                    ↓
                          create_event() transaction
                                    ↓
                    ┌───────────────┴───────────────┐
                    │   Sui Blockchain              │
                    │   • Create Event (shared obj) │
                    │   • Emit event                │
                    └───────────────┬───────────────┘
                                    ↓
                    Frontend fetch → Display in "My Events"


┌─────────────────────────────────────────────────────────────────┐
│                     BUY TICKET FLOW                             │
└─────────────────────────────────────────────────────────────────┘

Buyer → Browse Events → Select Event → Click "Buy Ticket"
                                    ↓
                          mint_ticket() transaction
                          (Payment: Coin<SUI>)
                                    ↓
                    ┌───────────────┴───────────────┐
                    │   Sui Blockchain              │
                    │   • Transfer SUI to organizer │
                    │   • Mint Ticket NFT (owned)   │
                    │   • Set state: PENDING        │
                    │   • Store original_price      │
                    └───────────────┬───────────────┘
                                    ↓
                    Frontend fetch → Display in "My Tickets"


┌─────────────────────────────────────────────────────────────────┐
│                    CHECK-IN FLOW                                │
└─────────────────────────────────────────────────────────────────┘

Organizer → Event Detail → Check-in Tab → Enter Ticket ID
                                    ↓
                          check_in_ticket() transaction
                                    ↓
                    ┌───────────────┴───────────────┐
                    │   Sui Blockchain              │
                    │   • Verify organizer          │
                    │   • Update state: CHECKED_IN  │
                    │   • Record checkin_time       │
                    └───────────────┬───────────────┘
                                    ↓
                    Frontend → Ticket state updated


┌─────────────────────────────────────────────────────────────────┐
│              WAITLIST MARKETPLACE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Buyer B, C, D → join_waitlist() → Added to FIFO queue
                                    ↓
                    Waitlist: [B, C, D] (positions locked)
                                    ↓
Seller A → sell_back_ticket(ticket, waitlist, payment)
                                    ↓
                    ┌───────────────┴───────────────┐
                    │   Smart Contract Logic        │
                    │   • Check ticket is PENDING   │
                    │   • Check waitlist not empty  │
                    │   • Pop first: buyer = B      │
                    │   • Refund seller: 10 SUI     │
                    │   • Transfer ticket to B      │
                    └───────────────┬───────────────┘
                                    ↓
                    ✅ Buyer B gets ticket at original price
                    ✅ Seller cannot choose buyer
                    ✅ FIFO ensures fairness
                    (Anti-scalping + Anti-manipulation)
```

### Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer          │  Technology              │  Version          │
├─────────────────┼──────────────────────────┼───────────────────┤
│  Blockchain     │  Sui Network             │  Testnet          │
│  Smart Contract │  Move Language           │  v1.0             │
│  Package ID     │  0xe4c711...813b87e9     │  v4 (latest)      │
├─────────────────┼──────────────────────────┼───────────────────┤
│  Frontend       │  React                   │  18.3.1           │
│                 │  TypeScript              │  5.2.2            │
│                 │  Vite                    │  5.4.21           │
│                 │  React Router DOM        │  7.13.0           │
├─────────────────┼──────────────────────────┼───────────────────┤
│  Sui SDK        │  @mysten/sui             │  ^1.17.0          │
│                 │  @mysten/dapp-kit        │  ^0.14.30         │
├─────────────────┼──────────────────────────┼───────────────────┤
│  Utilities      │  date-fns                │  latest           │
├─────────────────┼──────────────────────────┼───────────────────┤
│  Deployment     │  Vercel / Netlify        │  Production ready │
└─────────────────┴──────────────────────────┴───────────────────┘
```

### Smart Contract (Move - 1060 lines)

**Main Structs**:
```move
struct Event has key, store {
    id: UID,
    name: String,
    description: String,
    location: String,
    event_time: u64,
    organizer: address,
    ticket_price: u64,
    total_tickets: u64,
    sold_tickets: u64
}

struct Ticket has key, store {
    id: UID,
    event_id: ID,
    owner: address,
    original_price: u64,  // For anti-scalping
    state: u8,  // 0=PENDING, 1=CHECKED_IN, 2=COMMEMORATIVE
    purchase_time: u64,
    checkin_time: Option<u64>
}
```

**Key Functions**:

```move
// Tạo sự kiện mới (organizer only)
public entry fun create_event(
    name: String,
    description: String, 
    location: String,
    event_time: u64,
    ticket_price: u64,
    total_tickets: u64,
    ctx: &mut TxContext
)

// Mua vé (mint Ticket NFT)
public entry fun mint_ticket(
    event: &mut Event,
    payment: Coin<SUI>,
    ctx: &mut TxContext
)

// Check-in vé (organizer only)
public entry fun check_in_ticket(
    ticket: &mut Ticket,
    event: &Event,
    clock: &Clock,
    ctx: &TxContext
)

// Transform vé thành POAP sau sự kiện
public entry fun transform_to_commemorative(
    ticket: &mut Ticket,
    event: &EventConfig,
    clock: &Clock
)

// Tham gia hàng chờ để mua vé resale
public entry fun join_waitlist(
    waitlist: &mut WaitingList,
    ctx: &TxContext
)

// Bán vé lại qua hệ thống (không chọn được buyer)
public entry fun sell_back_ticket(
    ticket: Ticket,
    waitlist: &mut WaitingList,
    event_config: &EventConfig,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)

// Hủy event và refund tất cả vé
public entry fun cancel_event(
    event: EventConfig,
    clock: &Clock,
    ctx: &TxContext
)
```

**Anti-Scalping Logic trong `sell_back_ticket()`**:
```move
// Kiểm tra: Chỉ vé PENDING mới bán được
assert!(ticket.state == STATE_PENDING, ECannotSellCheckedInTicket);

// Kiểm tra: Phải có người trong hàng chờ
assert!(vector::length(&waitlist.queue) > 0, EWaitlistEmpty);

// Lấy người ĐẦU TIÊN trong hàng chờ (FIFO)
let buyer = vector::remove(&mut waitlist.queue, 0);

// Hoàn tiền cho SELLER (giá gốc)
let refund_amount = ticket.original_price;
let refund = coin::split(&mut payment, refund_amount, ctx);
transfer::public_transfer(refund, seller);

// Transfer vé cho BUYER (hệ thống quyết định, không phải seller)
transfer::public_transfer(ticket, buyer);
```

### Frontend (React + TypeScript)

**Tech Stack**:
- React 18.3.1 với TypeScript 5.2.2
- Vite 5.4.21 (build tool)
- React Router DOM v7.13.0 (routing)
- @mysten/sui ^1.17.0 (Sui SDK)
- @mysten/dapp-kit ^0.14.30 (wallet integration)
- date-fns (date formatting)

**Styling**:
- Dark theme với primary color #0f172a
- Glassmorphism effects
- Gradient buttons (blue/pink/green)
- Responsive grid layout
- No emojis in UI (professional design)

**State Management**:
- Local state với React hooks (useState, useEffect)
- Wallet connection via @mysten/dapp-kit
- Real-time data fetching từ Sui RPC

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm hoặc yarn
- Sui CLI (để deploy contract)
- Sui Wallet browser extension

### 1. Clone Repository

```bash
git clone <repository-url>
cd sui-hackathon-technova
```

### 2. Install Dependencies

```bash
cd web
npm install
```

### 3. Configure Network

File `web/src/config.ts`:
```typescript
export const NETWORK = "testnet";
export const PACKAGE_ID = "0xe4c711b73e4ef93b4afb440e42bbee5db90a1028f91ce75d700be44b813b87e9";
```

### 4. Run Development Server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

Output trong folder `dist/`

## Deploy Smart Contract (Optional)

Nếu muốn deploy contract version mới:

```bash
cd contract
sui move build
sui client publish --gas-budget 100000000
```

Cập nhật `PACKAGE_ID` trong `web/src/config.ts` với package ID mới.

## Usage Guide

### Cho Organizer (Người tổ chức sự kiện)

1. **Kết nối ví Sui** qua nút "Connect Wallet"
2. Chuyển đến trang **My Events** hoặc nhấn **Create Event**
3. Điền thông tin sự kiện:
   - Tên sự kiện
   - Mô tả
   - Địa điểm
   - Thời gian (chọn date/time)
   - Giá vé (SUI)
   - Số lượng vé
4. Nhấn **Create Event** và approve transaction
5. Sau khi tạo xong, xem chi tiết sự kiện trong **My Events**
6. Vào trang **Event Detail** > tab **Check-in** để check-in vé cho attendees

### Cho Buyer (Người mua vé)

1. **Kết nối ví Sui** 
2. Trang chủ hiển thị danh sách events
3. Nhấn **Buy Ticket** trên event muốn tham gia
4. Approve transaction để mint vé NFT
5. Vào **My Tickets** để xem vé đã mua
6. Khi đến sự kiện, organizer sẽ check-in bằng Ticket ID
7. Sau sự kiện 24h, có thể transform vé thành POAP commemorative badge

## Anti-Scalping Demonstration

**Scenario**: User A mua vé giá 10 SUI, sau đó muốn bán lại

**Flow qua hệ thống Waitlist:**

1. **User B, C, D muốn mua vé resale:**
   - User B → `join_waitlist()` → Vị trí #1 trong queue
   - User C → `join_waitlist()` → Vị trí #2 trong queue
   - User D → `join_waitlist()` → Vị trí #3 trong queue

2. **User A quyết định bán vé:**
   - User A gọi `sell_back_ticket(ticket, waitlist, payment)`
   - ❌ User A KHÔNG thể chọn bán cho User D (người quen) với giá cao
   - ✅ Hệ thống TỰ ĐỘNG lấy User B (người đầu hàng chờ)
   - User A nhận lại đúng 10 SUI (original_price)
   - User B nhận được vé

3. **Kết quả:**
   - ✅ Giá cố định: 10 SUI (không thể thay đổi)
   - ✅ FIFO queue: Công bằng cho người chờ lâu nhất
   - ✅ Phá vỡ thao túng: Seller không thể chọn buyer
   - ✅ Không phe vé: Scalper không kiếm lời được

**On-chain enforcement**: Hệ thống kiểm soát 100% mọi giao dịch.

## Demo Flow

### Happy Path Demo

1. **Organizer tạo event**
   - Name: "Sui Meetup Ha Noi"
   - Price: 10 SUI
   - Tickets: 50
   - Time: 1 tuần sau

2. **Buyer A mua 2 vé**
   - Trả 20 SUI
   - Nhận 2 Ticket NFTs (state: PENDING)
   - Hiển thị countdown trong My Tickets

3. **Ngày event đến**
   - Buyer A đến venue
   - Organizer check-in ticket IDs
   - Vé chuyển state PENDING → CHECKED_IN

4. **Sau event 24h**
   - Buyer A transform tickets thành COMMEMORATIVE
   - Giờ là POAP badges để lưu giữ

### Anti-Scalping Demo

1. **Nhiều người muốn mua vé resale**
   - Buyer B join waitlist → Position #1
   - Buyer C join waitlist → Position #2
   - Buyer D join waitlist → Position #3
   
2. **Buyer A bán lại vé qua hệ thống**
   - Buyer A gọi `sell_back_ticket()`
   - Hệ thống tự động lấy Buyer B (đầu hàng chờ)
   - Buyer A nhận 10 SUI (giá gốc)
   - Buyer B nhận vé, trả 10 SUI
   - ❌ Buyer A KHÔNG thể bán riêng cho Buyer D với giá cao

## Tech Highlights

### Blockchain Features
- **Sui Move Smart Contract**: Type-safe, resource-oriented programming
- **Object-Centric Model**: Events và Tickets là first-class objects
- **Shared Objects**: Event objects shared để multiple users mint tickets
- **Clock Object**: On-chain time verification cho check-in/transform logic
- **Coin Management**: Native SUI payment handling với automatic refund

### Frontend Architecture
- **React Router v7**: Client-side routing với proper URL structures
- **SuiClient Integration**: Direct RPC calls để fetch on-chain data
- **Wallet Connect**: Seamless integration với Sui wallet extensions
- **Responsive Design**: Mobile-friendly layout
- **Real-time Updates**: Countdown timers, live event status

### Security
- **Organizer Authorization**: Chỉ organizer mới check-in được tickets
- **State Validation**: Không thể check-in ticket đã CHECKED_IN rồi
- **Time Constraints**: Chỉ transform được sau event 24h
- **Price Enforcement**: Anti-scalping logic không thể bypass
- **Type Safety**: Move compiler đảm bảo type correctness

## Error Handling

Contract có các error codes chi tiết:

```move
const ENotEventOrganizer: u64 = 0;      // Không phải organizer
const EEventNotStarted: u64 = 1;        // Sự kiện chưa bắt đầu  
const ETicketAlreadyUsed: u64 = 2;      // Vé đã được sử dụng
const EPriceExceedsOriginal: u64 = 3;   // Giá vượt quá giá gốc
const EInsufficientPayment: u64 = 4;    // Payment không đủ
const ESoldOut: u64 = 5;                // Hết vé
```

Frontend hiển thị error messages từ transaction failures.

## Network Configuration

**Default**: Sui Testnet

```typescript
export const suiClient = new SuiClient({
  url: "https://fullnode.testnet.sui.io:443"
});
```

**Explorer**: https://suiexplorer.com/?network=testnet

## Project Structure

```
sui-hackathon-technova/
├── contract/               # Move smart contract
│   ├── sources/
│   │   └── dynamic_ticketing.move (1060 lines)
│   └── Move.toml
├── web/                   # React frontend
│   ├── src/
│   │   ├── pages/        # 6 page components
│   │   ├── components/   # Layout, etc.
│   │   ├── App.tsx       # Router setup
│   │   └── config.ts     # Network config
│   ├── package.json
│   └── vite.config.ts
├── PRESENTATION.md        # Presentation script (27 slides)
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

## Deployment

### Deploy Frontend (Vercel/Netlify)

**Vercel**:
```bash
npm run build
vercel --prod
```

**Netlify**:
```bash
npm run build
netlify deploy --prod --dir=dist
```

File `vercel.json` và `public/_redirects` đã cấu hình sẵn cho SPA routing.

## Roadmap

**Phase 1** (Current - MVP)
- Basic event creation and ticket minting
- Anti-scalping enforcement
- Dynamic state transitions
- Multi-page React UI

**Phase 2** (Future)
- Email/SMS notifications cho check-in
- Analytics dashboard cho organizers
- Ticket transfer marketplace UI
- Secondary market với automatic royalty

**Phase 3** (Advanced)
- Multi-event support per organizer
- Dynamic NFT image generation API
- Mobile app (React Native)
- Integration với payment gateways

## Contributing

Pull requests welcome. Major changes, please open issue first.

## License

MIT License - Free to use and modify

## Credits

Built for **TechNova Sui Hackathon 2026**

---

For detailed presentation script, see [PRESENTATION.md](PRESENTATION.md)
