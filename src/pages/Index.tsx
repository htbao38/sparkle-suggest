import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { RecommendedProducts } from '@/components/products/RecommendedProducts';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <CategorySection />
      <FeaturedProducts />
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <RecommendedProducts title="Gợi ý dành cho bạn" limit={8} />
        </div>
      </section>
    </Layout>
  );
};

export default Index;
