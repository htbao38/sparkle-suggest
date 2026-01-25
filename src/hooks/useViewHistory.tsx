import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ViewHistoryProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
}

interface ViewHistoryItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: ViewHistoryProduct;
}

export function useViewHistory(limit: number = 20) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['view-history', user?.id, limit],
    queryFn: async (): Promise<ViewHistoryItem[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_behaviors')
        .select(`
          id,
          product_id,
          created_at,
          product:products (
            id, name, slug, price, images
          )
        `)
        .eq('user_id', user.id)
        .eq('behavior_type', 'view')
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Fetch more to handle duplicates

      if (error) throw error;

      // Remove duplicates, keep most recent
      const seen = new Set<string>();
      const uniqueItems: ViewHistoryItem[] = [];
      
      for (const item of data || []) {
        if (!seen.has(item.product_id) && uniqueItems.length < limit) {
          seen.add(item.product_id);
          uniqueItems.push({
            id: item.id,
            product_id: item.product_id,
            created_at: item.created_at,
            product: Array.isArray(item.product) ? item.product[0] : item.product,
          });
        }
      }

      return uniqueItems;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const trackView = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) return;

      const { error } = await supabase.from('user_behaviors').insert({
        user_id: user.id,
        product_id: productId,
        behavior_type: 'view',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['view-history', user?.id] });
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from('user_behaviors')
        .delete()
        .eq('user_id', user.id)
        .eq('behavior_type', 'view');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['view-history', user?.id] });
    },
  });

  return {
    items,
    isLoading,
    trackView: trackView.mutate,
    clearHistory: clearHistory.mutate,
    totalItems: items.length,
  };
}
