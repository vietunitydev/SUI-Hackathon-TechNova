# 🚀 Quick Start Guide

## Deployment Steps

### 1. Deploy Smart Contract

```bash
# Build the Move package
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000

# Save the output - you'll need:
# - Package ID
# - Publisher ID
# - Display ID
```

### 2. Update Frontend Config

Edit `client/src/config/constants.ts`:

```typescript
export const PACKAGE_ID = '0xYOUR_PACKAGE_ID_HERE';
```

### 3. Run Frontend

```bash
cd client
npm install
npm run dev
```

Visit: http://localhost:5173

## Testing Flow

### 1. Create Event (as Organizer)
1. Connect wallet
2. Go to "Tạo sự kiện" tab
3. Fill form:
   - Name: "Test Event"
   - Time: Tomorrow
   - Price: 1000000000 (1 SUI)
   - Tickets: 10
   - Venue: "Online"
4. Submit

### 2. Buy Ticket (as User)
1. Connect wallet (different account)
2. Go to "Sự kiện" tab
3. Click "Mua vé ngay"
4. Confirm transaction

### 3. Check In (as Organizer)
1. Go to "Vé của tôi" tab
2. See ticket with QR code
3. If you're organizer, click "Check-in vé này"

### 4. Transform to POAP (after event)
1. Wait 24h after event time (or modify contract for testing)
2. Go to checked-in ticket
3. Click "Chuyển thành huy hiệu kỷ niệm"

## Troubleshooting

### "Insufficient gas"
Increase gas budget in deployment command

### "Package not found"
Make sure you updated PACKAGE_ID in constants.ts

### "Clock object not found"
Clock object ID is always `0x6` on Sui

### Wallet not connecting
- Make sure you have Sui Wallet extension installed
- Switch to Testnet in wallet settings
- Get test SUI from faucet: https://discord.com/channels/916379725201563759/971488439931392130

## Get Test SUI

```bash
sui client faucet
```

Or via Discord faucet bot in Sui Discord server.

## Useful Commands

```bash
# Check your address
sui client active-address

# Check balance
sui client gas

# View objects you own
sui client objects

# Call view function
sui client call --function get_ticket_state --module dynamic_ticket --package $PACKAGE_ID --args $TICKET_ID
```

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │
│  (TypeScript)   │
└────────┬────────┘
         │
         │ @mysten/sui.js
         │
┌────────▼────────┐
│   Sui Network   │
│   (Testnet)     │
└────────┬────────┘
         │
         │
┌────────▼────────────┐
│  Move Contract      │
│  - EventConfig      │
│  - Ticket NFT       │
│  - Dynamic Fields   │
│  - Kiosk Policy     │
└─────────────────────┘
```

## Demo Video Script

1. **Intro (30s)**
   - Show homepage
   - Explain problem: Ticket scalping in Vietnam

2. **Create Event (1min)**
   - Connect wallet
   - Create event with form
   - Show event card

3. **Buy Ticket (1min)**
   - Switch account
   - Buy ticket
   - Show QR code and countdown

4. **Check-in (1min)**
   - Show organizer view
   - Check-in ticket
   - See state change

5. **Transform to POAP (30s)**
   - Click transform button
   - Show commemorative badge

6. **Anti-Scalping Demo (1min)**
   - Try to list ticket above original price
   - Show error
   - Explain Kiosk policy

7. **Conclusion (30s)**
   - Recap features
   - Show unique Sui capabilities

Total: ~5 minutes

## Presentation Points

### Problem
- Ticket scalping costs fans millions
- Fake tickets, reused tickets
- No way to enforce price caps

### Solution
- Sui Kiosk: Enforce price cap on-chain
- Dynamic Fields: Tickets change state automatically
- Object Model: True ownership

### Impact
- Fair pricing for fans
- Eliminate fake tickets
- Create collectible memories (POAPs)

### Technical Highlights
- **Sui Kiosk**: Unique to Sui, impossible to bypass
- **Dynamic Fields**: Zero migration, real-time updates
- **Owned Objects**: Perfect for NFTs
- **Move**: Safe, efficient smart contracts

### Business Model
- Service fee per ticket (2-5%)
- Premium features for organizers
- Marketplace for POAPs
- White-label solution for venues

## Next Steps

1. ✅ Deploy to testnet
2. ✅ Test all functions
3. 📹 Record demo video
4. 📊 Prepare presentation
5. 🎤 Practice pitch
6. 🚀 Submit to hackathon

Good luck! 🎯
