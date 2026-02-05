module dynamic_ticketing::dynamic_ticket {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::dynamic_field as df;
    use sui::package::{Self, Publisher};
    use sui::display;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};

    // ==================== Errors ====================
    const ENotEventOrganizer: u64 = 0;
    const EEventNotStarted: u64 = 1;
    const EEventAlreadyStarted: u64 = 2;
    const ETicketAlreadyUsed: u64 = 3;
    const EInvalidPrice: u64 = 4;
    const ENotTicketOwner: u64 = 5;
    const EWaitlistEmpty: u64 = 6;
    const EAlreadyInWaitlist: u64 = 7;
    const ECannotSellCheckedInTicket: u64 = 8;
    const EInsufficientTreasury: u64 = 9;
    const ESoldOut: u64 = 10;

    // ==================== Ticket States ====================
    const STATE_PENDING: u8 = 0;      // Trước sự kiện
    const STATE_CHECKED_IN: u8 = 1;   // Đã check-in
    const STATE_COMMEMORATIVE: u8 = 2; // Sau sự kiện (POAP)

    // ==================== Structs ====================
    
    /// One Time Witness để tạo Publisher
    public struct DYNAMIC_TICKET has drop {}

    /// Event Configuration - Quản lý thông tin sự kiện
    public struct EventConfig has key, store {
        id: UID,
        name: String,
        organizer: address,
        event_time: u64,          // Timestamp của sự kiện
        original_price: u64,      // Giá gốc để kiểm soát scalping
        total_tickets: u64,
        minted_tickets: u64,      // Tổng số vé đã tạo (không bao giờ giảm)
        active_tickets: u64,      // Số vé hiện đang active (giảm khi refund)
        venue: String,
        description: String,
    }

    /// Waiting List - Hàng chờ để mua vé resale với escrow deposit
    public struct WaitingList has key, store {
        id: UID,
        event_id: ID,
        queue: vector<address>,   // Danh sách người chờ (FIFO)
    }

    /// Deposit Escrow - Lưu trữ tiền deposit của users trong waitlist
    public struct DepositEscrow has key, store {
        id: UID,
        event_id: ID,
        deposits: table::Table<address, Coin<SUI>>,  // address -> deposited coin
    }

    /// Event Treasury - Quỹ chứa tiền bán vé, dùng cho refund và withdraw sau event
    public struct EventTreasury has key, store {
        id: UID,
        event_id: ID,
        balance: Coin<SUI>,  // Tổng tiền từ ticket sales
    }

    /// Dynamic Ticket NFT
    public struct Ticket has key, store {
        id: UID,
        event_id: ID,
        ticket_number: u64,
        original_price: u64,
        state: u8,
        // owner field REMOVED - use Sui ownership system instead
    }

    /// Dynamic Field Key cho ticket state
    public struct TicketStateKey has copy, drop, store { }

    /// Dynamic Field Value - Metadata thay đổi theo state
    public struct TicketMetadata has store, drop {
        image_url: String,
        description: String,
        qr_code: String,
        last_updated: u64,
    }

    // ==================== Events ====================
    
    public struct EventCreated has copy, drop {
        event_id: ID,
        name: String,
        organizer: address,
        event_time: u64,
        treasury_id: ID,
        waitlist_id: ID,
        deposit_escrow_id: ID,
    }

    public struct TicketMinted has copy, drop {
        ticket_id: ID,
        event_id: ID,
        owner: address,
        ticket_number: u64,
    }

    public struct TicketCheckedIn has copy, drop {
        ticket_id: ID,
        event_id: ID,
        timestamp: u64,
    }

    public struct TicketTransformed has copy, drop {
        ticket_id: ID,
        new_state: u8,
        timestamp: u64,
    }

    public struct JoinedWaitlist has copy, drop {
        event_id: ID,
        user: address,
        position: u64,
    }

    public struct TicketSoldBack has copy, drop {
        ticket_id: ID,
        seller: address,
        buyer: address,
        event_id: ID,
        timestamp: u64,
    }

    public struct EventCancelled has copy, drop {
        event_id: ID,
        organizer: address,
        refunded_amount: u64,
        timestamp: u64,
    }

    // ==================== Init Function ====================
    
    fun init(otw: DYNAMIC_TICKET, ctx: &mut TxContext) {
        // Tạo Publisher cho display
        let publisher = package::claim(otw, ctx);
        
        // Tạo Display cho Ticket NFT
        let mut display = display::new<Ticket>(&publisher, ctx);
        
        display::add(&mut display, string::utf8(b"name"), string::utf8(b"{event_id} - Ticket #{ticket_number}"));
        display::add(&mut display, string::utf8(b"description"), string::utf8(b"Dynamic Event Ticket with Anti-Scalping"));
        display::add(&mut display, string::utf8(b"image_url"), string::utf8(b"https://api.ticket-system.io/ticket/{id}/image"));
        display::add(&mut display, string::utf8(b"project_url"), string::utf8(b"https://ticket-system.io"));
        
        display::update_version(&mut display);
        
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // ==================== Event Management ====================
    
    /// Tạo sự kiện mới
    public entry fun create_event(
        name: vector<u8>,
        event_time: u64,
        original_price: u64,
        total_tickets: u64,
        venue: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        let event_config = EventConfig {
            id: object::new(ctx),
            name: string::utf8(name),
            organizer: tx_context::sender(ctx),
            event_time,
            original_price,
            total_tickets,
            minted_tickets: 0,
            active_tickets: 0,
            venue: string::utf8(venue),
            description: string::utf8(description),
        };

        let event_id = object::uid_to_inner(&event_config.id);

        // Tạo WaitingList cho event này
        let waitlist = WaitingList {
            id: object::new(ctx),
            event_id,
            queue: vector::empty(),
        };

        // Tạo DepositEscrow để lưu deposits
        let deposit_escrow = DepositEscrow {
            id: object::new(ctx),
            event_id,
            deposits: table::new(ctx),
        };

        // Tạo EventTreasury để quản lý quỹ bán vé
        let treasury = EventTreasury {
            id: object::new(ctx),
            event_id,
            balance: coin::zero(ctx),
        };

        let treasury_id = object::uid_to_inner(&treasury.id);
        let waitlist_id = object::uid_to_inner(&waitlist.id);
        let deposit_escrow_id = object::uid_to_inner(&deposit_escrow.id);

        event::emit(EventCreated {
            event_id,
            name: event_config.name,
            organizer: event_config.organizer,
            event_time,
            treasury_id,
            waitlist_id,
            deposit_escrow_id,
        });

        transfer::share_object(event_config);
        transfer::share_object(waitlist);
        transfer::share_object(deposit_escrow);
        transfer::share_object(treasury);
    }

    public entry fun mint_ticket(
        event_config: &mut EventConfig,
        treasury: &mut EventTreasury,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Kiểm tra sự kiện chưa bắt đầu
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < event_config.event_time, EEventAlreadyStarted);

        // Kiểm tra giá tiền
        assert!(coin::value(&payment) >= event_config.original_price, EInvalidPrice);

        // CRITICAL: Kiểm tra còn vé không (dùng active_tickets để cho phép bán lại sau refund)
        assert!(event_config.active_tickets < event_config.total_tickets, ESoldOut);

        // Cập nhật số vé
        event_config.minted_tickets = event_config.minted_tickets + 1;
        event_config.active_tickets = event_config.active_tickets + 1;
        let ticket_number = event_config.minted_tickets;

        // Tạo ticket (KHÔNG lưu owner - dùng Sui ownership)
        let mut ticket = Ticket {
            id: object::new(ctx),
            event_id: object::uid_to_inner(&event_config.id),
            ticket_number,
            original_price: event_config.original_price,
            state: STATE_PENDING,
        };

        let ticket_id = object::uid_to_inner(&ticket.id);

        // Thêm dynamic field cho metadata
        df::add(
            &mut ticket.id,
            TicketStateKey {},
            TicketMetadata {
                image_url: string::utf8(b"https://api.ticket-system.io/pending.png"),
                description: string::utf8(b"Waiting for event - Countdown active"),
                qr_code: generate_qr_code(&ticket_id),
                last_updated: current_time,
            }
        );

        event::emit(TicketMinted {
            ticket_id,
            event_id: ticket.event_id,
            owner: tx_context::sender(ctx),
            ticket_number,
        });

        // Nạp tiền vào treasury (để có thể refund)
        coin::join(&mut treasury.balance, payment);

        // Chuyển ticket cho người mua
        transfer::public_transfer(ticket, tx_context::sender(ctx));
    }

    // ==================== Check-in Logic ====================
    
    /// Check-in vé tại sự kiện - chuyển state sang CHECKED_IN
    public entry fun check_in_ticket(
        ticket: &mut Ticket,
        event_config: &EventConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Chỉ organizer mới check-in được (ticket owner pass &mut Ticket = auto-verified)
        assert!(sender == event_config.organizer, ENotEventOrganizer);
        
        // Kiểm tra vé chưa sử dụng
        assert!(ticket.state == STATE_PENDING, ETicketAlreadyUsed);

        let current_time = clock::timestamp_ms(clock);

        // Cập nhật state
        ticket.state = STATE_CHECKED_IN;

        // Cập nhật metadata - chuyển hình ảnh sang "Đã sử dụng"
        let metadata = df::borrow_mut<TicketStateKey, TicketMetadata>(
            &mut ticket.id,
            TicketStateKey {}
        );
        
        metadata.image_url = string::utf8(b"https://api.ticket-system.io/checked-in.png");
        metadata.description = string::utf8(b"Ticket has been used - Welcome to the event!");
        metadata.last_updated = current_time;

        event::emit(TicketCheckedIn {
            ticket_id: object::uid_to_inner(&ticket.id),
            event_id: ticket.event_id,
            timestamp: current_time,
        });
    }

    // ==================== Transform to POAP ====================
    
    /// Sau sự kiện: Chuyển vé thành huy hiệu kỷ niệm (POAP)
    public entry fun transform_to_commemorative(
        ticket: &mut Ticket,
        event_config: &EventConfig,
        clock: &Clock,
        ctx: &TxContext
    ) {
        // Kiểm tra sự kiện đã kết thúc
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time > event_config.event_time + 86400000, EEventNotStarted); // +1 ngày

        // Ticket owner được auto-verified qua &mut Ticket

        // Chuyển sang state commemorative
        ticket.state = STATE_COMMEMORATIVE;

        // Cập nhật metadata thành POAP đẹp mắt
        let metadata = df::borrow_mut<TicketStateKey, TicketMetadata>(
            &mut ticket.id,
            TicketStateKey {}
        );
        
        metadata.image_url = string::utf8(b"https://api.ticket-system.io/poap-badge.png");
        metadata.description = string::utf8(b"Commemorative Badge - Thank you for attending!");
        metadata.last_updated = current_time;

        event::emit(TicketTransformed {
            ticket_id: object::uid_to_inner(&ticket.id),
            new_state: STATE_COMMEMORATIVE,
            timestamp: current_time,
        });
    }

    // ==================== EVENT CANCELLATION ====================
    
    /// Hủy sự kiện và hoàn tiền cho người mua vé
    /// Chỉ organizer mới được phép hủy
    public entry fun cancel_event(
        event_config: &EventConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Chỉ organizer mới được hủy
        assert!(tx_context::sender(ctx) == event_config.organizer, ENotEventOrganizer);
        
        // Chỉ hủy được trước khi sự kiện diễn ra
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < event_config.event_time, EEventAlreadyStarted);

        let refunded_amount = event_config.active_tickets * event_config.original_price;
        
        event::emit(EventCancelled {
            event_id: object::uid_to_inner(&event_config.id),
            organizer: event_config.organizer,
            refunded_amount,
            timestamp: current_time,
        });
        
        // Note: Actual refund logic would require tracking ticket holders
        // and transferring coins back. This emits event for off-chain processing.
    }

    /// Hoàn tiền vé - Ticket owner có thể yêu cầu refund nếu event bị hủy
    /// 100% on-chain, tiền từ EventTreasury
    public entry fun refund_ticket(
        ticket: Ticket,
        event_config: &mut EventConfig,
        treasury: &mut EventTreasury,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        
        // Ticket owner được auto-verified qua owned Ticket parameter
        
        // Vé phải ở trạng thái PENDING (chưa check-in)
        assert!(ticket.state == STATE_PENDING, ETicketAlreadyUsed);

        // Event phải chưa bắt đầu (chỉ refund trước event)
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < event_config.event_time, EEventAlreadyStarted);

        let refund_amount = ticket.original_price;
        let event_id = ticket.event_id;
        let ticket_id = object::uid_to_inner(&ticket.id);
        
        // Kiểm tra treasury đủ tiền
        assert!(coin::value(&treasury.balance) >= refund_amount, EInsufficientTreasury);
        
        // Giảm active_tickets (minted_tickets KHÔNG giảm)
        event_config.active_tickets = event_config.active_tickets - 1;
        
        // Destroy ticket
        let Ticket { id, event_id: _, ticket_number: _, original_price: _, state: _ } = ticket;
        object::delete(id);

        // REFUND THỰC TẾ từ treasury
        let refund_coin = coin::split(&mut treasury.balance, refund_amount, ctx);
        transfer::public_transfer(refund_coin, owner);
        
        event::emit(TicketSoldBack {
            ticket_id,
            seller: owner,
            buyer: event_config.organizer,
            event_id,
            timestamp: current_time,
        });
    }

    /// Organizer rút tiền từ treasury SAU KHI event kết thúc
    /// Đảm bảo không còn refund nào có thể xảy ra
    public entry fun organizer_withdraw(
        event_config: &EventConfig,
        treasury: &mut EventTreasury,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Chỉ organizer mới được rút
        assert!(sender == event_config.organizer, ENotEventOrganizer);
        
        // Event phải đã kết thúc (không còn refund)
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time > event_config.event_time, EEventNotStarted);
        
        // Rút toàn bộ số dư
        let amount = coin::value(&treasury.balance);
        if (amount > 0) {
            let withdrawal = coin::split(&mut treasury.balance, amount, ctx);
            transfer::public_transfer(withdrawal, sender);
        };
    }

    // ==================== WAITLIST & RESALE SYSTEM WITH ESCROW ====================
    
    /// Tham gia hàng chờ với deposit trước
    /// User deposit tiền, nếu không mua được vé sẽ tự động refund sau event
    public entry fun join_waitlist(
        waitlist: &mut WaitingList,
        deposit_escrow: &mut DepositEscrow,
        event_config: &EventConfig,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Kiểm tra user chưa trong waitlist
        assert!(!vector::contains(&waitlist.queue, &user), EAlreadyInWaitlist);
        
        // Kiểm tra payment đủ tiền (phải = original_price)
        assert!(coin::value(&payment) >= event_config.original_price, EInvalidPrice);
        
        // Thêm vào cuối hàng chờ
        vector::push_back(&mut waitlist.queue, user);
        
        // Lưu deposit vào escrow
        table::add(&mut deposit_escrow.deposits, user, payment);
        
        event::emit(JoinedWaitlist {
            event_id: waitlist.event_id,
            user,
            position: vector::length(&waitlist.queue),
        });
    }

    /// Bán vé lại cho HỆ THỐNG - sử dụng deposit đã có sẵn
    /// Buyer deposit trước → Seller nhận deposit → Buyer nhận vé
    public entry fun sell_back_ticket(
        mut ticket: Ticket,
        waitlist: &mut WaitingList,
        deposit_escrow: &mut DepositEscrow,
        event_config: &EventConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        
        // CRITICAL: Seller được auto-verified qua owned Ticket parameter
        // Chỉ ai sở hữu ticket mới pass được `ticket: Ticket`
        
        // Kiểm tra: Chỉ vé PENDING mới bán được
        assert!(ticket.state == STATE_PENDING, ECannotSellCheckedInTicket);
        
        // Kiểm tra: Phải có người trong hàng chờ
        assert!(vector::length(&waitlist.queue) > 0, EWaitlistEmpty);
        
        // Kiểm tra: Event chưa bắt đầu
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < event_config.event_time, EEventAlreadyStarted);
        
        // Lấy người ĐẦU TIÊN trong hàng chờ (FIFO)
        let buyer = vector::remove(&mut waitlist.queue, 0);
        
        // Lấy deposit của buyer từ escrow
        let buyer_payment = table::remove(&mut deposit_escrow.deposits, buyer);
        
        // Transfer payment cho SELLER
        transfer::public_transfer(buyer_payment, seller);
        
        // Ticket owner sẽ tự động chuyển qua transfer::public_transfer
        let ticket_id = object::uid_to_inner(&ticket.id);
        
        // Cập nhật metadata
        let metadata = df::borrow_mut<TicketStateKey, TicketMetadata>(
            &mut ticket.id,
            TicketStateKey {}
        );
        metadata.last_updated = current_time;
        
        // Emit event
        event::emit(TicketSoldBack {
            ticket_id,
            seller,
            buyer,
            event_id: ticket.event_id,
            timestamp: current_time,
        });
        
        // Transfer vé cho BUYER
        transfer::public_transfer(ticket, buyer);
    }

    /// Leave waitlist và lấy lại deposit
    public entry fun leave_waitlist(
        waitlist: &mut WaitingList,
        deposit_escrow: &mut DepositEscrow,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        let (exists, index) = vector::index_of(&waitlist.queue, &user);
        
        if (exists) {
            vector::remove(&mut waitlist.queue, index);
            
            // Trả lại deposit
            if (table::contains(&deposit_escrow.deposits, user)) {
                let refund = table::remove(&mut deposit_escrow.deposits, user);
                transfer::public_transfer(refund, user);
            };
        };
    }

    /// Claim refund sau khi event kết thúc (nếu vẫn còn trong waitlist)
    public entry fun claim_waitlist_refund(
        waitlist: &WaitingList,
        deposit_escrow: &mut DepositEscrow,
        event_config: &EventConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Kiểm tra event đã kết thúc
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time > event_config.event_time, EEventNotStarted);
        
        // Kiểm tra user vẫn trong waitlist (không mua được vé)
        assert!(vector::contains(&waitlist.queue, &user), ENotTicketOwner);
        
        // Kiểm tra có deposit
        assert!(table::contains(&deposit_escrow.deposits, user), EInvalidPrice);
        
        // Refund deposit
        let refund = table::remove(&mut deposit_escrow.deposits, user);
        transfer::public_transfer(refund, user);
    }

    // ==================== Getter Functions ====================
    
    public fun get_ticket_state(ticket: &Ticket): u8 {
        ticket.state
    }

    public fun get_ticket_number(ticket: &Ticket): u64 {
        ticket.ticket_number
    }

    public fun get_event_info(event: &EventConfig): (String, u64, u64) {
        (event.name, event.event_time, event.original_price)
    }

    /// Lấy metadata từ dynamic field
    public fun get_ticket_metadata(ticket: &Ticket): (String, String, String) {
        let metadata = df::borrow<TicketStateKey, TicketMetadata>(
            &ticket.id,
            TicketStateKey {}
        );
        (metadata.image_url, metadata.description, metadata.qr_code)
    }

    /// Lấy thông tin waitlist
    public fun get_waitlist_info(waitlist: &WaitingList): (ID, u64) {
        (waitlist.event_id, vector::length(&waitlist.queue))
    }

    /// Kiểm tra user có trong waitlist không
    public fun is_in_waitlist(waitlist: &WaitingList, user: address): bool {
        vector::contains(&waitlist.queue, &user)
    }

    /// Lấy vị trí của user trong waitlist (0-indexed)
    public fun get_waitlist_position(waitlist: &WaitingList, user: address): u64 {
        let (exists, index) = vector::index_of(&waitlist.queue, &user);
        if (exists) {
            index
        } else {
            vector::length(&waitlist.queue) // Return length if not found
        }
    }

    // ==================== Helper Functions ====================
    
    fun generate_qr_code(_ticket_id: &ID): String {
        // tạm thời fake qr
        string::utf8(b"QR_CODE_")
    }

    // ==================== Test Functions ====================
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(DYNAMIC_TICKET {}, ctx);
    }

    #[test_only]
    use sui::test_scenario::{Self as ts};
    
    // Test helper: Tạo event cho testing
    #[test_only]
    public fun create_test_event(
        organizer: address,
        event_time: u64,
        price: u64,
        total_tickets: u64,
        ctx: &mut TxContext
    ): ID {
        let event_config = EventConfig {
            id: object::new(ctx),
            name: string::utf8(b"Test Event"),
            organizer,
            event_time,
            original_price: price,
            total_tickets,
            minted_tickets: 0,
            active_tickets: 0,
            venue: string::utf8(b"Test Venue"),
            description: string::utf8(b"Test Description"),
        };
        let event_id = object::uid_to_inner(&event_config.id);
        transfer::share_object(event_config);
        
        let waitlist = WaitingList {
            id: object::new(ctx),
            event_id,
            queue: vector::empty(),
        };
        transfer::share_object(waitlist);
        
        let deposit_escrow = DepositEscrow {
            id: object::new(ctx),
            event_id,
            deposits: table::new(ctx),
        };
        transfer::share_object(deposit_escrow);
        
        let treasury = EventTreasury {
            id: object::new(ctx),
            event_id,
            balance: coin::zero(ctx),
        };
        transfer::share_object(treasury);
        
        event_id
    }

    // ==================== TESTS ====================

    #[test]
    fun test_create_event() {
        let organizer = @0xA;
        let mut scenario = ts::begin(organizer);
        
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
        };
        
        ts::next_tx(&mut scenario, organizer);
        {
            let ctx = ts::ctx(&mut scenario);
            create_event(
                b"Tech Conference 2026",
                1738800000000, // Future timestamp
                2000000000, // 2 SUI
                100,
                b"Convention Center",
                b"Annual tech conference",
                ctx
            );
        };
        
        ts::next_tx(&mut scenario, organizer);
        {
            // Verify event was created and is shared
            assert!(ts::has_most_recent_shared<EventConfig>(), 0);
            assert!(ts::has_most_recent_shared<WaitingList>(), 1);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_mint_ticket() {
        let organizer = @0xA;
        let buyer = @0xB;
        let mut scenario = ts::begin(organizer);
        
        // Setup
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, buyer);
        {
            let mut event = ts::take_shared<EventConfig>(&scenario);
            let mut treasury = ts::take_shared<EventTreasury>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, &mut treasury, payment, &clock, ts::ctx(&mut scenario));
            
            assert!(event.minted_tickets == 1, 0);
            assert!(event.active_tickets == 1, 1);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
            ts::return_shared(treasury);
        };
        
        ts::next_tx(&mut scenario, buyer);
        {
            // Verify ticket was minted
            assert!(ts::has_most_recent_for_address<Ticket>(buyer), 1);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_check_in_ticket() {
        let organizer = @0xA;
        let buyer = @0xB;
        let mut scenario = ts::begin(organizer);
        
        // Setup: Create event and mint ticket
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, buyer);
        {
            let mut event = ts::take_shared<EventConfig>(&scenario);
            let mut treasury = ts::take_shared<EventTreasury>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, &mut treasury, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
            ts::return_shared(treasury);
        };
        
        // Check-in ticket
        ts::next_tx(&mut scenario, organizer);
        {
            let mut ticket = ts::take_from_address<Ticket>(&scenario, buyer);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            assert!(ticket.state == STATE_PENDING, 0);
            
            check_in_ticket(&mut ticket, &event, &clock, ts::ctx(&mut scenario));
            
            assert!(ticket.state == STATE_CHECKED_IN, 1);
            
            clock::destroy_for_testing(clock);
            ts::return_to_address(buyer, ticket);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_transform_to_commemorative() {
        let organizer = @0xA;
        let buyer = @0xB;
        let mut scenario = ts::begin(organizer);
        
        let event_time = 1738800000000; // Future event time
        
        // Setup and check-in
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, event_time, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, buyer);
        {
            let mut event = ts::take_shared<EventConfig>(&scenario);
            let mut treasury = ts::take_shared<EventTreasury>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, &mut treasury, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
            ts::return_shared(treasury);
        };
        
        ts::next_tx(&mut scenario, organizer);
        {
            let mut ticket = ts::take_from_address<Ticket>(&scenario, buyer);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            check_in_ticket(&mut ticket, &event, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_to_address(buyer, ticket);
            ts::return_shared(event);
        };
        
        // Transform to commemorative (after event + 24 hours)
        ts::next_tx(&mut scenario, buyer);
        {
            let mut ticket = ts::take_from_address<Ticket>(&scenario, buyer);
            let event = ts::take_shared<EventConfig>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            // Set clock to event_time + 25 hours (86400000ms = 24h, add extra 1 hour)
            clock::set_for_testing(&mut clock, event_time + 90000000); // +25 hours from event start
            
            transform_to_commemorative(&mut ticket, &event, &clock, ts::ctx(&mut scenario));
            
            assert!(ticket.state == STATE_COMMEMORATIVE, 0);
            
            clock::destroy_for_testing(clock);
            ts::return_to_address(buyer, ticket);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_join_waitlist() {
        let organizer = @0xA;
        let user = @0xB;
        let mut scenario = ts::begin(organizer);
        
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, user);
        {
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            assert!(vector::length(&waitlist.queue) == 0, 0);
            
            join_waitlist(&mut waitlist, &mut deposit_escrow, &event, payment, ts::ctx(&mut scenario));
            
            assert!(vector::length(&waitlist.queue) == 1, 1);
            assert!(vector::contains(&waitlist.queue, &user), 2);
            
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_sell_back_ticket() {
        let organizer = @0xA;
        let seller = @0xB;
        let buyer = @0xC;
        let mut scenario = ts::begin(organizer);
        
        // Setup event
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        // Seller mints ticket
        ts::next_tx(&mut scenario, seller);
        {
            let mut event = ts::take_shared<EventConfig>(&scenario);
            let mut treasury = ts::take_shared<EventTreasury>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, &mut treasury, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
            ts::return_shared(treasury);
        };
        
        // Buyer joins waitlist
        ts::next_tx(&mut scenario, buyer);
        {
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            join_waitlist(&mut waitlist, &mut deposit_escrow, &event, payment, ts::ctx(&mut scenario));
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        // Seller sells back ticket
        ts::next_tx(&mut scenario, seller);
        {
            let ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            assert!(vector::length(&waitlist.queue) == 1, 0);
            
            sell_back_ticket(ticket, &mut waitlist, &mut deposit_escrow, &event, &clock, ts::ctx(&mut scenario));
            
            // Waitlist should be empty now
            assert!(vector::length(&waitlist.queue) == 0, 1);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        // Verify buyer received ticket
        ts::next_tx(&mut scenario, buyer);
        {
            assert!(ts::has_most_recent_for_address<Ticket>(buyer), 2);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EAlreadyInWaitlist)]
    fun test_join_waitlist_twice_fails() {
        let organizer = @0xA;
        let user = @0xB;
        let mut scenario = ts::begin(organizer);
        
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, user);
        {
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let payment1 = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            let payment2 = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            join_waitlist(&mut waitlist, &mut deposit_escrow, &event, payment1, ts::ctx(&mut scenario));
            join_waitlist(&mut waitlist, &mut deposit_escrow, &event, payment2, ts::ctx(&mut scenario)); // Should fail
            
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = ECannotSellCheckedInTicket)]
    fun test_cannot_sell_checked_in_ticket() {
        let organizer = @0xA;
        let seller = @0xB;
        let buyer = @0xC;
        let mut scenario = ts::begin(organizer);
        
        // Setup and mint ticket
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, seller);
        {
            let mut event = ts::take_shared<EventConfig>(&scenario);
            let mut treasury = ts::take_shared<EventTreasury>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, &mut treasury, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
            ts::return_shared(treasury);
        };
        
        // Check-in ticket
        ts::next_tx(&mut scenario, organizer);
        {
            let mut ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            check_in_ticket(&mut ticket, &event, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_to_address(seller, ticket);
            ts::return_shared(event);
        };
        
        // Buyer joins waitlist
        ts::next_tx(&mut scenario, buyer);
        {
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            join_waitlist(&mut waitlist, &mut deposit_escrow, &event, payment, ts::ctx(&mut scenario));
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        // Try to sell checked-in ticket - should fail
        ts::next_tx(&mut scenario, seller);
        {
            let ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            sell_back_ticket(ticket, &mut waitlist, &mut deposit_escrow, &event, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EWaitlistEmpty)]
    fun test_sell_back_with_empty_waitlist_fails() {
        let organizer = @0xA;
        let seller = @0xB;
        let mut scenario = ts::begin(organizer);
        
        // Setup and mint ticket
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
            create_test_event(organizer, 1738800000000, 2000000000, 100, ctx);
        };
        
        ts::next_tx(&mut scenario, seller);
        {
            let mut event = ts::take_shared<EventConfig>(&scenario);
            let mut treasury = ts::take_shared<EventTreasury>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, &mut treasury, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
            ts::return_shared(treasury);
        };
        
        // Try to sell back with empty waitlist - should fail
        ts::next_tx(&mut scenario, seller);
        {
            let ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let mut deposit_escrow = ts::take_shared<DepositEscrow>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            sell_back_ticket(ticket, &mut waitlist, &mut deposit_escrow, &event, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(waitlist);
            ts::return_shared(deposit_escrow);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }
}
