import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';

export function FeaturedProducts() {
  return (
    <section className="section-padding bg-champagne/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-body text-sm uppercase tracking-[0.2em] mb-2 block">
              Được yêu thích
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Sản phẩm nổi bật
            </h2>
          </div>
          <Link to="/san-pham">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ProductGrid featured limit={8} />
      </div>
    </section>
  );
}
