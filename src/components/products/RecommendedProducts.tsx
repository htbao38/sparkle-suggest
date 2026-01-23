import { useRecommendations } from '@/hooks/useRecommendations';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendedProductsProps {
  currentProductId?: string;
  title?: string;
  limit?: number;
}

export function RecommendedProducts({ 
  currentProductId, 
  title = "Gợi ý dành cho bạn",
  limit = 4 
}: RecommendedProductsProps) {
  const { data: products, isLoading } = useRecommendations(currentProductId, limit);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            originalPrice={product.original_price}
            images={product.images || []}
          />
        ))}
      </div>
    </div>
  );
}
