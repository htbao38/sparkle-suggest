import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  images: string[] | null;
  category: string;
  material: string;
}

interface WishlistItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
  product?: WishlistProduct;
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  totalItems: number;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

async function fetchWithAuth(url: string, options: RequestInit = {}, accessToken?: string) {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const fetchWishlist = async () => {
    if (!user || !session?.access_token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const url = `${SUPABASE_URL}/rest/v1/wishlist_items?user_id=eq.${user.id}&select=id,product_id,user_id,created_at,product:products(id,name,slug,price,original_price,images,category,material)&order=created_at.desc`;
      
      const data = await fetchWithAuth(url, {}, session.access_token);
      
      // Transform data to match interface
      const transformedData: WishlistItem[] = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        user_id: item.user_id,
        created_at: item.created_at,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      }));
      
      setItems(transformedData);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user, session]);

  const addToWishlist = async (productId: string) => {
    if (!user || !session?.access_token) {
      toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    try {
      const url = `${SUPABASE_URL}/rest/v1/wishlist_items`;
      
      await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
        }),
        headers: {
          'Prefer': 'return=minimal',
        },
      }, session.access_token);

      await fetchWishlist();
      toast.success('Đã thêm vào danh sách yêu thích');
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('23505')) {
        toast.info('Sản phẩm đã có trong danh sách yêu thích');
        return;
      }
      console.error('Error adding to wishlist:', error);
      toast.error('Không thể thêm vào yêu thích');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user || !session?.access_token) return;

    try {
      const url = `${SUPABASE_URL}/rest/v1/wishlist_items?user_id=eq.${user.id}&product_id=eq.${productId}`;
      
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      setItems(items.filter(item => item.product_id !== productId));
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Không thể xóa khỏi yêu thích');
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        totalItems: items.length,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
