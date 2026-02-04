# 🎫 Dynamic Ticketing - Hệ thống vé NFT chống phe vé

[![Sui Network](https://img.shields.io/badge/Sui-Network-blue)](https://sui.io)
[![Move Language](https://img.shields.io/badge/Move-Language-orange)](https://github.com/move-language/move)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)

Hệ thống bán vé NFT động trên Sui Blockchain với tính năng chống phe vé và thay đổi trạng thái tự động.

> **🏆 Built for TechNova Sui Hackathon 2026**

## 📖 Quick Links

- **[🚀 Quick Start](#-hướng-dẫn-deploy)** - Get started in 5 minutes
- **[📚 Full Documentation](COMPLETE.md)** - Complete guide
- **[🎬 Demo Script](DEMO_SCRIPT.md)** - Presentation guide
- **[🏗️ Architecture](ARCHITECTURE.md)** - System design
- **[✅ Checklist](CHECKLIST.md)** - Pre-demo verification

## 🌟 Tính năng chính

### 1. **Chống Phe Vé (Anti-Scalping)**
- Sử dụng **Sui Kiosk** để áp đặt luật: Không được bán lại vé cao hơn giá gốc
- Ngăn chặn hoàn toàn nạn "phe vé" đầu cơ

### 2. **Dynamic State - Vé Thay Đổi Trạng Thái**

#### 🕐 Trước sự kiện (PENDING)
- Hiển thị **QR Code** để check-in
- **Countdown** đếm ngược thời gian
- Hình ảnh: Vé chờ với màu tím gradient

#### ✅ Khi Check-in (CHECKED_IN)
- Tự động chuyển hình ảnh sang "Đã Sử Dụng"
- Tránh lừa đảo dùng lại vé
- Hình ảnh: Vé xanh với dấu tick

#### 🏆 Sau sự kiện (COMMEMORATIVE)
- Chuyển thành **POAP** (Proof of Attendance Protocol)
- Huy hiệu kỷ niệm đẹp mắt để sưu tầm
- Hình ảnh: Badge vàng cam với icon trophy

### 3. **Dynamic Fields**
- Metadata thay đổi real-time
- QR Code động
- Timestamp cập nhật tự động

## 🏗️ Kiến trúc

### Smart Contract (Move)
```
sources/
└── dynamic_ticket.move    # Main contract với Sui Kiosk integration
```

**Key Components:**
- `EventConfig`: Quản lý thông tin sự kiện
- `Ticket`: NFT vé với dynamic fields
- `TicketMetadata`: Metadata động thay đổi theo state
- Anti-scalping policy với Kiosk

### Frontend (TypeScript + React)
```
client/
├── src/
│   ├── components/
│   │   ├── TicketCard.tsx        # Card hiển thị vé
│   │   ├── EventCard.tsx         # Card sự kiện
│   │   └── CreateEventForm.tsx   # Form tạo event
│   ├── services/
│   │   └── ticketingService.ts   # SDK tương tác với contract
│   ├── types/
│   │   └── ticket.ts             # TypeScript types
│   └── config/
│       └── constants.ts          # Config & constants
```

## 🚀 Hướng dẫn Deploy

### Bước 1: Deploy Smart Contract

```bash
# Di chuyển vào thư mục gốc
cd /Users/sakai/VIET_Working/APP_WORK/sui-hackathon-technova

# Build contract
sui move build

# Deploy lên testnet
sui client publish --gas-budget 100000000

# Lưu lại PACKAGE_ID từ kết quả deploy
```

### Bước 2: Cập nhật Package ID

Sau khi deploy, cập nhật `PACKAGE_ID` trong file:
```typescript
// client/src/config/constants.ts
export const PACKAGE_ID = '0x...'; // Paste package ID ở đây
```

### Bước 3: Setup Frontend

```bash
# Di chuyển vào thư mục client
cd client

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📖 Cách sử dụng

### Cho Organizer (Người tổ chức sự kiện)

1. **Kết nối Sui Wallet**
2. **Tạo sự kiện mới:**
   - Click tab "➕ Tạo sự kiện"
   - Điền thông tin: Tên, thời gian, giá vé, số lượng, địa điểm
   - Giá vé tính bằng MIST (1 SUI = 1,000,000,000 MIST)
3. **Check-in vé:**
   - Khi khách tới sự kiện, scan QR code
   - Click "✓ Check-in vé này" để đánh dấu đã sử dụng

### Cho Người mua vé

1. **Kết nối Sui Wallet**
2. **Mua vé:**
   - Tab "📅 Sự kiện" → Chọn sự kiện
   - Click "🎫 Mua vé ngay"
   - Xác nhận giao dịch trong wallet
3. **Xem vé của bạn:**
   - Tab "🎫 Vé của tôi"
   - Thấy QR code và countdown
4. **Sau sự kiện:**
   - Sau 24h, vé có thể chuyển thành huy hiệu kỷ niệm
   - Click "🏆 Chuyển thành huy hiệu kỷ niệm"

## 🛡️ Anti-Scalping Features

### 1. Price Cap với Kiosk
```move
public entry fun list_ticket_in_kiosk(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    ticket: Ticket,
    price: u64,
) {
    // Kiểm tra giá không vượt quá giá gốc
    assert!(price <= ticket.original_price, EPriceExceedsOriginal);
    kiosk::place(kiosk, cap, ticket);
}
```

### 2. Transfer Policy
- Tạo policy ngăn chặn transfer không hợp lệ
- Chỉ cho phép resale ≤ giá gốc

## 🎯 Tại sao giải pháp này thắng?

### 1. **Giải quyết vấn đề thực tế**
- Nạn phe vé là vấn đề lớn tại Việt Nam
- Chứng minh khả năng ứng dụng blockchain vào đời sống

### 2. **Showcase Sui's Unique Features**
- **Sui Kiosk**: Policy enforcement không thể bypass
- **Dynamic Fields**: Metadata thay đổi on-chain
- **Object Model**: Vé là owned object, dễ quản lý

### 3. **UX tuyệt vời**
- Vé "sống" - thay đổi theo thời gian
- QR Code tự động
- POAP làm kỷ niệm

### 4. **Technical Excellence**
- Clean Move code
- Type-safe TypeScript
- Modern React UI

## 📊 Demo Flow

```
1. Organizer tạo sự kiện "TechNova 2026"
   └─> EventConfig được tạo (shared object)

2. User A mua vé
   └─> Ticket NFT được mint
   └─> State: PENDING
   └─> Hiển thị QR Code + Countdown

3. Ngày sự kiện, User A tới venue
   └─> Organizer scan QR, click Check-in
   └─> State: CHECKED_IN
   └─> Hình ảnh đổi sang "Đã sử dụng"

4. Sau sự kiện 24h
   └─> User A transform vé
   └─> State: COMMEMORATIVE
   └─> Thành POAP badge đẹp mắt
```

## 🔧 Tech Stack

- **Blockchain**: Sui Network (Testnet)
- **Smart Contract**: Move Language
- **Frontend**: React 18 + TypeScript
- **Sui SDK**: @mysten/sui.js, @mysten/dapp-kit
- **UI**: Custom CSS với gradient đẹp
- **QR Code**: qrcode library
- **Date**: date-fns

## 📝 Contract Functions

### Public Entry Functions
- `create_event()`: Tạo sự kiện mới
- `mint_ticket()`: Mua vé (với payment check)
- `check_in_ticket()`: Check-in vé (chỉ organizer)
- `transform_to_commemorative()`: Chuyển thành POAP
- `list_ticket_in_kiosk()`: List vé với price cap

### View Functions
- `get_ticket_state()`: Lấy state hiện tại
- `get_ticket_metadata()`: Lấy metadata động
- `get_event_info()`: Thông tin sự kiện

## 🎨 UI Features

- **Gradient Background**: Purple to violet
- **Responsive Cards**: Grid layout tự động
- **Real-time Countdown**: Cập nhật mỗi giây
- **QR Code**: Generate tự động cho mỗi vé
- **State Badges**: Màu khác nhau cho từng state
- **Progress Bar**: Hiển thị % vé đã bán

## 🚨 Error Handling

Contract có các error codes rõ ràng:
- `ENotEventOrganizer`: Không phải organizer
- `EEventNotStarted`: Sự kiện chưa bắt đầu
- `ETicketAlreadyUsed`: Vé đã được sử dụng
- `EPriceExceedsOriginal`: Giá vượt quá giá gốc

## 🌐 Network Config

Default: **Sui Testnet**
- RPC: https://fullnode.testnet.sui.io:443
- Explorer: https://suiexplorer.com/?network=testnet

## 📦 Dependencies

### Smart Contract
- Sui Framework (testnet branch)

### Frontend
```json
{
  "@mysten/sui.js": "^0.54.0",
  "@mysten/dapp-kit": "^0.14.0",
  "react": "^18.2.0",
  "qrcode": "^1.5.3",
  "date-fns": "^3.0.0"
}
```

## 🎓 Học từ dự án này

1. **Sui Kiosk**: Cách enforce policies on-chain
2. **Dynamic Fields**: Thay đổi metadata mà không cần migrate
3. **Object Ownership**: Quản lý NFT an toàn
4. **Event System**: Emit events để frontend track
5. **Clock Object**: Sử dụng thời gian on-chain

## 🔮 Roadmap

- [ ] Implement Kiosk marketplace UI
- [ ] Add NFT image generation API
- [ ] Support multiple events per organizer
- [ ] Email notifications cho check-in
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Ticket transfer history
- [ ] Secondary market với royalty

## 👥 Credits

Built for **TechNova Sui Hackathon 2026**

## 📄 License

MIT License - Feel free to use and modify!

---

**Chúc may mắn với hackathon! 🚀**
