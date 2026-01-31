import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ProductGridProps {
  category?: string;
  searchQuery?: string;
  featured?: boolean;
  limit?: number;
}

export function ProductGrid({ category, searchQuery, featured, limit }: ProductGridProps) {
  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['products', category, searchQuery, featured, limit],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category as any);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (featured) {
        query = query.eq('is_featured', true);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isError) {
    const message =
      (error as any)?.message ||
      (typeof error === 'string' ? error : 'Không thể tải sản phẩm.');

    // Useful for debugging production-only issues (published URL vs preview)
    console.error('[ProductGrid] Failed to load products', {
      category,
      searchQuery,
      featured,
      limit,
      error,
    });

    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Đang tải...' : 'Thử lại'}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: limit || 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          slug={product.slug}
          price={Number(product.price)}
          originalPrice={product.original_price ? Number(product.original_price) : undefined}
          images={product.images || []}
          isNew={new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
