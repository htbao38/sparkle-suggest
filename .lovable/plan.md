

# Plan: Tạo tài liệu đặc tả chức năng + biểu đồ Mermaid cho LUXE JEWELRY

## Tổng quan
Tạo file DOCX chứa bảng đặc tả Use Case cho tất cả chức năng, đồng thời tạo các file Mermaid (.mmd) riêng cho từng loại biểu đồ.

## Danh sách chức năng đã xác định

**Tác nhân: User (Customer)**
1. Đăng ký tài khoản
2. Đăng nhập
3. Đăng xuất
4. Xem trang chủ (sản phẩm nổi bật, danh mục)
5. Tìm kiếm sản phẩm
6. Xem danh sách sản phẩm (lọc theo danh mục)
7. Xem chi tiết sản phẩm
8. Thêm sản phẩm vào giỏ hàng
9. Quản lý giỏ hàng (cập nhật số lượng, xóa)
10. Đặt hàng (checkout)
11. Xem lịch sử đơn hàng
12. Thêm/xóa sản phẩm yêu thích
13. Xem lịch sử sản phẩm đã xem
14. Cập nhật thông tin cá nhân

**Tác nhân: Admin**
1. Quản lý sản phẩm (CRUD)
2. Quản lý đơn hàng (xem, cập nhật trạng thái)
3. Xem thống kê (doanh thu, số đơn, tồn kho)

## Các artifact sẽ tạo

### File DOCX (`LuxeJewelry_UseCase_Spec.docx`)
- Bảng đặc tả Use Case cho ~17 chức năng (format giống ảnh mẫu: Tác nhân, Mô tả, Tiền điều kiện, Hậu điều kiện, Luồng chính, Luồng phụ)

### Các file Mermaid (.mmd)
1. **use_case_tong_quat.mmd** - Biểu đồ Use Case tổng quát (cả User + Admin)
2. **use_case_user.mmd** - Use Case riêng tác nhân User
3. **use_case_admin.mmd** - Use Case riêng tác nhân Admin
4. **erd.mmd** - Biểu đồ ERD (10 bảng: products, profiles, orders, order_items, cart_items, wishlist_items, user_behaviors, user_roles, product_variants, product_recommendations)
5. **class_user.mmd** - Biểu đồ lớp User
6. **class_admin.mmd** - Biểu đồ lớp Admin
7. **activity_user_dang_ky.mmd** - Biểu đồ hoạt động: Đăng ký
8. **activity_user_dat_hang.mmd** - Biểu đồ hoạt động: Đặt hàng
9. **activity_user_gio_hang.mmd** - Biểu đồ hoạt động: Thêm giỏ hàng
10. **activity_admin_quan_ly_sp.mmd** - Biểu đồ hoạt động: Quản lý sản phẩm
11. **activity_admin_quan_ly_dh.mmd** - Biểu đồ hoạt động: Quản lý đơn hàng
12. **sequence_user_mua_hang.mmd** - Biểu đồ tuần tự: User mua hàng
13. **sequence_user_dang_ky.mmd** - Biểu đồ tuần tự: User đăng ký
14. **sequence_admin_crud_sp.mmd** - Biểu đồ tuần tự: Admin CRUD sản phẩm
15. **sequence_admin_cap_nhat_dh.mmd** - Biểu đồ tuần tự: Admin cập nhật đơn hàng

## Quy trình thực hiện
1. Tạo script Node.js sinh file DOCX với bảng đặc tả Use Case
2. Tạo từng file .mmd cho các biểu đồ Mermaid
3. QA file DOCX (convert sang image, kiểm tra)
4. Xuất tất cả vào `/mnt/documents/`

