import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-jewelry.jpg';

export function HeroSection() {
  return (
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Luxury Jewelry"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-xl animate-fade-in-up">
          <span className="inline-block text-gold-light font-body text-sm uppercase tracking-[0.3em] mb-4">
            Bộ sưu tập mới
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Tỏa sáng với
            <br />
            <span className="text-gold-light">vẻ đẹp vĩnh cửu</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-8 max-w-md font-body">
            Khám phá bộ sưu tập trang sức cao cấp được chế tác tinh xảo 
            từ những nghệ nhân hàng đầu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/san-pham">
              <Button size="lg" className="btn-gold text-base px-8">
                Khám phá ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/san-pham?category=nhan_cuoi">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-base px-8"
              >
                Bộ sưu tập cưới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
