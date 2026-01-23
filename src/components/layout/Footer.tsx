import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-onyx text-pearl">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold text-gold mb-6">
              LUXE JEWELRY
            </h3>
            <p className="text-pearl/70 text-sm leading-relaxed mb-6">
              Thương hiệu trang sức cao cấp với hơn 30 năm kinh nghiệm, 
              mang đến những sản phẩm tinh xảo và đẳng cấp cho khách hàng.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gold transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-gold transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-gold transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Danh mục</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/san-pham?category=nhan" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Nhẫn
                </Link>
              </li>
              <li>
                <Link to="/san-pham?category=day_chuyen" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Dây chuyền
                </Link>
              </li>
              <li>
                <Link to="/san-pham?category=vong_tay" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Vòng tay
                </Link>
              </li>
              <li>
                <Link to="/san-pham?category=bong_tai" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Bông tai
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Hỗ trợ</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/huong-dan" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link to="/chinh-sach" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link to="/bao-hanh" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link to="/thanh-toan" className="text-pearl/70 hover:text-gold text-sm transition-colors">
                  Phương thức thanh toán
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-pearl/70 text-sm">Hotline</p>
                  <p className="font-medium">1800 54 54 57</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-pearl/70 text-sm">Email</p>
                  <p className="font-medium">contact@luxejewelry.vn</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-pearl/70 text-sm">Địa chỉ</p>
                  <p className="font-medium">170E Phan Đăng Lưu, Q. Phú Nhuận, TP.HCM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-pearl/10 mt-12 pt-8 text-center">
          <p className="text-pearl/50 text-sm">
            © 2024 Luxe Jewelry. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
