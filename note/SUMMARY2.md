# 🎟️ Hệ thống Vé Sự kiện NFT trên Sui Blockchain

Hệ thống quản lý vé minh bạch, chống phe vé và tối ưu hóa vòng đời của vé từ lúc phát hành đến khi trở thành kỷ niệm chương (POAP).

---

## 📋 1. Các Thành phần Chính (Architecture)

| Thành phần | Loại | Chức năng |
| :--- | :--- | :--- |
| **`EventConfig`** | Object | Lưu trữ thông tin gốc: tên, thời gian, giá vé, người tổ chức. |
| **`Ticket`** | NFT | Vật phẩm đại diện cho quyền tham dự, có trạng thái động. |
| **`EventTreasury`** | Treasury | Quỹ chứa tiền bán vé, phục vụ hoàn tiền hoặc rút vốn. |
| **`WaitingList`** | Queue | Danh sách chờ tự động khi vé đã hết hàng. |
| **`DepositEscrow`** | Escrow | Nơi giữ tiền đặt cọc của người dùng trong hàng chờ. |

---

## 🔄 2. Vòng đời Tổng thể của Vé

Hệ thống được thiết kế để vé không chỉ là một tấm thẻ vào cổng mà là một thực thể thay đổi trạng thái theo thời gian:

1.  **Khởi tạo:** Người tổ chức thiết lập sự kiện và cấu hình thông số.
2.  **Phát hành (Mint):** Người dùng mua vé đúng giá gốc. Tiền nạp vào `Treasury`.
3.  **Hàng chờ (Waiting List):** Khi hết vé, người mua sau đặt cọc tiền để vào danh sách chờ.
4.  **Bán lại (Anti-Scalping):** * Chủ vé bán lại cho hệ thống (đúng giá gốc).
    * Hệ thống tự động chuyển vé cho người đầu hàng chờ.
    * Triệt tiêu hoàn toàn nạn phe vé thổi giá.
5.  **Sử dụng (Check-in):** Xác thực vé tại cổng, chuyển trạng thái sang "Đã sử dụng".
6.  **Kỷ niệm (POAP):** Sau sự kiện, vé chuyển thành huy hiệu kỹ niệm, không thể xóa bỏ.
7.  **Hoàn tiền (Refund):** Nếu sự kiện bị hủy, người dùng nhận lại 100% tiền từ quỹ.

---

## 🛠️ 3. Chi tiết các Nhóm Hàm (Functions)

### 🔹 Nhóm Khởi tạo & Quản lý
* `init`: Khởi tạo hiển thị NFT và quyền xuất bản (Publisher).
* `create_event`: Tạo sự kiện mới + Khởi tạo quỹ + Hàng chờ.
* `mint_ticket`: Mua vé (kiểm tra giá, số lượng còn lại).

### 🔹 Nhóm Check-in & Hậu sự kiện
* `check_in_ticket`: Chuyển vé sang trạng thái "Đã sử dụng", cập nhật mã QR.
* `transform_to_commemorative`: Chuyển đổi vé thành huy hiệu kỷ niệm sau sự kiện.

### 🔹 Nhóm Hàng chờ & Bán lại
* `join_waitlist`: Đặt cọc tiền để vào hàng chờ.
* `sell_back_ticket`: Bán lại vé cho hệ thống để khớp lệnh với người chờ.
* `leave_waitlist`: Rời hàng chờ và nhận lại tiền đặt cọc.
* `claim_waitlist_refund`: Nhận lại tiền cọc sau sự kiện nếu không mua được vé.

### 🔹 Nhóm Huỷ & Hoàn tiền
* `cancel_event`: Người tổ chức hủy sự kiện.
* `refund_ticket`: Người dùng yêu cầu hoàn tiền (vé sẽ bị hủy).
* `organizer_withdraw`: Người tổ chức rút tiền sau khi kết thúc giai đoạn hoàn tiền.

### 🔹 Nhóm Truy vấn (Read-only)
* `get_ticket_state` / `get_ticket_metadata`: Xem trạng thái và thông tin NFT.
* `get_event_info`: Xem thông tin sự kiện.
* `get_waitlist_position`: Kiểm tra vị trí trong hàng chờ.

---

## 💡 4. Ý nghĩa Thực tiễn

* **Công bằng:** Giá vé luôn được giữ ở mức gốc, bảo vệ người dùng khỏi "phe vé".
* **Minh bạch:** Mọi dòng tiền và trạng thái vé đều được ghi lại trên On-chain.
* **Tự động hóa:** Việc hoàn tiền và chuyển giao vé giữa người bán - người chờ diễn ra tự động qua Smart Contract.
* **Giá trị lâu dài:** Vé không mất đi mà trở thành tài sản số kỷ niệm, có thể dùng để xác thực quyền lợi cho các sự kiện về sau.