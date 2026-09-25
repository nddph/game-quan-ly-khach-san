# Hotel Management Simulation

Phase 1 playable vertical slice của offline-first mobile hotel management PWA.

## Stack

- React + TypeScript + Vite
- `vite-plugin-pwa` cho app shell và service worker
- SQLite WASM trong Web Worker
- OPFS SQLite VFS khi trình duyệt hỗ trợ
- Local checkpoint fallback khi OPFS VFS không khả dụng
- VND là currency chuẩn nội bộ
- Game clock ratio `1 real minute = 10 game minutes`

## Chơi Phase 1

```bash
npm install
npm run dev
```

Mở `http://localhost:5173` bằng Chrome.

Các bước chơi:

1. Nhập tên khách sạn.
2. Mở tab **Khách**.
3. Chọn khách Solo, Du lịch, Công tác, Gia đình hoặc Đôi.
4. Chọn phòng còn trống.
5. Nhập giá VND mỗi đêm và gửi offer.
6. Xử lý accept hoặc thương lượng.
7. Bấm **Kết ca** để qua ngày và checkout khách.
8. Theo dõi check-in/checkout tại tab **Lưu trú**.
9. Sửa phòng khi tình trạng dưới 40%.
10. Xem doanh thu, thuế, bồi thường và uy tín tại **Tài chính**.

## Công thức tài chính Phase 1

- Doanh thu được ghi nhận khi khách checkout: `giá mỗi đêm × số đêm`.
- Chi phí vận hành: `800.000 VND mỗi kết ca`.
- Thuế prototype: `20%` trên lợi nhuận dương trước thuế.
- Bồi thường và sửa phòng trừ trực tiếp vào cash.
- `Thay đổi tiền mặt = doanh thu − chi phí − thuế − bồi thường − sửa phòng`.

## Kiểm tra

```bash
npm run lint
npm run build
npm run preview
```

PWA cần HTTPS hoặc `localhost` để service worker và OPFS hoạt động đúng.

## Nếu Chrome không mở được

- Không mở trực tiếp `index.html` bằng `file://`.
- Không dùng Live Server của Visual Studio Code cho PWA này; Live Server không cấp header COOP/COEP và không phải Vite server.
- Chạy `npm run dev`, rồi mở đúng URL Vite in ra trong terminal.
- Nếu test trên điện thoại qua Wi-Fi, chạy `npm run dev:lan` và mở bằng IP máy tính; PWA/OPFS production vẫn cần HTTPS.
- Xóa site data của `localhost:5173` nếu service worker cũ đang gây lỗi.

## Asset

Cozy placeholder assets được tạo bằng SVG gốc trong `src/components/CozyAssets.tsx`:

- Hotel mark
- Hotel scene
- Standard/Deluxe room art
- City/Sea view art
- Solo, Tourist, Business, Family, Couple avatars

Không dùng asset hoặc ảnh có bản quyền từ bên ngoài. Các asset này có thể thay bằng illustration production sau này.

## Persistence note

Đường ưu tiên là SQLite WASM với OPFS. Một số Chrome build có `navigator.storage.getDirectory()` nhưng chưa expose synchronous OPFS file API mà SQLite OPFS VFS yêu cầu. Khi đó game giữ SQLite session và dùng local checkpoint fallback để vẫn test save/reload offline được.

Fallback chỉ là safety net của spike; persistence production cần được xác minh lại trên Chrome Android mục tiêu.
