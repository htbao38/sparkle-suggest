import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CATEGORIES } from '@/lib/constants';

export default function Products() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || undefined;
  const query = searchParams.get('q') || undefined;

  const categoryLabel = category ? CATEGORIES[category as keyof typeof CATEGORIES]?.label : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {categoryLabel || (query ? `Kết quả tìm kiếm: "${query}"` : 'Tất cả sản phẩm')}
          </h1>
        </div>
        <ProductGrid category={category} searchQuery={query} />
      </div>
    </Layout>
  );
}
