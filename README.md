# 💍 Hỷ Sự — Quản lý lễ cưới & Thiệp cưới online

Ứng dụng Next.js 14 + Supabase để lập kế hoạch đám cưới, quản lý ngân sách và tạo **thiệp cưới online** hiện đại.

## Tính năng

### 💌 Thiệp cưới online (`/i/<đường-dẫn>`)
- **18 mẫu thiệp** trong 5 nhóm (Truyền thống, Lãng mạn, Hiện đại, Sang trọng, Thiên nhiên) — xem thử tại `/i/demo?t=<mã>`, ví dụ `lotus`, `indochine`, `royal`, `sakura`, `ocean`
- **7 bố cục trang bìa**: toàn màn hình, khung vòm, chia đôi, tối giản, khung ảnh, vòng tròn chữ chạy, polaroid
- **7 hoa văn nền**, 8 hiệu ứng (cánh hoa, tim, lá, tuyết, lấp lánh, pháo giấy, bong bóng)
- **Hiệu ứng mở phong bì** có con dấu, **cánh hoa / tim / lá / tuyết / lấp lánh** rơi, ảnh bìa zoom chậm, hiện dần khi cuộn
- **Nhạc nền** phát sau khi mở thiệp
- **Đếm ngược**, lịch tháng khoanh ngày cưới, **ngày âm lịch & năm can chi** tự động
- Giới thiệu cô dâu chú rể, **chuyện tình yêu** dạng timeline, **album ảnh** có lightbox (vuốt/phím mũi tên)
- **Sự kiện**: bản đồ Google Maps, chỉ đường, thêm vào Google Calendar / tải file `.ics`, dress code
- **Xác nhận tham dự (RSVP)** và **sổ lưu bút** cập nhật realtime
- **Hộp mừng cưới** với mã **VietQR** tự động cho 20 ngân hàng
- **Khách mời cá nhân hóa**: `/i/<slug>?g=<mã>` hiển thị “Kính gửi Anh Nam”, tự điền form RSVP
- Chia sẻ qua Web Share / Facebook / Zalo, ảnh xem trước (Open Graph)

### 🎨 Trình thiết kế thiệp (`/invitations/<id>`)
- Xem trước **trực tiếp** trong khung điện thoại / máy tính, tự động lưu (Ctrl+S để lưu ngay)
- Tùy chỉnh màu sắc (8 bảng màu có sẵn), font tiếng Việt, bố cục trang bìa, hiệu ứng, bo góc, độ tối ảnh bìa
- Bật/tắt, **sắp xếp thứ tự** và đổi tiêu đề từng phần của thiệp
- Tải ảnh / nhạc lên Supabase Storage hoặc dán link
- **Quản lý khách mời**: thêm từng người hoặc nhập nhanh hàng loạt, sao chép lời mời cá nhân, gửi SMS, đánh dấu đã gửi, xuất Excel
- **Thống kê phản hồi** realtime (sẽ đến / chưa chắc / không đến, nhà trai / nhà gái), ẩn/xóa lời chúc, xuất Excel
- Phát hành / bản nháp, đổi đường dẫn, mã QR, nhân bản thiệp

### 👤 Tài khoản & phân quyền
- Đăng ký, đăng nhập, **quên mật khẩu**, đổi mật khẩu, hồ sơ cá nhân có ảnh đại diện (`/account`)
- **Vai trò hệ thống**: `user` / `admin` — tài khoản đăng ký đầu tiên tự động là admin
- **Cộng tác dự án**: mời thành viên theo email với quyền **Biên tập** hoặc **Chỉ xem**
- Toàn bộ quyền được bảo vệ bằng **Row Level Security** trong Postgres (không chỉ ẩn nút trên giao diện)

### 🛡️ Trang quản trị (`/admin`, chỉ admin)
- Thống kê toàn hệ thống: người dùng, dự án, thiệp, lượt xem, phản hồi, lời chúc
- Quản lý người dùng: cấp/gỡ quyền admin, **khóa / mở khóa** tài khoản
- Quản lý thiệp (gỡ/phát hành, xóa) và dự án của mọi người dùng

### 📋 Quản lý kế hoạch cưới (có sẵn)
Dự án, Kanban đầu mục, ngân sách & chi tiêu theo danh mục, realtime.

## Cài đặt

```bash
npm install
cp .env.local.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

### Cơ sở dữ liệu (Supabase → SQL Editor)
1. Dự án mới: chạy `supabase/schema.sql`, sau đó `supabase/migrations/002_invitations_roles.sql`
2. Dự án đang chạy bản cũ: chỉ cần chạy `supabase/migrations/002_invitations_roles.sql` (chạy lại nhiều lần vẫn an toàn)

Migration 002 tạo bucket Storage `invitation-media` và bật realtime cho `rsvps`, `wishes`.

**Cấp quyền admin cho tài khoản có sẵn** (hệ thống cũ chưa có admin):
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'ban@example.com';
```

**Xác thực email / quên mật khẩu**: trong Supabase → Authentication → URL Configuration, thêm
`https://<domain-của-bạn>/auth/callback` vào *Redirect URLs*.

## Cấu trúc chính

```
src/app/i/[slug]          Trang thiệp công khai (SSR + Open Graph)
src/app/invitations       Danh sách & trình thiết kế thiệp
src/app/preview           Khung xem trước (iframe) của trình thiết kế
src/app/account           Tài khoản cá nhân
src/app/admin             Trang quản trị
src/components/invitation InvitationView + các phần của thiệp + trình thiết kế
src/lib/invitation        Mẫu thiệp, ngân hàng, âm lịch, lịch/bản đồ
supabase/migrations       Migration phân quyền & thiệp cưới
```
