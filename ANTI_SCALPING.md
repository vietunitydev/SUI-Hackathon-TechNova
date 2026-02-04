# 🛡️ Anti-Scalping Mechanism - Waitlist System

## 🎯 Vấn Đề Cốt Lõi

**Phe vé hoạt động như thế nào?**

```
Scalper (Phe vé)    ←→    Buyer B (Người mua)
      ↓                           ↓
  Thỏa thuận:              Trả tiền mặt:
  "Tôi bán vé cho ông"     5,000,000 VND
  "Ông trả 5 triệu"        (giá gốc: 1 triệu)
```

**Vấn đề**: Scalper và Buyer B có thể thỏa thuận ngoài hệ thống!

---

## ✨ Giải Pháp: Phá Vỡ Thỏa Thuận

### Nguyên Lý Cốt Lõi

> **"Người bán KHÔNG được chọn người mua, và người mua KHÔNG biết mình mua của ai"**

### Cách Hoạt Động

```
┌─────────────────────────────────────────────────────────┐
│                   WAITLIST SYSTEM                       │
└─────────────────────────────────────────────────────────┘

Step 1: Users Join Waitlist (Hàng chờ)
────────────────────────────────────────
User A: "Tôi muốn mua vé nếu có"
User B: "Tôi cũng muốn"
User C: "Tôi cũng muốn"

Queue: [A, B, C]  ← FIFO (First In, First Out)


Step 2: Scalper Tries to Sell
────────────────────────────────────────
Scalper: "Tôi muốn bán vé này"
System: "OK, nhưng ông KHÔNG thể chọn người mua!"


Step 3: System Auto-Matches
────────────────────────────────────────
System: 
  1. Lấy vé từ Scalper
  2. Hoàn tiền giá gốc cho Scalper
  3. Pop người ĐẦU TIÊN từ queue
  4. Transfer vé cho người đó

Result: Vé → User A (không phải người Scalper muốn!)
```

---

## 🔥 Tại Sao Phe Vé "Chết"?

### Scenario: Scalper vs Buyer B

```
┌──────────────────────────────────────────────────────────┐
│  SCALPER MUỐN BÁN CHO ONG B VỚI GIÁ CAO                 │
└──────────────────────────────────────────────────────────┘

Step 1: Scalper nói với ông B
─────────────────────────────
Scalper: "Tôi có vé, ông trả 5 triệu tiền mặt"
Ông B: "OK, deal!"


Step 2: Ông B chuyển 5 triệu
─────────────────────────────
Ông B → Scalper: 5,000,000 VND (tiền mặt/chuyển khoản)


Step 3: Scalper cố chuyển vé
─────────────────────────────
Scalper calls: sell_back_ticket()

❌ KHÔNG CÓ THAM SỐ "recipient"!
❌ Scalper KHÔNG THỂ chỉ định ông B!


Step 4: Hệ thống auto-match
─────────────────────────────
System:
  - Lấy vé từ Scalper
  - Refund 1 triệu cho Scalper (giá gốc)
  - Pop người ĐẦU TIÊN từ waitlist
  
Queue: [User A, User C, ...]  ← Ông B không ở đầu!

Vé → User A (ngẫu nhiên, không phải ông B!)


Step 5: Kết Quả
─────────────────────────────
✅ User A: Có vé (giá gốc)
❌ Ông B: Mất 5 triệu, KHÔNG CÓ VÉ!
💸 Scalper: Chỉ nhận lại 1 triệu (lỗ 4 triệu!)

=> Ông B SẼ KHÔNG BAO GIỜ TIN SCALPER NỮA!
```

---

## 💻 Implementation trong Smart Contract

### Struct: WaitingList

```move
public struct WaitingList has key, store {
    id: UID,
    event_id: ID,
    queue: vector<address>,   // FIFO queue
}
```

### Function: join_waitlist

```move
public entry fun join_waitlist(
    waitlist: &mut WaitingList,
    ctx: &mut TxContext
) {
    let user = tx_context::sender(ctx);
    
    // Kiểm tra chưa trong waitlist
    assert!(!vector::contains(&waitlist.queue, &user), EAlreadyInWaitlist);
    
    // Thêm vào CUỐI hàng chờ
    vector::push_back(&mut waitlist.queue, user);
}
```

### Function: sell_back_ticket (KEY FUNCTION!)

```move
public entry fun sell_back_ticket(
    ticket: Ticket,
    waitlist: &mut WaitingList,
    event_config: &EventConfig,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let seller = tx_context::sender(ctx);
    
    // 1. Kiểm tra hợp lệ
    assert!(ticket.state == STATE_PENDING, ECannotSellCheckedInTicket);
    assert!(vector::length(&waitlist.queue) > 0, EWaitlistEmpty);
    
    // 2. Lấy người ĐẦU TIÊN trong hàng chờ
    let buyer = vector::remove(&mut waitlist.queue, 0);  // ← KEY!
    //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //           Seller KHÔNG THỂ chọn buyer!
    
    // 3. Hoàn tiền cho seller (giá gốc)
    let refund = coin::split(&mut payment, ticket.original_price, ctx);
    transfer::public_transfer(refund, seller);
    
    // 4. Transfer vé cho buyer (người đầu hàng chờ)
    transfer::public_transfer(ticket, buyer);
    //                                 ^^^^^
    //                                 KHÔNG phải người seller muốn!
}
```

**CHÚ Ý KEY POINT:**
- Không có parameter `recipient`!
- Buyer được chọn tự động: `vector::remove(&mut waitlist.queue, 0)`
- Seller không thể can thiệp!

---

## 🎯 So Sánh Với Các Giải Pháp Khác

### ❌ Giải pháp 1: Price Cap Only (Kiosk)

```
Scalper lists vé với giá ≤ giá gốc
↓
Ông B: "OK, tôi mua"
↓
✅ Scalper vẫn bán được, nhưng không lời
```

**Vấn đề**: Scalper vẫn có thể thỏa thuận ngoài:
- Ông B trả 5 triệu tiền mặt
- Scalper list vé giá gốc
- Ông B mua (fast execution)
- Scalper lời 4 triệu!

### ❌ Giải pháp 2: KYC/Whitelist

```
Only người trong whitelist mới mua được
```

**Vấn đề**:
- Scalper tạo nhiều account
- Bất tiện cho user thật
- Không scale được

### ✅ Giải pháp 3: Waitlist System (CỦA CHÚNG TA!)

```
Người bán → Hệ thống → Người mua ngẫu nhiên
```

**Ưu điểm**:
- ✅ Phá vỡ hoàn toàn thỏa thuận
- ✅ Không cần KYC phức tạp
- ✅ Fair cho tất cả users
- ✅ Enforce on-chain (không bypass được)

---

## 📊 User Flow

### Flow 1: Mua Vé Mới (Primary Sale)

```
1. User → "Mua vé"
2. Pay giá gốc → Event organizer
3. Nhận vé NFT
4. ✅ Sở hữu vé
```

### Flow 2: Tham Gia Waitlist

```
1. User → "Join Waitlist"
2. System thêm vào queue: [A, B, C, User]
3. User chờ vé resale
```

### Flow 3: Bán Vé Lại (Resale)

```
1. Owner → "Sell Back"
2. System:
   a. Nhận vé từ Owner
   b. Refund giá gốc cho Owner
   c. Pop User A từ queue
   d. Transfer vé → User A
3. ✅ User A có vé
   ✅ Owner nhận lại tiền
```

### Flow 4: Scalper Bị Chặn

```
1. Scalper mua 100 vé
2. Scalper nói với Ông B: "Trả 5 triệu mua vé"
3. Ông B: "OK" → Chuyển 5 triệu
4. Scalper → "Sell Back"
5. System:
   a. Vé → User A (người đầu waitlist)
   b. Scalper nhận lại giá gốc
6. ❌ Ông B mất 5 triệu, KHÔNG có vé!
7. ❌ Scalper lỗ (mua giá gốc, bán giá gốc)
```

**Result**: Ông B học được bài học, không bao giờ trust Scalper nữa!

---

## 🔐 Security Considerations

### Attack Vector 1: Scalper tạo nhiều account fake

**Attack**:
```
Scalper tạo 100 accounts
→ Join waitlist với 100 accounts
→ Khi bán vé, vé rơi vào tay account của chính mình
```

**Defense**:
```
Option 1: Require deposit khi join waitlist
  - User phải stake 0.1 SUI để join
  - Nếu không mua khi đến lượt → Mất deposit
  
Option 2: Lottery system
  - Không phải FIFO thuần
  - Random từ top 10 người trong queue
  - Scalper không biết account nào được chọn

Option 3: Reputation system
  - Track lịch sử mua vé
  - Prioritize users với lịch sử tốt
```

### Attack Vector 2: Front-running

**Attack**:
```
Scalper xem mempool
→ Thấy có người sell_back_ticket
→ Nhanh chóng join_waitlist trước
```

**Defense**:
```
✅ Sui's parallel execution
  - Transactions không thấy mempool
  - Front-running rất khó

✅ Require join waitlist TRƯỚC sự kiện
  - Không cho join khi event đã gần
```

---

## 📈 Benefits

### For Fans (Người hâm mộ)

✅ **Fair Access**: Ai cũng có cơ hội như nhau  
✅ **No Scalping**: Không bị chặt chém  
✅ **Transparent**: Thấy vị trí trong hàng chờ  
✅ **Safe**: Không rủi ro bị lừa

### For Organizers

✅ **Control**: Giữ được giá vé  
✅ **Reputation**: Fans hài lòng  
✅ **Data**: Track được resale patterns  
✅ **Revenue**: Có thể thu phí resale

### For Platform

✅ **Differentiation**: Unique value proposition  
✅ **Network Effect**: Càng nhiều user, càng fair  
✅ **Monetization**: Phí transaction resale  
✅ **Tech Showcase**: Demo Sui capabilities

---

## 🎯 Why This Wins Hackathon

### 1. Solves Real Problem

❌ **Old**: Phe vé kiếm hàng tỷ đồng mỗi năm  
✅ **New**: Phe vé KHÔNG KIẾM ĐƯỢC GÌ

### 2. Novel Approach

❌ **Others**: Price cap, KYC, whitelist  
✅ **Ours**: Phá vỡ thỏa thuận bằng waitlist

### 3. Sui-Specific

❌ **Ethereum**: Gas cao, slow  
✅ **Sui**: Fast, cheap, parallel execution

### 4. Complete Implementation

✅ Smart contract working  
✅ Frontend with waitlist UI  
✅ End-to-end tested  
✅ Well-documented

### 5. Business Viable

✅ Market: $100M+ ticketing in Vietnam  
✅ Model: 2-5% fee on resale  
✅ Scalable: Works for any event  
✅ Partners: Easy to onboard venues

---

## 📝 Demo Script Addition

Thêm vào demo:

```
[After showing check-in]

"Bây giờ tôi demo tính năng QUAN TRỌNG NHẤT - Chống phe vé!"

1. [Show waitlist]
   "User C muốn mua vé. Nhưng vé đã hết."
   "User C join waitlist."
   
2. [Show current owner wants to sell]
   "User B không đi được, muốn bán vé."
   "User B click 'Sell Back'"
   
3. [Show transaction]
   "Lưu ý: User B KHÔNG THỂ chọn người mua!"
   "Hệ thống tự động transfer cho người đầu waitlist."
   
4. [Show result]
   "Vé tự động chuyển cho User C!"
   "User B nhận lại giá gốc."
   
5. [Explain scalping prevention]
   "Giả sử User B là scalper, và ông X đưa 5 triệu tiền mặt."
   "Scalper vẫn KHÔNG THỂ chuyển vé cho ông X."
   "Vé sẽ đi cho User C - người trong hàng chờ!"
   "=> Ông X mất tiền, scalper lỗ vốn!"
   "=> Phe vé chết!"
```

---

## 🚀 Next Steps

### Phase 1: MVP (Current)
✅ Basic waitlist FIFO  
✅ Sell back to system  
✅ Auto-match buyer

### Phase 2: Enhanced
- [ ] Deposit requirement
- [ ] Lottery from top N
- [ ] Reputation system
- [ ] Resale fee (2-5%)

### Phase 3: Advanced
- [ ] Dutch auction for resale
- [ ] Group buying
- [ ] Installment payment
- [ ] Insurance for events

---

**Đây là giải pháp HOÀN HẢO để chống phe vé! 🛡️**

**Key Insight**: Không cần kiểm soát giá, chỉ cần phá vỡ khả năng thỏa thuận! 🎯
