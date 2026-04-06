# 💎 LUXE JEWELRY – Hệ thống bán trang sức trực tuyến

> Ứng dụng thương mại điện tử chuyên trang sức cao cấp, tích hợp AI gợi ý sản phẩm thông minh, chatbot tư vấn và quản trị toàn diện.

🔗 **Demo:** [https://luxejewelry.lovable.app](https://luxejewelry.lovable.app)

---

## 📋 Mục lục

- [Vấn đề & Giải pháp](#-vấn-đề--giải-pháp)
- [Tính năng](#-tính-năng)
- [Tech Stack & Kiến trúc](#-tech-stack--kiến-trúc)
- [Cơ sở dữ liệu (ERD)](#-cơ-sở-dữ-liệu)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Deploy](#-deploy)
- [License](#-license)

---

## 🎯 Vấn đề & Giải pháp

| Vấn đề | Giải pháp |
|---------|-----------|
| Người dùng khó tìm sản phẩm phù hợp trong hàng trăm mẫu trang sức | Hệ thống gợi ý AI phân tích hành vi (xem, mua, yêu thích) để đề xuất cá nhân hóa |
| Thiếu kênh tư vấn trực tuyến 24/7 | Chatbot AI tích hợp Gemini hỗ trợ tư vấn sản phẩm real-time |
| Quản lý đơn hàng & tồn kho thủ công, dễ sai sót | Hệ thống admin tự động cập nhật tồn kho, thống kê doanh thu, gợi ý nhập hàng |

---

## ✨ Tính năng

### 👤 Người dùng (Customer)

| # | Chức năng | Mô tả |
|---|-----------|-------|
| 1 | **Đăng ký / Đăng nhập** | Email + mật khẩu, xác thực qua Supabase Auth |
| 2 | **Xem sản phẩm** | Danh sách, chi tiết, lọc theo danh mục & chất liệu |
| 3 | **Tìm kiếm thời gian thực** | Live search với debounce 300ms, gợi ý khi gõ ≥ 2 ký tự |
| 4 | **Giỏ hàng** | Thêm/xóa/cập nhật số lượng, tự động trừ tồn kho |
| 5 | **Danh sách yêu thích** | Lưu sản phẩm yêu thích vào tài khoản |
| 6 | **Đặt hàng & Thanh toán** | Chọn địa chỉ có sẵn hoặc thêm mới, tự động điền thông tin |
| 7 | **Quản lý đơn hàng** | Xem chi tiết, hủy đơn (khi còn ở trạng thái chờ xác nhận) |
| 8 | **Quản lý địa chỉ** | Lưu nhiều địa chỉ, đặt mặc định |
| 9 | **Gợi ý sản phẩm AI** | Đề xuất dựa trên lịch sử xem, mua, yêu thích (Collaborative Filtering) |
| 10 | **Chatbot AI** | Tư vấn sản phẩm qua Gemini, truy vấn database real-time |

### 🛡️ Quản trị viên (Admin)

| # | Chức năng | Mô tả |
|---|-----------|-------|
| 1 | **CRUD Sản phẩm** | Thêm/sửa/xóa sản phẩm, upload ảnh lên Storage |
| 2 | **Quản lý đơn hàng** | Cập nhật trạng thái, chỉnh sửa chi tiết đơn |
| 3 | **Quản lý người dùng** | Xem danh sách, phân quyền admin |
| 4 | **Thống kê doanh thu** | Biểu đồ doanh thu theo tháng (Recharts) |
| 5 | **Gợi ý nhập hàng** | Phân tích sản phẩm bán chạy, cảnh báo hết hàng |

### 🤖 Hệ thống gợi ý (Recommendation Engine)

- **Thu thập hành vi**: Ghi nhận `view`, `cart`, `wishlist`, `purchase` vào bảng `user_behaviors`
- **Phân tích**: Edge Function chạy Collaborative Filtering (cosine similarity)
- **Kết quả**: Lưu vào `product_recommendations`, hiển thị trên trang chủ & chatbot
- **Cập nhật**: Tự động qua cron job hoặc trigger khi có hành vi mới

---

## 🛠 Tech Stack & Kiến trúc

```
┌─────────────────────────────────────────────┐
│              FRONTEND (SPA)                 │
│  React 18 + TypeScript 5 + Vite 5           │
│  Tailwind CSS v3 + shadcn/ui                │
│  React Router v6 + TanStack Query v5        │
│  Recharts (biểu đồ)                        │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼──────────────────────────┐
│            LOVABLE CLOUD (Backend)          │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Supabase   │  │   Edge Functions     │  │
│  │  PostgreSQL │  │  - chatbot (Gemini)  │  │
│  │  + RLS      │  │  - recommendations   │  │
│  │  + Triggers │  │  - admin-setup       │  │
│  └─────────────┘  └──────────────────────┘  │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Auth       │  │  Storage             │  │
│  │  (Email)    │  │  (product-images)    │  │
│  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘
```

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS v3, shadcn/ui, CSS Variables (HSL) |
| **State Management** | TanStack Query v5, React Context |
| **Routing** | React Router v6 (lazy loading) |
| **Backend** | Lovable Cloud (Supabase) – PostgreSQL, Edge Functions |
| **AI** | Google Gemini (via Lovable AI Gateway) |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (product-images bucket) |
| **Charts** | Recharts |
| **Testing** | Vitest + Testing Library |

---

## 🗄 Cơ sở dữ liệu

### Bảng chính

| Bảng | Mô tả |
|------|-------|
| `products` | Sản phẩm (tên, giá, danh mục, chất liệu, tồn kho, ảnh) |
| `product_variants` | Biến thể sản phẩm (kích thước, giá điều chỉnh) |
| `profiles` | Thông tin người dùng (tên, SĐT, ảnh đại diện) |
| `user_roles` | Phân quyền (admin / customer) |
| `user_addresses` | Địa chỉ giao hàng (nhiều địa chỉ/user) |
| `orders` | Đơn hàng (trạng thái, tổng tiền, thông tin giao hàng) |
| `order_items` | Chi tiết đơn hàng (sản phẩm, số lượng, giá) |
| `cart_items` | Giỏ hàng |
| `wishlist_items` | Danh sách yêu thích |
| `user_behaviors` | Hành vi người dùng (view, cart, wishlist, purchase) |
| `product_recommendations` | Kết quả gợi ý AI |

### Quan hệ (ERD tóm tắt)

```
auth.users ──1:1──▶ profiles
auth.users ──1:N──▶ user_roles
auth.users ──1:N──▶ user_addresses
auth.users ──1:N──▶ orders ──1:N──▶ order_items ──N:1──▶ products
auth.users ──1:N──▶ cart_items ──N:1──▶ products
auth.users ──1:N──▶ wishlist_items ──N:1──▶ products
auth.users ──1:N──▶ user_behaviors ──N:1──▶ products
products ──1:N──▶ product_variants
products ──1:N──▶ product_recommendations
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu

- Node.js ≥ 18
- npm hoặc bun

### Chạy local

```bash
# 1. Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Cài đặt dependencies
npm install

# 3. Chạy development server
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Chạy tests

```bash
npm test
```

---

## 🌐 Deploy

Dự án được deploy tự động qua [Lovable](https://lovable.dev):

1. Mở project trên Lovable
2. Click **Share → Publish**
3. Ứng dụng live tại: [https://luxejewelry.lovable.app](https://luxejewelry.lovable.app)

---

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── admin/          # OrderEditor, RevenueChart, UserManagement
│   ├── chat/           # AIChatbot
│   ├── home/           # HeroSection, FeaturedProducts, CategorySection
│   ├── layout/         # Header, Footer, Layout
│   ├── products/       # ProductCard, ProductGrid, RecommendedProducts
│   ├── search/         # LiveSearchDropdown
│   ├── account/        # AddressManager
│   └── ui/             # shadcn/ui components
├── hooks/              # useAuth, useCart, useWishlist, useRecommendations
├── pages/              # Index, Products, ProductDetail, Cart, Checkout, Orders, Admin...
├── integrations/       # Supabase client & types
├── lib/                # Utils, constants, validations
└── test/               # Vitest test suites
supabase/
├── functions/          # Edge Functions (chatbot, recommendations, admin-setup)
└── config.toml
```

---

## 📄 License

Dự án này được phân phối dưới giấy phép [MIT](LICENSE).

```
MIT License

Copyright (c) 2024 LUXE JEWELRY

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
