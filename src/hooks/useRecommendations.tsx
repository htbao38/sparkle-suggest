import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  images?: string[];
  category: string;
  material: string;
  is_featured?: boolean;
}

export function useRecommendations(currentProductId?: string, limit: number = 4) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id, currentProductId, limit],
    queryFn: async (): Promise<Product[]> => {
      try {
        // Try to get recommendations from edge function
        const { data, error } = await supabase.functions.invoke('recommendations', {
          body: {
            action: 'get_recommendations',
            user_id: user?.id || null,
            product_id: currentProductId || null,
            limit,
          },
        });

        if (error) throw error;
        
        if (data?.recommendations && data.recommendations.length > 0) {
          return data.recommendations;
        }

        // Fallback: get featured products or same category products
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (currentProductId) {
          query = query.neq('id', currentProductId);
        }

        const { data: products, error: productsError } = await query
          .eq('is_featured', true)
          .limit(limit);

        if (productsError) throw productsError;
        return products || [];
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        
        // Ultimate fallback: just get active products
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(limit);
        
        return data || [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
