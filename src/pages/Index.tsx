import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FeaturesSection } from '@/components/home/FeaturesSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <CategorySection />
      <FeaturedProducts />
    </Layout>
  );
};

export default Index;
