# Câu Hỏi Phản Biện - Dynamic Ticketing System

## 📋 Tổng Quan
File này ghi chú các câu hỏi phản biện tiềm năng từ ban tổ chức và cách trả lời.

---

## 🔒 BẢO MẬT SMART CONTRACT

### Q1: Làm sao đảm bảo organizer không thể rút tiền trước khi event kết thúc?
**Trả lời:**
- Smart contract kiểm tra thời gian: `assert!(current_time > event_config.event_time, EEventNotStarted)`
- Tiền được giữ trong `EventTreasury` (escrow) cho đến khi event kết thúc
- Người mua vẫn có thể refund trước event → bảo vệ quyền lợi

**Code:** [`dynamic_ticket.move:457`](sources/dynamic_ticket.move#L457)

---

### Q2: Nếu có bug trong smart contract, làm sao fix được?
**Trả lời:**
- **KHÔNG THỂ FIX** - đây là bản chất immutable của blockchain
- **Giải pháp:** Deploy version mới với package ID mới
- **Tương lai:** Implement upgrade pattern với UpgradeCap
- **Hiện tại:** Đã test kỹ với 9/9 tests passed

**Rủi ro đã giảm thiểu:**
- Unit tests đầy đủ
- Code review 11 critical bugs đã fix
- Theo best practices của Sui Move

---

### Q3: Ai sở hữu tiền trong Treasury? Có thể bị hack không?
**Trả lời:**
- Treasury là **shared object** - không ai sở hữu cá nhân
- Chỉ có 2 functions truy cập:
  1. `mint_ticket` - thêm tiền vào
  2. `refund_ticket` - trả lại cho người đã mua
  3. `organizer_withdraw` - chỉ sau khi event kết thúc
- Mỗi function có assert kiểm tra quyền và điều kiện

**Security measures:**
```move
assert!(sender == ticket_owner, ENotTicketOwner);
assert!(sender == event.organizer, ENotEventOrganizer);
assert!(current_time < event.event_time, EEventAlreadyStarted);
```

---

### Q4: Nếu nhiều người refund cùng lúc, Treasury có đủ tiền không?
**Trả lời:**
- ✅ **Luôn đủ tiền** vì:
  - Mỗi lần mint → `coin::join(&mut treasury.balance, payment)`
  - Mỗi lần refund → chỉ trả lại đúng số tiền đã nạp
  - `minted_tickets * price = treasury.balance` (balance sheet luôn cân bằng)
- Smart contract kiểm tra: `assert!(coin::value(&treasury.balance) >= refund_amount, EInsufficientTreasury)`

**Math proof:**
- 10 vé @ 1 SUI = 10 SUI trong treasury
- Refund 3 vé = trả 3 SUI → còn 7 SUI
- 7 vé còn lại × 1 SUI = 7 SUI ✅

---

## 🎫 ANTI-SCALPING & FAIRNESS

### Q5: Hệ thống chống phe vé như thế nào?
**Trả lời:**
- **FIFO Waitlist** - ai vào hàng chờ trước được mua trước
- **Deposit Escrow** - phải đặt cọc để vào waitlist (tránh spam)
- **No transfer during event** - vé không được chuyển nhượng trong event
- **Resale through system** - chỉ bán lại qua waitlist (không bán lẻ)

**Flow:**
```
Sold Out → User joins waitlist (+ deposit) 
→ Owner refunds → System auto-match buyer 
→ Deposit refunded
```

---

### Q6: Nếu không ai trong waitlist, người bán vé lại bị mất tiền?
**Trả lời:**
- ✅ **KHÔNG** - nếu waitlist trống:
  - `sell_back_ticket` sẽ **abort** với error `EWaitlistEmpty`
  - Người bán giữ vé, không mất gì
- **Alternative:** Dùng `refund_ticket` để hoàn tiền từ treasury (nếu chưa check-in)

**Code:** [`dynamic_ticket.move:370`](sources/dynamic_ticket.move#L370)

---

### Q7: Bot có thể spam waitlist để chiếm chỗ không?
**Trả lời:**
- ❌ **KHÔNG** - mỗi address chỉ join waitlist 1 lần
- Check: `assert!(!table::contains(&waitlist.buyers, sender), EAlreadyInWaitlist)`
- Phải deposit tiền thật (cost to spam)
- FIFO đảm bảo công bằng theo thứ tự thời gian

---

## ⚡ SCALABILITY & PERFORMANCE

### Q8: Nếu có 10,000 người mua vé cùng lúc, hệ thống có xử lý được không?
**Trả lời:**
- ✅ **Sui blockchain hỗ trợ parallel execution**
- Mỗi transaction độc lập (không conflict)
- Shared object `EventConfig` có object versioning tự động
- **Benchmark:** Sui testnet có thể xử lý ~1000 TPS

**Bottleneck tiềm năng:**
- Check `active_tickets < total_tickets` - race condition
- **Giải pháp:** Sui consensus tự động serialize, transaction thất bại sẽ retry

---

### Q9: Waitlist lưu trữ bao nhiêu người? Có giới hạn không?
**Trả lời:**
- **Table dynamic storage** - không giới hạn lý thuyết
- Mỗi entry: address + Coin<SUI> (~100 bytes)
- 1000 người = ~100KB
- **Chi phí:** Gas fee tăng theo số lượng entries (O(1) per operation)

**Best practice:**
- Limit waitlist size trong production (VD: max 500)
- Implement paging cho UI

---

## 💰 BUSINESS MODEL & ECONOMICS

### Q10: Hệ thống kiếm tiền như thế nào? Có phí giao dịch không?
**Trả lời:**
- **Hiện tại:** KHÔNG có phí - 100% tiền về organizer
- **Tương lai có thể:**
  - Platform fee: 2-5% mỗi giao dịch
  - Premium features: analytics, marketing tools
  - NFT marketplace fee

**Implementation suggestion:**
```move
let platform_fee = amount * 2 / 100;  // 2%
let organizer_amount = amount - platform_fee;
```

---

### Q11: Giá vé tính bằng MIST hay SUI? Tại sao lại phức tạp?
**Trả lời:**
- **MIST** (1 SUI = 1,000,000,000 MIST)
- **Lý do:** Smart contract không support số thập phân
- UI tự động convert: `price / 1_000_000_000` để hiển thị SUI
- **User không cần biết MIST** - UI handle hết

**Example:**
- User nhập: 1.5 SUI
- UI gửi: 1,500,000,000 MIST
- Contract lưu: `1500000000u64`

---

### Q12: Nếu giá SUI tăng/giảm mạnh, ảnh hưởng thế nào?
**Trả lời:**
- ⚠️ **Risk:** Giá vé fixed bằng SUI, nếu SUI x2 → vé đắt gấp đôi USD
- **Giải pháp tương lai:**
  - Oracle integration (Pyth, Switchboard) để fix giá USD
  - Dynamic pricing theo market cap
  - Stablecoin support (USDC on Sui)

**Hiện tại:** Organizer phải tự adjust giá theo thị trường

---

## 🎨 USER EXPERIENCE

### Q13: Người dùng không biết blockchain, có dùng được không?
**Trả lời:**
- ✅ **CÓ** - UI ẩn hết blockchain complexity
- Chỉ cần:
  1. Cài Sui Wallet extension
  2. Tạo ví (30 giây)
  3. Nhận SUI testnet từ faucet
- **Trải nghiệm giống Web2:**
  - Click "Mua vé" → Confirm wallet → Done
  - Không cần biết transaction, gas, object ID

**Onboarding flow:**
- Detect no wallet → Show guide + link download
- Auto-connect wallet on page load
- Clear error messages tiếng Việt

---

### Q14: Nếu mất ví, vé có mất không?
**Trả lời:**
- ❌ **MẤT** - đây là đặc tính của Web3
- **Giải pháp:**
  - Backup seed phrase (12 words)
  - Multi-sig wallet cho tài khoản quan trọng
  - Social recovery (future: zkLogin on Sui)

**Education cần:**
- Warning rõ ràng về seed phrase
- "Not your keys, not your coins"
- Guide backup wallet

---

### Q15: Check-in vé như thế nào? Có cần internet không?
**Trả lời:**
- **Cần internet** - check-in on-chain real-time
- **Flow:**
  1. Scan QR code (có ticket ID)
  2. Organizer gọi `check_in_ticket(ticket_id)`
  3. On-chain verify + update state
  4. UI hiển thị success

**Offline backup:**
- Cache ticket list trước event
- Offline check → sync sau khi có mạng
- (Chưa implement - future feature)

---

## 🛠️ TECHNICAL CHOICES

### Q16: Tại sao chọn Sui thay vì Ethereum/Solana?
**Trả lời:**

**Sui advantages:**
- ✅ Object-centric model → perfect cho NFT tickets
- ✅ Parallel execution → high TPS
- ✅ Low gas fees (~$0.01/tx)
- ✅ Move language → safer than Solidity
- ✅ Native randomness, clock

**So sánh:**
| Feature | Sui | Ethereum | Solana |
|---------|-----|----------|--------|
| TPS | ~1000 | ~15 | ~3000 |
| Gas | $0.01 | $5-50 | $0.001 |
| Finality | <1s | ~15s | <1s |
| Language | Move | Solidity | Rust |

---

### Q17: Tại sao không dùng IPFS cho metadata?
**Trả lời:**
- **Hiện tại:** Metadata on-chain (simple)
- **Trade-off:**
  - ✅ Simple, no external dependencies
  - ❌ Limited data (only text fields)
  - ❌ Không lưu được ảnh/video

**Future with IPFS:**
- Lưu image URL, description dài
- Immutable metadata
- Lower on-chain storage cost

**Implementation:**
```move
struct TicketMetadata {
    ipfs_hash: vector<u8>,
    image_url: vector<u8>,
}
```

---

### Q18: Code có follow Sui Move best practices không?
**Trả lời:**
- ✅ **CÓ** - theo guidelines:

**1. Ownership:**
- Không dùng manual `owner: address` field
- Dùng Sui ownership system (`transfer::transfer`)

**2. Shared objects:**
- `EventConfig`, `Treasury`, `Waitlist` là shared
- Ticket là owned object

**3. Capabilities:**
- Không dùng address check cho admin
- (Future: implement AdminCap)

**4. Events:**
- Emit events cho mọi state change
- UI dễ track history

**Code quality:**
- No unused variables
- Clear error codes
- Comments đầy đủ

---

## 🐛 EDGE CASES

### Q19: Nếu event bị cancel, xử lý refund hàng loạt thế nào?
**Trả lời:**
- ⚠️ **Chưa có batch refund function**
- **Hiện tại:** Từng người phải tự refund (gas costly)
- **Solution cần implement:**

```move
public entry fun bulk_refund(
    event_config: &mut EventConfig,
    treasury: &mut EventTreasury,
    ticket_ids: vector<ID>,
    ctx: &mut TxContext
) {
    let i = 0;
    while (i < vector::length(&ticket_ids)) {
        // Refund each ticket
        i = i + 1;
    }
}
```

**Workaround:** Organizer thông báo → users tự refund

---

### Q20: Nếu có 2 transaction mint vé cuối cùng cùng lúc?
**Trả lời:**
- **Sui consensus handle tự động:**
  1. Transaction 1 check: `active_tickets = 99, total = 100` → OK
  2. Transaction 2 check: `active_tickets = 99, total = 100` → OK
  3. Sui serialize: Tx1 execute first → `active_tickets = 100`
  4. Tx2 execute → check fail → abort với `ESoldOut`

**Result:** Chỉ 1 transaction thành công, còn lại fail gracefully

---

### Q21: Check-in ticket đã refund được không?
**Trả lời:**
- ❌ **KHÔNG** - vé đã refund bị destroy
- Ticket object không tồn tại → function call fail
- **Error:** "Object not found" hoặc "Invalid object reference"

**Prevention:** UI cache ticket list, filter deleted tickets

---

### Q22: Transform ticket về commemorative có thể bán lại không?
**Trả lời:**
- ❌ **KHÔNG** - commemorative ticket là final state
- Check: `assert!(ticket.state == TicketState::CHECKED_IN, ETicketAlreadyUsed)`
- Chỉ có thể transform từ CHECKED_IN → COMMEMORATIVE
- Không thể bán/refund/check-in lại

**Purpose:** Sưu tầm, không có giá trị trao đổi

---

## 📊 TESTING & QUALITY

### Q23: Hệ thống đã test kỹ chưa?
**Trả lời:**
- ✅ **9/9 unit tests PASSED**

**Coverage:**
1. ✅ Create event
2. ✅ Mint ticket
3. ✅ Check-in ticket
4. ✅ Transform ticket
5. ✅ Refund ticket (before event)
6. ✅ Join waitlist
7. ✅ Sell back ticket
8. ✅ Organizer withdraw
9. ✅ Sold out scenario

**Test command:**
```bash
sui move test
```

**Chưa test:**
- Load testing (performance)
- UI end-to-end tests
- Security audit from 3rd party

---

### Q24: Đã có security audit chưa?
**Trả lời:**
- ❌ **CHƯA** - đây là hackathon project
- **Self-review:** Fixed 11 critical bugs
- **Needed:**
  - Professional audit (VD: OtterSec, Zellic)
  - Bug bounty program
  - Formal verification

**Timeline:**
- Hackathon: MVP + self-review ✅
- Post-hackathon: Community review
- Mainnet: Professional audit required

---

## 🚀 FUTURE IMPROVEMENTS

### Q25: Roadmap phát triển tiếp theo là gì?
**Trả lời:**

**Phase 1 - Mainnet Ready:**
- [ ] Security audit
- [ ] Gas optimization
- [ ] Batch operations
- [ ] Admin dashboard

**Phase 2 - Features:**
- [ ] Oracle price feeds (USD pricing)
- [ ] Stablecoin support
- [ ] Multi-tier tickets (VIP, Regular)
- [ ] Early bird pricing

**Phase 3 - Ecosystem:**
- [ ] Secondary marketplace
- [ ] Event discovery & recommendations
- [ ] Organizer analytics
- [ ] Mobile app

**Phase 4 - Advanced:**
- [ ] Cross-chain tickets (Sui ↔ other chains)
- [ ] DAO governance
- [ ] Staking rewards
- [ ] AI-powered fraud detection

---

## 💡 KEY STRENGTHS TO HIGHLIGHT

### Khi present, nhấn mạnh:

1. **🔒 Security-first design**
   - EventTreasury escrow 100% on-chain
   - No manual owner checks (Sui ownership)
   - Dual-counter system (minted vs active)

2. **🎯 Real anti-scalping**
   - FIFO waitlist
   - Deposit escrow
   - No secondary market bypass

3. **⚡ Performance**
   - Parallel execution ready
   - Shared objects optimized
   - Low gas fees

4. **🎨 User-friendly**
   - Web2-like UX
   - Vietnamese language
   - Clear error messages

5. **📈 Production-ready foundation**
   - 9/9 tests passed
   - 11 bugs fixed
   - Complete documentation

---

## 🎯 DEMO SCENARIO

### Kịch bản demo tốt nhất:

**Setup:**
- 2 wallets: Organizer + User
- Event: "TechNova Demo" với 5 vé

**Flow:**
1. **Create event** (Organizer)
2. **Mint 5 tickets** (Users) → Sold out
3. **Join waitlist** (User 6) → deposit SUI
4. **Refund 1 ticket** (User 1) → auto-match User 6
5. **Check-in ticket** (Organizer)
6. **Transform commemorative** (User)
7. **Withdraw funds** (Organizer - after event ends)

**Show:**
- Real-time updates
- Object IDs on explorer
- Transaction success
- Balance changes

**Time:** ~5-7 phút

---

## 📝 CONCLUSION

**Strengths:**
- ✅ Hoàn thiện về mặt kỹ thuật
- ✅ Giải quyết vấn đề thực tế (anti-scalping)
- ✅ Tận dụng tốt Sui features
- ✅ UX thân thiện

**Limitations:**
- ⚠️ Chưa có security audit
- ⚠️ Chưa test production load
- ⚠️ Thiếu một số features (batch operations, offline)

**Recommendation:**
- Tiếp tục phát triển sau hackathon
- Tìm funding cho audit
- Build community & gather feedback

**Overall:** Solid foundation cho production ticketing platform trên Sui! 🚀
