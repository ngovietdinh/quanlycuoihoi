# FamilyPlan — Thiệp cưới online, quản lý lễ cưới & gia đình

**Tác giả:** Ngô Viết Định · © 2026 Ngô Viết Định. Bảo lưu mọi quyền.

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

### 📋 Quản lý sự kiện cưới (`/projects/<id>`)
- **Công việc**: Kanban (kéo thả, nút chuyển trạng thái trên điện thoại) hoặc Danh sách; tìm kiếm, lọc theo ưu tiên / nhãn / người phụ trách; thêm nhanh; giao việc cho thành viên; 24 việc chuẩn bị cưới mẫu; xuất Excel
- **Ngân sách**: chi tiêu theo danh mục, sửa/xóa khoản chi, dự báo "đã chi + còn phải trả nhà cung cấp", xuất Excel
- **Nhà cung cấp**: nhà hàng, studio, trang điểm… kèm liên hệ, gọi/Zalo, giá hợp đồng, hạn thanh toán, đánh giá; ghi thanh toán tự cộng vào Ngân sách
- **Lịch trình ngày cưới**: kịch bản theo giờ, mẫu lễ cưới truyền thống, đánh dấu đang diễn ra, in ra giấy
- **Thành viên**: mời theo email với quyền Biên tập / Chỉ xem; cập nhật realtime giữa các thành viên

### 🏡 Quản lý gia đình (`/family`)
Dùng chung cho cả nhà: tạo **gia đình**, mời vợ/chồng, bố mẹ… theo email với quyền **Biên tập** / **Chỉ xem**; dữ liệu riêng tư (kể cả admin cũng không xem được), cập nhật realtime.
- **Tổng quan**: thu/chi tháng, danh sách *Cần chú ý* tự tổng hợp (hóa đơn đến hạn, vượt ngân sách, mũi tiêm quá hạn, giấy tờ sắp hết hạn, khoản vay/nợ đến hạn)
- **Thu chi**: nhiều ví (tiền mặt, ngân hàng, ví điện tử…), chuyển ví, thu nhập theo từng thành viên; **ngân sách tháng** theo danh mục kèm cảnh báo; **khoản định kỳ** (tháng/quý/năm) có nhắc hạn và nút "Đã trả"; báo cáo 12 tháng, chi theo danh mục / thành viên / con, xuất Excel
- **Thai sản**: theo dõi thai kỳ theo tuần (kích thước thai nhi), các mốc khám quan trọng, nhật ký khám & cân nặng mẹ, **dự toán chi phí sinh**, **tính chế độ thai sản BHXH** (Luật BHXH 2024, tham khảo), danh sách đồ sơ sinh
- **Con cái**: hồ sơ từng bé, **lịch tiêm chủng tự động** (TCMR + dịch vụ), **biểu đồ tăng trưởng** so với chuẩn WHO, chi phí nuôi con & học phí, nhật ký cột mốc / khám bệnh
- **Tiết kiệm & tài sản**: mục tiêu tiết kiệm (góp/rút), **khoản vay & trả góp** có lịch trả nợ (dư nợ giảm dần / niên kim), cho vay – đi vay, **sổ hiếu hỉ**, tài sản, giấy tờ quan trọng có hạn; giá trị ròng của gia đình

> Các số liệu y tế, tiêm chủng, BHXH chỉ mang tính tham khảo — luôn theo chỉ định của bác sĩ và cơ quan BHXH.

## Cài đặt

```bash
npm install
cp .env.local.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

### Cơ sở dữ liệu (Supabase → SQL Editor)
Chạy lần lượt trong SQL Editor (mỗi file chạy lại nhiều lần vẫn an toàn):
1. `supabase/schema.sql` — chỉ với dự án Supabase mới
2. `supabase/migrations/002_invitations_roles.sql` — tài khoản, phân quyền, thiệp cưới
3. `supabase/migrations/003_vendors_schedule.sql` — nhà cung cấp, lịch trình ngày cưới
4. `supabase/migrations/004_family.sql` — quản lý gia đình (thu chi, thai sản, con cái, tiết kiệm, tài sản)
5. `supabase/migrations/005_fix_signup.sql` — sửa lỗi 500 khi đăng ký trên DB có sẵn (trigger tạo hồ sơ)

Migration 002 tạo bucket Storage `invitation-media` và bật realtime cho `rsvps`, `wishes`.

**Cấp quyền admin cho tài khoản có sẵn** (hệ thống cũ chưa có admin):
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'ban@example.com';
```

### Email đăng ký / liên kết đăng nhập (Supabase → Authentication)
1. **URL Configuration**: *Site URL* = địa chỉ web thật (vd. `https://familyplan.vercel.app`, **không** để `http://localhost:3000`);
   *Redirect URLs* thêm `https://<domain>/auth/callback` (mỗi domain một dòng: Vercel, Cloudflare, tên miền riêng).
2. **Emails → Templates**: dán nội dung các file trong `supabase/email-templates/` vào *Confirm signup*, *Magic Link*, *Reset Password*.
   Mẫu này dùng liên kết `token_hash` (mở được trên mọi thiết bị) và kèm mã số để nhập trực tiếp trong ứng dụng.
3. **Emails → SMTP Settings**: máy chủ email mặc định của Supabase chỉ gửi ~2 email/giờ và chỉ tới email thành viên dự án.
   Để người dùng thật nhận được email, bật *Custom SMTP* (Resend, Brevo, Gmail App Password…).

### Triển khai lên Cloudflare Workers (tùy chọn, thay cho Vercel)
Dự án đã cấu hình sẵn `@opennextjs/cloudflare` (`wrangler.jsonc`, `open-next.config.ts`).
- Cloudflare Dashboard → **Workers & Pages → Create → Import a repository** → chọn repo này
- **Build command**: `npx opennextjs-cloudflare build` · **Deploy command**: `npx opennextjs-cloudflare deploy`
- **Build variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (bắt buộc đặt lúc *build*)
- Supabase → Authentication → URL Configuration: thêm `https://<tên>.<tài-khoản>.workers.dev/auth/callback`
- Chạy thử trên máy: `npm run cf:preview` · Deploy từ máy: `npx wrangler login` rồi `npm run cf:deploy`

## Cấu trúc chính

```
src/app/i/[slug]          Trang thiệp công khai (SSR + Open Graph)
src/app/invitations       Danh sách & trình thiết kế thiệp
src/app/preview           Khung xem trước (iframe) của trình thiết kế
src/app/account           Tài khoản cá nhân
src/app/admin             Trang quản trị
src/app/family            Quản lý gia đình (thu chi, thai sản, con cái, tiết kiệm)
src/lib/family            Danh mục, lịch tiêm, chuẩn WHO, BHXH, lịch trả nợ
src/components/invitation InvitationView + các phần của thiệp + trình thiết kế
src/lib/invitation        Mẫu thiệp, ngân hàng, âm lịch, lịch/bản đồ
supabase/migrations       Migration phân quyền & thiệp cưới
```
