# Dynamic Ticketing System - Kịch bản Trình bày

---

## Slide 1: Giới thiệu dự án

### Dynamic Ticketing System
**Hệ thống bán vé NFT chống phe vé trên Sui Blockchain**

**Thông tin dự án:**
- Platform: Sui Network Testnet
- Smart Contract: Move Language
- Frontend: React + TypeScript + Vite
- Package ID: `0xe4c711b73e4ef93b4afb440e42bbee5db90a1028f91ce75d700be44b813b87e9`

**Mục tiêu:** Xây dựng hệ thống bán vé minh bạch, chống phe vé và bảo vệ quyền lợi người mua.

---

## Slide 2: Vấn đề cần giải quyết

### Thực trạng thị trường vé hiện nay

**Các vấn đề nghiêm trọng:**
1. **Phe vé hoành hành** - Mua nhiều vé rồi bán lại với giá gấp 2-3 lần
2. **Gian lận vé** - Vé giả, vé trùng lặp
3. **Không minh bạch** - Người mua không biết vé đã qua bao nhiêu tay
4. **Thiếu bảo vệ** - Không có cơ chế hoàn tiền khi sự kiện bị hủy
5. **Khó quản lý** - Nhà tổ chức khó kiểm soát việc bán vé

**Hệ quả:**
- Người hâm mộ thật không mua được vé
- Giá vé tăng phi lý
- Mất niềm tin vào hệ thống

---

## Slide 3: Giải pháp của chúng tôi

### Dynamic Ticketing trên Blockchain

**Công nghệ Blockchain giải quyết:**
1. **NFT Tickets** - Mỗi vé là một NFT độc nhất
2. **Chống phe vé** - Giới hạn số lượng vé/địa chỉ ví
3. **Minh bạch tuyệt đối** - Mọi giao dịch được ghi lại trên blockchain
4. **Hoàn tiền tự động** - Smart contract xử lý hoàn tiền khi hủy
5. **Check-in điện tử** - Xác thực vé tức thời

**Lợi ích:**
- ✅ Giá cố định, không thể thổi giá
- ✅ Vé xác thực 100%, không giả mạo
- ✅ Bảo vệ người mua hợp pháp
- ✅ Tự động hóa toàn bộ quy trình

---

## Slide 4: Kiến trúc hệ thống

### Tech Stack

**Blockchain Layer:**
```
Sui Network (Testnet)
├── Move Smart Contract (1060 lines)
├── Package ID: 0xe4c7...b87e9
└── Version: 4 (deployed)
```

**Frontend Layer:**
```
React 18.3.1 + TypeScript 5.2.2
├── Routing: React Router DOM v7
├── Sui SDK: @mysten/sui ^1.17.0
├── DApp Kit: @mysten/dapp-kit ^0.14.30
└── Build: Vite 5.4.21
```

**Architecture:**
- Multi-page SPA với 6 main routes
- Responsive layout với sidebar navigation
- Real-time blockchain data fetching
- Optimistic UI updates

---

## Slide 5: Smart Contract - Core Entities

### Cấu trúc dữ liệu chính

**1. EventConfig (Shared Object)**
```move
struct EventConfig has key, store {
    id: UID,
    organizer: address,        // Người tổ chức
    name: String,              // Tên sự kiện
    description: String,       // Mô tả
    venue: String,             // Địa điểm
    event_time: u64,           // Thời gian (timestamp)
    original_price: u64,       // Giá vé (SUI)
    total_tickets: u64,        // Tổng số vé
    sold_tickets: u64,         // Số vé đã bán
    is_cancelled: bool         // Trạng thái hủy
}
```

**2. Ticket (NFT Object)**
```move
struct Ticket has key, store {
    id: UID,
    event_id: ID,              // ID sự kiện
    ticket_number: u64,        // Số vé
    owner: address,            // Chủ sở hữu
    original_price: u64,       // Giá gốc
    state: u8                  // 0: Pending, 1: Checked-in, 2: Commemorative
}
```

**3. WaitingList (Dynamic Field)**
- Lưu danh sách chờ khi vé hết
- Tự động chuyển vé khi có hoàn tiền

---

## Slide 6: Smart Contract - Key Functions (1)

### Chức năng người tổ chức

**1. Tạo sự kiện**
```move
public entry fun create_event(
    name: String,
    description: String,
    venue: String,
    event_time: u64,
    original_price: u64,
    total_tickets: u64,
    ctx: &mut TxContext
)
```
- Tạo EventConfig (shared object)
- Tạo TransferPolicy cho vé
- Emit event creation

**2. Hủy sự kiện**
```move
public entry fun cancel_event(
    event: &mut EventConfig,
    ctx: &TxContext
)
```
- Chỉ organizer có quyền hủy
- Đánh dấu is_cancelled = true
- Người mua có thể hoàn tiền

**3. Check-in vé**
```move
public entry fun check_in_ticket(
    ticket: &mut Ticket,
    event: &EventConfig,
    ctx: &TxContext
)
```
- Organizer hoặc owner check-in
- Chuyển state từ Pending → Checked-in

---

## Slide 7: Smart Contract - Key Functions (2)

### Chức năng người mua

**1. Mua vé**
```move
public entry fun mint_ticket(
    event: &mut EventConfig,
    payment: Coin<SUI>,
    ctx: &mut TxContext
)
```
- Kiểm tra còn vé + giá đúng
- Tạo Ticket NFT
- Transfer payment cho organizer
- Tăng sold_tickets

**2. Hoàn tiền**
```move
public entry fun refund_ticket(
    ticket: Ticket,
    event: &mut EventConfig,
    ctx: &mut TxContext
)
```
- Chỉ khi sự kiện bị hủy
- Destroy ticket NFT
- Hoàn lại SUI cho owner
- **Giảm sold_tickets** (anti-scalping)

**3. Chuyển đổi thành vé kỷ niệm**
```move
public entry fun transform_to_commemorative(
    ticket: &mut Ticket,
    event: &EventConfig,
    ctx: &TxContext
)
```
- Sau khi check-in
- State → Commemorative
- Giữ làm kỷ niệm (không bán được)

---

## Slide 8: Frontend - Routing Architecture

### 6 Main Routes + 2 Detail Views

**Public Routes:**
```
/ (BrowsePage)
├── Khám phá tất cả sự kiện
├── Grid layout với event cards
└── Buy ticket button
```

**Authenticated Routes:**
```
/my-tickets (MyTicketsPage)
├── Danh sách vé đã mua
├── Check-in button (for users)
├── Transform to commemorative
└── Refund (nếu event cancelled)

/my-events (MyEventsPage)
├── Quản lý sự kiện đã tạo
├── Nút "Xem chi tiết" → /event/:id
└── Nút "Tạo sự kiện mới"

/create-event (CreateEventPage)
├── Form tạo sự kiện mới
└── Validation + transaction

/user-info (UserInfoPage)
├── Thống kê cá nhân
└── Hiển thị SUI balance
```

**Detail Routes:**
```
/event/:eventId (EventDetailPage)
├── Tab 1: Tổng quan (stats + info)
├── Tab 2: Check-in (form check-in)
└── Tab 3: Danh sách vé (table)
```

---

## Slide 9: Frontend - UI/UX Design

### Thiết kế hiện đại, không emoji

**Design System:**
- **Color Scheme:** Dark theme (#0f172a)
- **Glassmorphism:** backdrop-filter blur effects
- **Gradients:** Linear gradients cho buttons/cards
- **No Emojis:** Professional look (theo yêu cầu)

**Component Highlights:**

1. **Sidebar Navigation**
   - Fixed 280px width
   - Active state highlighting
   - React Router Link integration

2. **Event Cards**
   - Status badge (Đang bán/Đã diễn ra)
   - Progress bars cho sold percentage
   - Gradient backgrounds theo loại

3. **Buttons**
   - Create Event: Gradient blue-purple-pink
   - Check-in: Gradient pink with shadow
   - Standard: Blue gradient

4. **Statistics Cards**
   - Color-coded (blue, green, yellow, pink)
   - Large font-weight 800 numbers
   - Uppercase labels

---

## Slide 10: Tính năng nổi bật (1)

### 1. Anti-Scalping Mechanism

**Vấn đề:** Phe vé mua hết vé rồi bán lại giá cao

**Giải pháp của chúng tôi:**
```move
// Khi hoàn tiền, giảm sold_tickets
event.sold_tickets = event.sold_tickets - 1;

// Vé được mở lại cho người khác mua
if (event.sold_tickets < event.total_tickets) {
    // Còn vé để bán
}
```

**Flow:**
1. Phe vé mua 100 vé → sold_tickets = 100
2. Không bán được, xin hoàn tiền → sold_tickets = 99
3. Người thật có thể mua vé ở giá gốc
4. **Phe vé không lời, bị thua phí gas!**

**Kết quả:** Chống hoàn toàn việc thổi giá vé

---

## Slide 11: Tính năng nổi bật (2)

### 2. Check-in & Commemorative Ticket

**Ticket Lifecycle:**
```
PENDING (0) → CHECKED_IN (1) → COMMEMORATIVE (2)
```

**Check-in Process:**
1. Organizer/Owner quét Ticket ID
2. Smart contract verify ownership
3. State → CHECKED_IN
4. Không thể bán/transfer nữa

**Transform to Commemorative:**
- Sau khi check-in thành công
- User chuyển vé thành kỷ niệm
- Giống như "huy hiệu" kỹ thuật số
- Giữ mãi mãi trong ví

**Use case:** Vé concert, event đặc biệt muốn lưu làm kỷ niệm

---

## Slide 12: Tính năng nổi bật (3)

### 3. Automatic Refund

**Scenario:** Sự kiện bị hủy

**Old System Problems:**
- Phải liên hệ BTC để hoàn tiền
- Chờ đợi lâu, thủ tục phức tạp
- Có thể bị lừa đảo

**Our Solution:**
```move
public entry fun cancel_event(event: &mut EventConfig) {
    event.is_cancelled = true;
}

public entry fun refund_ticket(ticket: Ticket, event: &mut EventConfig) {
    assert!(event.is_cancelled, ERROR_EVENT_NOT_CANCELLED);
    // Hoàn tiền tự động
    transfer::public_transfer(coin::take(...), ticket.owner);
}
```

**Benefits:**
- ✅ Tự động, không cần liên hệ
- ✅ Hoàn tiền 100% giá gốc
- ✅ Xử lý trong vài giây
- ✅ Minh bạch trên blockchain

---

## Slide 13: Demo Flow - User Journey

### Người mua vé

**1. Kết nối ví Sui Wallet**
- Click "Connect Wallet" trên header
- Chọn Sui Wallet extension
- Approve connection

**2. Duyệt sự kiện (Browse Page)**
- Xem danh sách sự kiện đang bán
- Filter theo status: Upcoming/Past
- Xem thông tin: giá, địa điểm, thời gian

**3. Mua vé**
- Click "Mua vé" trên event card
- Confirm transaction trong Sui Wallet
- Chờ transaction confirmed (~2s)
- Vé NFT xuất hiện trong "Vé của tôi"

**4. Quản lý vé (My Tickets Page)**
- Xem tất cả vé đã mua
- Countdown đến ngày sự kiện
- Check-in (nếu đến event)
- Transform → Commemorative (sau check-in)

**5. Hoàn tiền (nếu cần)**
- Nếu event bị cancel
- Click "Hoàn tiền" trên ticket card
- Nhận lại SUI tự động

---

## Slide 14: Demo Flow - Organizer Journey

### Người tổ chức sự kiện

**1. Tạo sự kiện (Create Event)**
- Navigate to "Quản lý sự kiện"
- Click "Tạo sự kiện mới"
- Điền form:
  - Tên sự kiện
  - Mô tả
  - Địa điểm
  - Thời gian (datetime picker)
  - Giá vé (SUI)
  - Số lượng vé
- Submit → Transaction
- Event xuất hiện trong My Events

**2. Quản lý sự kiện (My Events Page)**
- Xem list events đã tạo
- Status badge: Đang bán/Đã diễn ra
- Progress bar: % vé đã bán
- Click "Xem chi tiết" → Event Detail Page

**3. Xem chi tiết (Event Detail Page)**

**Tab "Tổng quan":**
- Thông tin sự kiện đầy đủ
- 4 stat cards: Tổng vé, Đã bán, Còn lại, Check-in
- Progress bar bán vé
- Doanh thu ước tính (SUI)
- Biểu đồ trạng thái vé (Pending/Checked-in/Commemorative)

**Tab "Check-in":**
- Input: Ticket ID
- Button "Check-in ngay" (gradient pink)
- Verify & update state

**Tab "Danh sách vé":**
- Table hiển thị tất cả vé đã bán
- Columns: Số vé, Owner address, Trạng thái
- Color-coded status badges

---

## Slide 15: Technical Highlights

### Những điểm kỹ thuật đáng chú ý

**1. Move Smart Contract**
- 1060 lines of code
- 4 versions deployed (iterative development)
- Dynamic fields cho waiting list
- Event emission cho indexing
- Transfer Policy cho NFT marketplace

**2. React Frontend**
- Type-safe với TypeScript
- React Router v7 cho routing
- @mysten/dapp-kit integration
- SuiClient cho balance/transactions
- Optimistic updates

**3. State Management**
- React hooks (useState, useEffect)
- Real-time data sync với blockchain
- Retry logic cho transaction indexing
- Loading states cho UX

**4. Deployment**
- Vite build → static files
- Vercel/Netlify ready
- _redirects cho SPA routing
- 640KB bundle (optimized)

---

## Slide 16: Security Features

### Bảo mật đa lớp

**Smart Contract Level:**
1. **Ownership checks** - Chỉ owner/organizer thực hiện actions
2. **State validation** - Kiểm tra state hợp lệ
3. **Payment verification** - Verify đúng số tiền
4. **Event cancellation** - Chỉ organizer hủy event
5. **Reentrancy protection** - Move's ownership model

**Frontend Level:**
1. **Wallet connection** - Sui Wallet authentication
2. **Transaction signing** - User phải approve mọi action
3. **Input validation** - Form validation trước khi submit
4. **Error handling** - Graceful error messages

**Blockchain Level:**
1. **Immutable records** - Không thể sửa lịch sử
2. **Transparent transactions** - Public ledger
3. **Decentralized** - Không single point of failure

---

## Slide 17: Scalability & Performance

### Khả năng mở rộng

**Current Performance:**
- Transaction time: ~2 seconds
- Concurrent ticket sales: No limit (blockchain handles)
- Event capacity: Unlimited
- User capacity: Unlimited

**Optimization:**
1. **Parallel processing** - Sui parallel execution
2. **Dynamic fields** - Efficient storage
3. **Event indexing** - Fast query
4. **Lazy loading** - Frontend pagination

**Future Improvements:**
- Implement ticket marketplace
- Add QR code generation
- Mobile app (React Native)
- Integration with Sui Wallet mobile
- Secondary market với royalties

---

## Slide 18: Business Model

### Monetization Strategy

**Revenue Streams:**

1. **Platform Fee (2-3%)**
   - Mỗi giao dịch mua vé
   - Ví dụ: Vé 1 SUI → Fee 0.02 SUI

2. **Premium Features**
   - Advanced analytics cho organizer
   - Customizable event pages
   - Priority listing

3. **NFT Marketplace**
   - Commission từ secondary market
   - Royalties cho organizer

4. **Enterprise Solution**
   - White-label cho tổ chức lớn
   - Custom smart contracts
   - Dedicated support

**Cost Structure:**
- Gas fees: ~0.001 SUI/transaction
- Infrastructure: Minimal (decentralized)
- Marketing: Main cost

---

## Slide 19: Roadmap & Future Plans

### Q1 2026 - MVP ✅ (Completed)
- ✅ Smart contract v4 deployed
- ✅ Full-featured frontend
- ✅ Anti-scalping mechanism
- ✅ Check-in system
- ✅ Refund logic

### Q2 2026 - Enhancement
- [ ] Mobile app development
- [ ] QR code ticket system
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Mainnet deployment

### Q3 2026 - Marketplace
- [ ] Secondary ticket market
- [ ] Royalty system
- [ ] Bidding mechanism
- [ ] Price discovery

### Q4 2026 - Enterprise
- [ ] White-label solution
- [ ] API for partners
- [ ] Analytics dashboard
- [ ] Integration với ticketing platforms

---

## Slide 20: Competitive Advantages

### So sánh với đối thủ

**Traditional Systems (Ticketmaster, etc):**
- ❌ Centralized - Single point of failure
- ❌ Opaque pricing
- ❌ High fees (10-20%)
- ❌ No anti-scalping
- ❌ Fake tickets possible

**Other Blockchain Solutions:**
- ⚠️ No refund mechanism
- ⚠️ No anti-scalping built-in
- ⚠️ Complex UX
- ⚠️ High gas fees (Ethereum)

**Our Solution:**
- ✅ Decentralized & transparent
- ✅ Low fees (gas < 0.001 SUI)
- ✅ Built-in anti-scalping
- ✅ Automatic refunds
- ✅ User-friendly interface
- ✅ Fast transactions (2s)
- ✅ Commemorative tickets

---

## Slide 21: Impact & Metrics

### Tác động dự kiến

**For Event Organizers:**
- 📊 Tăng 30% revenue (không mất cho phe vé)
- ⏱️ Giảm 80% thời gian quản lý
- 🎯 Đảm bảo vé đến tay fan thật
- 📈 Analytics chi tiết real-time

**For Ticket Buyers:**
- 💰 Tiết kiệm 50% chi phí (giá gốc)
- 🛡️ 100% đảm bảo vé thật
- ⚡ Mua vé trong 30 giây
- 🔄 Hoàn tiền tự động nếu hủy

**For Industry:**
- 🚫 Loại bỏ phe vé
- 📊 Dữ liệu minh bạch
- 🌐 Tiêu chuẩn mới cho ticketing
- 💡 Innovation trong entertainment

---

## Slide 22: Technology Stack Summary

### Full Stack Overview

```
┌─────────────────────────────────────┐
│         Frontend Layer              │
│  React + TypeScript + React Router  │
│  @mysten/dapp-kit + @mysten/sui    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Blockchain Layer            │
│      Sui Network (Testnet)          │
│   Move Smart Contract (1060 LOC)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Data Layer                 │
│   EventConfig (Shared Objects)      │
│   Ticket NFTs (Owned Objects)       │
│   Dynamic Fields (Waiting List)     │
└─────────────────────────────────────┘
```

**Development Tools:**
- Sui CLI for deployment
- TypeScript for type safety
- Vite for fast builds
- VS Code + Copilot

---

## Slide 23: Demo Video/Screenshots

### Live Demo Points

**1. Kết nối Sui Wallet**
- [ ] Show extension installation
- [ ] Connect wallet flow
- [ ] Display connected address

**2. Browse & Buy Ticket**
- [ ] Navigate to Browse page
- [ ] Select an event
- [ ] Click "Mua vé"
- [ ] Approve transaction
- [ ] Show ticket in My Tickets

**3. Organizer Create Event**
- [ ] Go to Create Event
- [ ] Fill form with data
- [ ] Submit & confirm
- [ ] Show in My Events

**4. Check-in Demo**
- [ ] Go to Event Detail
- [ ] Switch to Check-in tab
- [ ] Input Ticket ID
- [ ] Click Check-in
- [ ] Show updated status

**5. Statistics View**
- [ ] Show Tổng quan tab
- [ ] Explain stat cards
- [ ] Progress bars
- [ ] Ticket states breakdown

---

## Slide 24: Team & Acknowledgments

### Development Team

**Project Lead & Developer:**
- Full-stack implementation
- Smart contract architecture
- Frontend design & implementation
- UI/UX optimization

**Technologies Used:**
- Sui Network & Move Language
- React + TypeScript ecosystem
- Modern web development tools

**Special Thanks:**
- Sui Foundation for documentation
- Move community for support
- Open source contributors

**Development Stats:**
- Timeline: Sprint-based development
- Smart Contract: 1060 lines Move
- Frontend: 2000+ lines TypeScript
- Iterations: 4 major versions

---

## Slide 25: Q&A Preparation

### Anticipated Questions

**Q: Tại sao chọn Sui thay vì Ethereum?**
A: 
- Gas fees thấp hơn 1000x (~0.001 SUI vs $10-50 ETH)
- Transaction nhanh hơn (2s vs 12s-5min)
- Move language an toàn hơn (ownership model)
- Parallel execution = scalability tốt hơn

**Q: Làm sao chống được phe vé hoàn toàn?**
A:
- Refund → giảm sold_tickets → vé mở lại
- Phe vé không lời vì phải trả gas
- Price cố định, không thể bán giá cao
- Waiting list tự động phân phối

**Q: Điều gì xảy ra nếu blockchain down?**
A:
- Sui là decentralized, rất khó down
- Validators phân tán toàn cầu
- Data replicated across nodes
- Frontend có thể cache local

**Q: Chi phí vận hành như thế nào?**
A:
- Gas fees: ~0.001 SUI/tx (rất rẻ)
- No server costs (decentralized)
- Frontend hosting: ~$10/month
- Scalable với volume

---

## Slide 26: Call to Action

### Next Steps

**For Investors:**
- 💼 Seed round opening Q2 2026
- 📊 Revenue projections available
- 🎯 Target: 10,000 events in Year 1
- 🚀 Expansion to multiple blockchains

**For Partners:**
- 🤝 Integration opportunities
- 🎪 Event organizers pilot program
- 🎫 White-label solutions
- 📱 Mobile app collaboration

**For Users:**
- 🎉 Beta testing on Testnet (NOW!)
- 🎁 Early adopter benefits
- 📢 Feedback welcomed
- 🌟 Join our community

**Contact:**
- 📧 Email: [your-email]
- 🐦 Twitter: @DynamicTicketing
- 💬 Discord: [invite-link]
- 🌐 Website: [coming soon]

---

## Slide 27: Conclusion

### Transforming the Ticketing Industry

**What We Built:**
- ✅ Fully functional decentralized ticketing platform
- ✅ Anti-scalping smart contract mechanism
- ✅ User-friendly frontend application
- ✅ Automated refund system
- ✅ NFT-based ticket ownership

**What We Achieve:**
- 🎯 Fair ticket distribution
- 💰 Transparent pricing
- 🛡️ Fraud prevention
- ⚡ Instant transactions
- 🌍 Accessible to everyone

**Vision:**
> "Making event ticketing fair, transparent, and secure for everyone through blockchain technology"

**The Future is Decentralized. The Future is Now.**

---

## Appendix: Technical Documentation

### Smart Contract Functions Reference

**Public Entry Functions:**
```move
// Event Management
create_event(name, description, venue, event_time, original_price, total_tickets)
cancel_event(event)

// Ticket Operations  
mint_ticket(event, payment)
refund_ticket(ticket, event)
check_in_ticket(ticket, event)
transform_to_commemorative(ticket, event)

// Waiting List
join_waiting_list(event, payment)
process_waiting_list_refund(event, waiting_list_id)
```

**View Functions:**
```move
get_event_info(event): EventConfig
get_ticket_info(ticket): Ticket
is_event_cancelled(event): bool
get_sold_tickets(event): u64
```

### Frontend Routes Reference

```typescript
Routes:
/ - BrowsePage
/my-tickets - MyTicketsPage  
/my-events - MyEventsPage
/create-event - CreateEventPage
/user-info - UserInfoPage
/event/:eventId - EventDetailPage (3 tabs)
```

### API Endpoints (SuiClient)

```typescript
// Query events
queryEvents({ query: { MoveEventType } })

// Get objects
getObject({ id, options })

// Transactions
signAndExecuteTransaction({ transaction })

// Balance
getBalance({ owner, coinType })
```

---

## END

**Thank you for your attention!**

*Dynamic Ticketing System - Built with ❤️ on Sui*
