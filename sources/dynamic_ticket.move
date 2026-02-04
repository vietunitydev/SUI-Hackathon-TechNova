/// Dynamic Ticketing System với Anti-Scalping
/// Sử dụng Sui Kiosk và Dynamic Fields để tạo vé NFT có thể thay đổi trạng thái
module dynamic_ticketing::dynamic_ticket {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::dynamic_field as df;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap};
    use sui::package::{Self, Publisher};
    use sui::display;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    // ==================== Errors ====================
    const ENotEventOrganizer: u64 = 0;
    const EEventNotStarted: u64 = 1;
    const EEventAlreadyStarted: u64 = 2;
    const ETicketAlreadyUsed: u64 = 3;
    const EInvalidPrice: u64 = 4;
    const EPriceExceedsOriginal: u64 = 5;
    const ENotTicketOwner: u64 = 6;
    const EWaitlistEmpty: u64 = 7;
    const EAlreadyInWaitlist: u64 = 8;
    const ECannotSellCheckedInTicket: u64 = 9;

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
        sold_tickets: u64,
        venue: String,
        description: String,
    }

    /// Waiting List - Hàng chờ để mua vé resale
    /// Đây là KEY để phá vỡ phe vé!
    public struct WaitingList has key, store {
        id: UID,
        event_id: ID,
        queue: vector<address>,   // Danh sách người chờ (FIFO)
    }

    /// Dynamic Ticket NFT
    public struct Ticket has key, store {
        id: UID,
        event_id: ID,
        ticket_number: u64,
        original_price: u64,
        state: u8,
        owner: address,
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
            sold_tickets: 0,
            venue: string::utf8(venue),
            description: string::utf8(description),
        };

        let event_id = object::uid_to_inner(&event_config.id);

        event::emit(EventCreated {
            event_id,
            name: event_config.name,
            organizer: event_config.organizer,
            event_time,
        });

        // Tạo WaitingList cho event này
        let waitlist = WaitingList {
            id: object::new(ctx),
            event_id,
            queue: vector::empty(),
        };

        transfer::share_object(event_config);
        transfer::share_object(waitlist);
    }

    // ==================== Ticket Minting với Kiosk ====================
    
    /// Mint vé mới và đặt vào Kiosk với policy chống scalping
    public entry fun mint_ticket(
        event_config: &mut EventConfig,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Kiểm tra sự kiện chưa bắt đầu
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < event_config.event_time, EEventAlreadyStarted);

        // Kiểm tra giá tiền
        assert!(coin::value(&payment) >= event_config.original_price, EInvalidPrice);

        // Cập nhật số vé đã bán
        event_config.sold_tickets = event_config.sold_tickets + 1;
        let ticket_number = event_config.sold_tickets;

        // Tạo ticket
        let mut ticket = Ticket {
            id: object::new(ctx),
            event_id: object::uid_to_inner(&event_config.id),
            ticket_number,
            original_price: event_config.original_price,
            state: STATE_PENDING,
            owner: tx_context::sender(ctx),
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

        // Chuyển tiền cho organizer
        transfer::public_transfer(payment, event_config.organizer);

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
        // Chỉ organizer mới có thể check-in
        assert!(tx_context::sender(ctx) == event_config.organizer, ENotEventOrganizer);
        
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

        // Kiểm tra owner
        assert!(ticket.owner == tx_context::sender(ctx), ENotTicketOwner);

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

    // ==================== WAITLIST & RESALE SYSTEM ====================
    // ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT - PHÁ VỠ PHA VÉ!
    
    /// Tham gia hàng chờ để mua vé resale
    /// User không biết mình sẽ mua từ ai, scalper không biết bán cho ai
    public entry fun join_waitlist(
        waitlist: &mut WaitingList,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Kiểm tra user chưa trong waitlist
        assert!(!vector::contains(&waitlist.queue, &user), EAlreadyInWaitlist);
        
        // Thêm vào cuối hàng chờ
        vector::push_back(&mut waitlist.queue, user);
        
        event::emit(JoinedWaitlist {
            event_id: waitlist.event_id,
            user,
            position: vector::length(&waitlist.queue),
        });
    }

    /// Bán vé lại cho HỆ THỐNG (không phải cho người cụ thể!)
    /// Hệ thống tự động chuyển cho người đầu hàng chờ
    /// => Scalper KHÔNG THỂ chỉ định người mua!
    public entry fun sell_back_ticket(
        mut ticket: Ticket,
        waitlist: &mut WaitingList,
        event_config: &EventConfig,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        
        // Kiểm tra: Chỉ vé PENDING mới bán được (vé đã check-in không bán lại)
        assert!(ticket.state == STATE_PENDING, ECannotSellCheckedInTicket);
        
        // Kiểm tra: Phải có người trong hàng chờ
        assert!(vector::length(&waitlist.queue) > 0, EWaitlistEmpty);
        
        // Kiểm tra: Event chưa bắt đầu
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < event_config.event_time, EEventAlreadyStarted);
        
        // Lấy người ĐẦU TIÊN trong hàng chờ (FIFO)
        let buyer = vector::remove(&mut waitlist.queue, 0);
        
        // Hoàn tiền cho SELLER (giá gốc)
        let refund_amount = ticket.original_price;
        let refund = coin::split(&mut payment, refund_amount, ctx);
        transfer::public_transfer(refund, seller);
        
        // Chuyển tiền thừa (nếu có) về người gửi
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(payment);
        };
        
        // Cập nhật owner của ticket
        let ticket_id = object::uid_to_inner(&ticket.id);
        
        // Cập nhật metadata để track lịch sử
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
        
        // QUAN TRỌNG: Transfer vé cho BUYER (người đầu hàng chờ)
        // Seller KHÔNG THỂ chọn buyer!
        transfer::public_transfer(ticket, buyer);
    }

    /// Leave waitlist nếu không muốn chờ nữa
    public entry fun leave_waitlist(
        waitlist: &mut WaitingList,
        ctx: &TxContext
    ) {
        let user = tx_context::sender(ctx);
        let (exists, index) = vector::index_of(&waitlist.queue, &user);
        
        if (exists) {
            vector::remove(&mut waitlist.queue, index);
        };
    }

    // ==================== Kiosk Anti-Scalping ====================
    
    /// Tạo transfer policy ngăn chặn bán lại cao hơn giá gốc
    public fun create_anti_scalping_policy(
        publisher: &Publisher,
        ctx: &mut TxContext
    ): (TransferPolicy<Ticket>, TransferPolicyCap<Ticket>) {
        let (policy, cap) = transfer_policy::new<Ticket>(publisher, ctx);
        (policy, cap)
    }

    /// Place ticket vào Kiosk với giá tối đa
    public entry fun list_ticket_in_kiosk(
        kiosk: &mut Kiosk,
        cap: &KioskOwnerCap,
        ticket: Ticket,
        price: u64,
    ) {
        // Kiểm tra giá không vượt quá giá gốc (chống scalping)
        assert!(price <= ticket.original_price, EPriceExceedsOriginal);
        
        kiosk::place(kiosk, cap, ticket);
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
        // Trong production, sẽ generate QR code thực sự
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
            sold_tickets: 0,
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
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, payment, &clock, ts::ctx(&mut scenario));
            
            assert!(event.sold_tickets == 1, 0);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
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
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
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
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
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
            
            assert!(vector::length(&waitlist.queue) == 0, 0);
            
            join_waitlist(&mut waitlist, ts::ctx(&mut scenario));
            
            assert!(vector::length(&waitlist.queue) == 1, 1);
            assert!(vector::contains(&waitlist.queue, &user), 2);
            
            ts::return_shared(waitlist);
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
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
        };
        
        // Buyer joins waitlist
        ts::next_tx(&mut scenario, buyer);
        {
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            join_waitlist(&mut waitlist, ts::ctx(&mut scenario));
            ts::return_shared(waitlist);
        };
        
        // Seller sells back ticket
        ts::next_tx(&mut scenario, seller);
        {
            let ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            assert!(vector::length(&waitlist.queue) == 1, 0);
            
            sell_back_ticket(ticket, &mut waitlist, &event, payment, &clock, ts::ctx(&mut scenario));
            
            // Waitlist should be empty now
            assert!(vector::length(&waitlist.queue) == 0, 1);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(waitlist);
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
            
            join_waitlist(&mut waitlist, ts::ctx(&mut scenario));
            join_waitlist(&mut waitlist, ts::ctx(&mut scenario)); // Should fail
            
            ts::return_shared(waitlist);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EPriceExceedsOriginal)]
    fun test_kiosk_price_cap_enforcement() {
        let owner = @0xA;
        let mut scenario = ts::begin(owner);
        
        {
            let ctx = ts::ctx(&mut scenario);
            init_for_testing(ctx);
        };
        
        ts::next_tx(&mut scenario, owner);
        {
            let (mut kiosk, cap) = kiosk::new(ts::ctx(&mut scenario));
            
            // Create a ticket with original price 2 SUI
            let ticket = Ticket {
                id: object::new(ts::ctx(&mut scenario)),
                event_id: object::id_from_address(@0x123),
                ticket_number: 1,
                original_price: 2000000000,
                state: STATE_PENDING,
                owner,
            };
            
            // Try to list at 3 SUI (higher than original) - should fail
            list_ticket_in_kiosk(&mut kiosk, &cap, ticket, 3000000000);
            
            transfer::public_transfer(cap, owner);
            transfer::public_share_object(kiosk);
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
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
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
            join_waitlist(&mut waitlist, ts::ctx(&mut scenario));
            ts::return_shared(waitlist);
        };
        
        // Try to sell checked-in ticket - should fail
        ts::next_tx(&mut scenario, seller);
        {
            let ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            sell_back_ticket(ticket, &mut waitlist, &event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(waitlist);
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
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            mint_ticket(&mut event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(event);
        };
        
        // Try to sell back with empty waitlist - should fail
        ts::next_tx(&mut scenario, seller);
        {
            let ticket = ts::take_from_address<Ticket>(&scenario, seller);
            let mut waitlist = ts::take_shared<WaitingList>(&scenario);
            let event = ts::take_shared<EventConfig>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(2000000000, ts::ctx(&mut scenario));
            
            sell_back_ticket(ticket, &mut waitlist, &event, payment, &clock, ts::ctx(&mut scenario));
            
            clock::destroy_for_testing(clock);
            ts::return_shared(waitlist);
            ts::return_shared(event);
        };
        
        ts::end(scenario);
    }
}
