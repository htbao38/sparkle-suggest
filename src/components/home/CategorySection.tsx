import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/lib/constants';
import ringImage from '@/assets/product-ring.jpg';
import necklaceImage from '@/assets/product-necklace.jpg';
import braceletImage from '@/assets/product-bracelet.jpg';
import earringsImage from '@/assets/product-earrings.jpg';

const categoryImages: Record<string, string> = {
  nhan: ringImage,
  day_chuyen: necklaceImage,
  vong_tay: braceletImage,
  bong_tai: earringsImage,
};

export function CategorySection() {
  const displayCategories = ['nhan', 'day_chuyen', 'vong_tay', 'bong_tai'];

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Khám phá theo danh mục
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tìm kiếm món trang sức hoàn hảo cho bạn trong bộ sưu tập đa dạng của chúng tôi
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {displayCategories.map((key) => {
            const category = CATEGORIES[key as keyof typeof CATEGORIES];
            return (
              <Link
                key={key}
                to={`/san-pham?category=${key}`}
                className="group relative overflow-hidden rounded-lg aspect-square"
              >
                <img
                  src={categoryImages[key]}
                  alt={category.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <h3 className="font-display text-xl md:text-2xl font-semibold text-white">
                    {category.label}
                  </h3>
                  <span className="text-white/80 text-sm font-body group-hover:text-gold-light transition-colors">
                    Xem bộ sưu tập →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
