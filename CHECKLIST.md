# ✅ Pre-Demo Checklist

Sử dụng checklist này trước khi demo hoặc nộp dự án.

## 📋 Environment Setup

### Sui CLI & Wallet
- [ ] Sui CLI installed: `sui --version`
- [ ] Wallet configured: `sui client active-address`
- [ ] Connected to testnet: `sui client switch --env testnet`
- [ ] Have test SUI: `sui client gas` (at least 1 SUI)
- [ ] Sui Wallet browser extension installed
- [ ] Wallet has 2+ accounts for testing

### Development Environment
- [ ] Node.js installed (v18+): `node --version`
- [ ] npm installed: `npm --version`
- [ ] Git installed: `git --version`
- [ ] Code editor ready (VS Code recommended)

---

## 🚀 Deployment Checklist

### 1. Smart Contract
- [ ] Navigate to project root
- [ ] Run `sui move build` successfully
- [ ] No compilation errors
- [ ] Run `sui client publish --gas-budget 100000000`
- [ ] Save PACKAGE_ID from output
- [ ] Save PUBLISHER_ID from output
- [ ] Verify on explorer: `https://suiexplorer.com/?network=testnet`

### 2. Frontend Configuration
- [ ] Open `client/src/config/constants.ts`
- [ ] Replace `PACKAGE_ID` with deployed package ID
- [ ] Verify network is set to 'testnet'
- [ ] Save file

### 3. Install Dependencies
- [ ] `cd client`
- [ ] `npm install` runs without errors
- [ ] All packages installed successfully

### 4. Start Development Server
- [ ] `npm run dev` starts server
- [ ] No compilation errors
- [ ] Server running on `http://localhost:5173`
- [ ] Open in browser successfully

---

## 🧪 Testing Checklist

### Test Flow 1: Create Event (Organizer)
- [ ] Open app in browser
- [ ] Connect Sui Wallet (Account A - Organizer)
- [ ] Wallet connects successfully
- [ ] Navigate to "Tạo sự kiện" tab
- [ ] Fill all form fields:
  - [ ] Event name (min 3 chars)
  - [ ] Event time (future date)
  - [ ] Price in MIST (e.g., 2000000000)
  - [ ] Total tickets (e.g., 100)
  - [ ] Venue (min 3 chars)
  - [ ] Description (min 10 chars)
- [ ] Click "Tạo sự kiện"
- [ ] Wallet popup appears
- [ ] Approve transaction
- [ ] Success message appears
- [ ] Event appears in "Sự kiện" tab
- [ ] Event details are correct

### Test Flow 2: Buy Ticket (User)
- [ ] Switch to Account B (User) in wallet
- [ ] Refresh page
- [ ] Navigate to "Sự kiện" tab
- [ ] See event created by Account A
- [ ] Click "Mua vé ngay"
- [ ] Wallet popup appears
- [ ] Approve transaction (ensure enough SUI)
- [ ] Success message appears
- [ ] Navigate to "Vé của tôi" tab
- [ ] Ticket appears with:
  - [ ] Correct ticket number (#1)
  - [ ] QR Code displayed
  - [ ] Countdown running
  - [ ] State badge: "Chờ sự kiện" (yellow)
  - [ ] Correct price displayed

### Test Flow 3: Check-in (Organizer)
- [ ] Switch back to Account A (Organizer)
- [ ] Refresh page
- [ ] Navigate to "Vé của tôi" tab
- [ ] See ticket (if same browser, or get ticket ID)
- [ ] Click "✓ Check-in vé này" button
- [ ] Wallet popup appears
- [ ] Approve transaction
- [ ] Success message appears
- [ ] Ticket updates:
  - [ ] Color changes to green
  - [ ] State badge: "Đã check-in"
  - [ ] Icon changes to checkmark
  - [ ] Message: "Vé đã được sử dụng thành công"

### Test Flow 4: Transform to POAP (User)
**Note: Event must be >24h old. For testing, modify contract or wait.**

- [ ] Switch to Account B (User)
- [ ] Navigate to "Vé của tôi"
- [ ] See checked-in ticket
- [ ] If >24h after event, button appears
- [ ] Click "🏆 Chuyển thành huy hiệu kỷ niệm"
- [ ] Wallet popup appears
- [ ] Approve transaction
- [ ] Success message appears
- [ ] Ticket transforms:
  - [ ] Color changes to orange
  - [ ] State badge: "Huy hiệu kỷ niệm"
  - [ ] Icon changes to trophy
  - [ ] Message: "Cảm ơn bạn đã tham dự"

---

## 🎨 UI/UX Checklist

### Visual Elements
- [ ] Header displays correctly
- [ ] Gradient background loads
- [ ] Cards have shadows and hover effects
- [ ] Buttons have hover animations
- [ ] Tab navigation works
- [ ] Loading states show during transactions
- [ ] Success/error messages display
- [ ] QR codes generate correctly
- [ ] Countdown updates every second

### Responsive Design
- [ ] Desktop (1920x1080) looks good
- [ ] Laptop (1366x768) looks good
- [ ] Tablet (768x1024) looks good
- [ ] Mobile (375x667) looks good

### Interactions
- [ ] All buttons clickable
- [ ] Forms validate input
- [ ] Error messages clear
- [ ] No console errors
- [ ] Wallet connection smooth
- [ ] Transaction flow intuitive

---

## 📸 Demo Recording Checklist

### Pre-Recording
- [ ] Close unnecessary browser tabs
- [ ] Clear browser console
- [ ] Zoom browser to 100-110%
- [ ] Test audio/video recording
- [ ] Prepare script (see DEMO_SCRIPT.md)
- [ ] Have 2 wallets ready
- [ ] Have test SUI in both wallets
- [ ] Clean desktop background

### During Recording
- [ ] Speak clearly and confidently
- [ ] Show each feature slowly
- [ ] Highlight key points
- [ ] Show state transitions visually
- [ ] Mention "Sui Kiosk" and "Dynamic Fields"
- [ ] Demonstrate anti-scalping
- [ ] Show end-to-end flow
- [ ] Keep under 7 minutes

### Post-Recording
- [ ] Review video quality
- [ ] Check audio clarity
- [ ] Trim unnecessary parts
- [ ] Add captions (optional)
- [ ] Add background music (optional)
- [ ] Export in high quality (1080p)
- [ ] Upload to YouTube/Vimeo

---

## 📄 Documentation Checklist

### Required Files
- [ ] README.md complete and clear
- [ ] DEPLOYMENT.md with step-by-step guide
- [ ] All code files have comments
- [ ] No TODO comments left
- [ ] License file included (if needed)

### Code Quality
- [ ] No console.log in production code
- [ ] No hardcoded secrets
- [ ] All functions have descriptive names
- [ ] TypeScript types defined properly
- [ ] Move code follows best practices
- [ ] Error handling comprehensive

### Git & Version Control
- [ ] Initialize git repo: `git init`
- [ ] Add .gitignore file
- [ ] Commit all code: `git add . && git commit -m "Initial commit"`
- [ ] Push to GitHub (optional but recommended)
- [ ] Repository is public (for hackathon)

---

## 🎤 Presentation Checklist

### Pitch Deck (10 slides max)
- [ ] Problem slide (ticket scalping)
- [ ] Solution slide (Dynamic Ticketing)
- [ ] Demo slide (screenshots)
- [ ] Technology slide (Sui features)
- [ ] Business model slide
- [ ] Market size slide
- [ ] Roadmap slide
- [ ] Team slide
- [ ] Competition slide
- [ ] Closing/Ask slide

### Presentation Materials
- [ ] Slides polished and proofread
- [ ] Demo video embedded or linked
- [ ] Backup plan if demo fails
- [ ] Talking points prepared
- [ ] Questions & answers prepared
- [ ] Timing practiced (5-10 min)

---

## 🏆 Submission Checklist

### Hackathon Requirements
- [ ] Project submitted before deadline
- [ ] All required fields filled
- [ ] Video demo uploaded
- [ ] GitHub repo linked
- [ ] Live demo URL (if applicable)
- [ ] Team members listed
- [ ] Description clear and compelling

### Final Verification
- [ ] Deployed contract works
- [ ] Frontend accessible
- [ ] Demo video plays
- [ ] Documentation clear
- [ ] No broken links
- [ ] Contact info correct

---

## 🔧 Troubleshooting Checklist

### Common Issues

#### Contract won't build
- [ ] Check Move.toml syntax
- [ ] Verify Sui version compatibility
- [ ] Run `sui move build --dump-bytecode-as-base64`
- [ ] Check for typos in module name

#### Deployment fails
- [ ] Verify enough gas: `sui client gas`
- [ ] Check network: `sui client active-env`
- [ ] Try higher gas budget: `--gas-budget 200000000`
- [ ] Verify wallet has coins

#### Frontend errors
- [ ] Check PACKAGE_ID is correct
- [ ] Verify all dependencies installed
- [ ] Clear cache: `rm -rf node_modules && npm install`
- [ ] Check browser console for errors
- [ ] Verify wallet is on testnet

#### Wallet won't connect
- [ ] Refresh page
- [ ] Reinstall Sui Wallet extension
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Check wallet is unlocked

#### Transaction fails
- [ ] Check gas balance
- [ ] Verify object IDs are correct
- [ ] Check transaction parameters
- [ ] Review contract error messages
- [ ] Try with fresh wallet

---

## 📊 Performance Checklist

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Transaction confirmation < 2 seconds
- [ ] QR code generation instant
- [ ] No lag in animations
- [ ] Smooth scrolling

### Optimization
- [ ] Images optimized
- [ ] CSS minified (production)
- [ ] No unnecessary re-renders
- [ ] Efficient queries
- [ ] Lazy loading where needed

---

## 🎯 Judge Evaluation Points

### Innovation (25%)
- [ ] Solves real problem
- [ ] Unique approach
- [ ] Uses Sui-specific features
- [ ] Novel use cases

### Technical Implementation (25%)
- [ ] Code quality high
- [ ] Proper error handling
- [ ] Security considered
- [ ] Best practices followed

### Completeness (20%)
- [ ] Fully functional
- [ ] End-to-end tested
- [ ] Documentation complete
- [ ] Demo polished

### UX/Design (15%)
- [ ] Intuitive interface
- [ ] Beautiful design
- [ ] Smooth interactions
- [ ] Accessible

### Presentation (15%)
- [ ] Clear explanation
- [ ] Engaging demo
- [ ] Professional delivery
- [ ] Answered questions well

---

## ✨ Final Polish Checklist

Before submission, triple-check:

### Code
- [ ] Remove all debugging code
- [ ] Fix all TypeScript warnings
- [ ] Remove unused imports
- [ ] Format code consistently
- [ ] Add final comments

### Documentation
- [ ] Proofread all markdown files
- [ ] Fix broken links
- [ ] Update version numbers
- [ ] Add screenshots
- [ ] Credit libraries used

### Demo
- [ ] Test on clean machine/browser
- [ ] Verify all links work
- [ ] Check demo video quality
- [ ] Test with bad internet
- [ ] Have backup plan

### Submission
- [ ] Submit 30 min before deadline
- [ ] Verify submission received
- [ ] Save confirmation email
- [ ] Share with team
- [ ] Celebrate! 🎉

---

## 🎊 Post-Submission Checklist

### Feedback & Learning
- [ ] Watch other submissions
- [ ] Take notes on feedback
- [ ] Document lessons learned
- [ ] Thank mentors/supporters
- [ ] Network with other hackers

### Next Steps
- [ ] Plan improvements
- [ ] Consider mainnet deployment
- [ ] Seek partnerships
- [ ] Apply for grants
- [ ] Continue building!

---

**Good luck! You've got this! 🚀**

*Remember: Even if you don't win, you've built something amazing and learned valuable skills!*
