# 🎬 Demo Script - Dynamic Ticketing System

## Preparation Checklist
- [ ] Contract deployed to testnet
- [ ] Package ID updated in constants.ts
- [ ] Frontend running on localhost
- [ ] 2 Sui wallets ready (Organizer & User)
- [ ] Both wallets have test SUI
- [ ] Screen recording software ready

## Script (5-7 minutes)

### 🎯 Opening (30 seconds)
**[Show homepage]**

> "Xin chào! Hôm nay tôi sẽ demo hệ thống Dynamic Ticketing - một giải pháp chống phe vé sử dụng Sui blockchain."

**[Highlight header]**
> "Vấn đề: Tại Việt Nam, phe vé là một nạn lớn. Vé concert, sự kiện thể thao thường bị đầu cơ với giá gấp 5-10 lần."

---

### 🎪 Part 1: Create Event (1.5 minutes)
**[Connect Wallet - Organizer account]**

> "Tôi là ban tổ chức một sự kiện. Đầu tiên, tôi kết nối ví Sui."

**[Click "Tạo sự kiện" tab]**

> "Tạo sự kiện mới với các thông tin:"

**[Fill form while speaking]**
- **Tên**: "TechNova Hackathon 2026"
- **Thời gian**: Tomorrow 18:00
- **Giá vé**: 2000000000 MIST (2 SUI)
- **Số vé**: 100
- **Địa điểm**: "Trung tâm Hội nghị Quốc gia"
- **Mô tả**: "Hackathon công nghệ blockchain lớn nhất Việt Nam"

**[Click Submit]**

> "Submit và ký transaction..."

**[Wait for confirmation]**

> "✅ Sự kiện được tạo thành công! Bạn thấy đây - event của chúng ta xuất hiện với đầy đủ thông tin."

**[Point to Event Card]**
> "Lưu ý thanh progress bar - hiện tại 0% vé đã bán. Và quan trọng: có dòng chữ 'Chống phe vé' - vé không thể bán lại cao hơn giá gốc."

---

### 🎫 Part 2: Buy Ticket (1.5 minutes)
**[Switch to User wallet]**

> "Bây giờ tôi là một khách hàng muốn mua vé. Tôi đổi sang ví khác."

**[Click "Sự kiện" tab if not already there]**

> "Tôi thấy sự kiện TechNova, giá 2 SUI, còn 100 vé."

**[Click "Mua vé ngay"]**

> "Click mua vé... ký transaction... Chờ blockchain confirm..."

**[Transaction success]**

> "🎉 Đã mua thành công!"

**[Click "Vé của tôi" tab]**

> "Bây giờ xem vé của tôi. Wow! Đây là điểm đặc biệt:"

**[Point to ticket features]**

1. **QR Code**: "Vé tự động generate QR code để check-in"
2. **Countdown**: "Đếm ngược real-time đến sự kiện"
3. **State Badge**: "Trạng thái: 'Chờ sự kiện' với màu vàng"
4. **Ticket Number**: "Vé số #1"

> "Vé này là một NFT trên Sui, tôi sở hữu hoàn toàn. Metadata của nó sẽ thay đổi theo thời gian!"

---

### ✅ Part 3: Check-in (1.5 minutes)
**[Switch back to Organizer wallet]**

> "Đến ngày sự kiện, tôi là ban tổ chức. Khách hàng đến venue và show QR code."

**[Go to "Vé của tôi" - should see user's ticket if same browser]**
**[OR demonstrate from Organizer perspective]**

> "Tôi scan QR code (hoặc check ticket ID) và nhấn Check-in."

**[Click "✓ Check-in vé này" button]**

> "Ký transaction... và..."

**[Wait for state change]**

> "🎉 Boom! Vé tự động đổi màu!"

**[Point to changes]**

1. **Màu sắc**: "Từ tím chuyển sang xanh lá"
2. **State**: "Từ 'Chờ sự kiện' → 'Đã check-in'"
3. **Icon**: "Xuất hiện dấu ✓"
4. **Message**: "'Vé đã được sử dụng thành công'"

> "Điểm hay: Vé này KHÔNG THỂ dùng lại. Metadata đã thay đổi ON-CHAIN, không ai có thể fake được!"

---

### 🏆 Part 4: Transform to POAP (1.5 minutes)
**[Switch to User wallet]**

> "Sau sự kiện 24 giờ, tôi với tư cách khách hàng, có thể chuyển vé thành huy hiệu kỷ niệm."

**[Click "🏆 Chuyển thành huy hiệu kỷ niệm"]**

> "Nhấn nút transform... ký transaction..."

**[Wait for transformation]**

> "Và đây rồi! 🏆"

**[Show transformed ticket]**

1. **Màu sắc**: "Chuyển sang vàng cam - màu của champion"
2. **State**: "'Huy hiệu kỷ niệm'"
3. **Icon**: "Trophy 🏆"
4. **Message**: "Thank you for attending!"

> "Đây là POAP - Proof of Attendance Protocol. Một kỷ niệm đẹp, một NFT collectible. Tôi có thể giữ mãi, show off trên profile!"

---

### 🛡️ Part 5: Anti-Scalping Demo (1 minute)
**[Go to explanation]**

> "Bây giờ tôi demo tính năng chống phe vé - core feature của dự án."

**[Open code or show concept]**

> "Trong smart contract, chúng tôi sử dụng Sui Kiosk - một tính năng ĐỘC QUYỀN của Sui."

```move
assert!(price <= ticket.original_price, EPriceExceedsOriginal);
```

> "Khi list vé lên marketplace qua Kiosk, hệ thống check: Nếu giá > giá gốc → REJECT!"

**[Show Transfer Policy concept]**

> "Transfer Policy được enforce ON-CHAIN, không ai bypass được - kể cả hacker!"

**[Compare with traditional]**

> "Với hệ thống truyền thống:
> - Web2: Phe vé dùng bot, mua hàng loạt
> - Resale platform: Không kiểm soát được giá
>
> Với Sui:
> - Kiosk Policy: Enforce tại blockchain layer
> - Dynamic Fields: Vé thay đổi, không dùng lại được
> - Object Model: True ownership, transparent"

---

### 🌟 Closing & Key Points (1 minute)
**[Show all 3 states side by side if possible]**

> "Tóm lại, Dynamic Ticketing giải quyết 3 vấn đề lớn:"

1. **Chống phe vé** 🛡️
   > "Sui Kiosk enforce price cap - không thể bypass"

2. **Chống fake & reuse** ✅
   > "Dynamic Fields - vé thay đổi on-chain, không fake được"

3. **Tạo trải nghiệm tuyệt vời** 🏆
   > "POAP kỷ niệm - fans có kỷ vật đẹp"

**[Show technical highlights]**

> "Về mặt kỹ thuật, dự án này showcase 3 tính năng ĐỘC QUYỀN của Sui:"

1. **Sui Kiosk**: "Policy layer - unique to Sui"
2. **Dynamic Fields**: "Metadata thay đổi không cần migrate"
3. **Object Model**: "True ownership, gas efficient"

**[Business impact]**

> "Impact thực tế:
> - Tiết kiệm hàng triệu USD cho fans mỗi năm
> - Bảo vệ quyền lợi người mua vé chân chính
> - Tạo ecosystem bền vững cho event organizers"

**[Final statement]**

> "Cảm ơn các bạn! Dynamic Ticketing - Powered by Sui. Questions?"

---

## 📊 Backup Q&A

### Q: "Làm sao chống được bot?"
**A**: "Trong production, chúng tôi sẽ thêm:
- CAPTCHA verification
- KYC nhẹ (phone/email verification)
- Rate limiting
- Whitelist system cho early birds

Nhưng key point: Kể cả bot mua được, họ cũng KHÔNG THỂ bán lại cao hơn giá gốc nhờ Kiosk policy!"

### Q: "Chi phí gas cao không?"
**A**: "Sui có gas fee RẤT THẤP:
- Mint ticket: ~0.001 SUI (~$0.001)
- Check-in: ~0.0005 SUI
- Transform: ~0.0005 SUI

Rẻ hơn Ethereum 1000x!"

### Q: "User experience cho người không biết crypto?"
**A**: "Chúng tôi sẽ integrate:
- Gasless transaction (sponsor gas)
- Social login (zkLogin)
- Mobile app với QR code scanner
- Email notifications

Sui's zkLogin cho phép login bằng Google/Facebook - không cần hiểu blockchain!"

### Q: "Tại sao không dùng Ethereum/Polygon?"
**A**: "Sui có 3 lợi thế:
1. **Kiosk Framework**: Built-in, không có trên chain khác
2. **Dynamic Fields**: Efficient hơn Solidity's storage patterns
3. **Object Model**: Gas fee thấp, throughput cao
4. **Move Language**: Memory safe, prevents nhiều loại bugs"

### Q: "Roadmap tiếp theo?"
**A**: "Phase 1 (Now): MVP demo
Phase 2: Integrate zkLogin, gasless tx
Phase 3: Mobile app
Phase 4: Partner với venues lớn ở VN
Phase 5: Expand to APAC"

---

## 🎥 Recording Tips

1. **Clean browser**: No unnecessary tabs
2. **Large font size**: Easy to read
3. **Smooth transitions**: No sudden jumps
4. **Show loading states**: Prove it's real blockchain
5. **Highlight cursor**: So viewers can follow
6. **Use zoom**: Zoom in on important parts
7. **Background music**: Soft, upbeat (optional)

## ⚡ Emergency Troubleshooting

**If transaction fails:**
> "Oops, network lag. Let me try again... [retry]"
> "This is testnet, sometimes congested. But you see the concept!"

**If wallet not connecting:**
> "Technical glitch - but I'll show you the code/architecture instead..."

**If gas insufficient:**
> "Need to top up gas... [use faucet quickly]"

## 🎯 Goal
- ✅ Demonstrate ALL 3 state changes
- ✅ Explain anti-scalping mechanism
- ✅ Show Sui's unique advantages
- ✅ Prove it works end-to-end
- ✅ Be enthusiastic and confident!

**Break a leg! 🚀**
