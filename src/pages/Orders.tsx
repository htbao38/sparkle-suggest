import { useQuery } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, ORDER_STATUS } from '@/lib/constants';
import { Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) return <div>Đang tải...</div>;
  if (!user) return <Navigate to="/dang-nhap" replace />;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">Đơn hàng của tôi</h1>

        {isLoading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : !orders?.length ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">Bạn chưa có đơn hàng nào</p>
            <Link to="/san-pham" className="btn-gold inline-block px-8 py-3 rounded-md">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
              return (
                <div key={order.id} className="bg-card rounded-lg shadow-card overflow-hidden">
                  <div className="p-4 md:p-6 border-b border-border flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <p className="font-display font-semibold text-lg">#{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd 'tháng' MM, yyyy - HH:mm", { locale: vi })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status?.color}`}>
                      {status?.label}
                    </span>
                  </div>
                  
                  <div className="p-4 md:p-6">
                    <div className="space-y-3 mb-4">
                      {order.order_items?.slice(0, 2).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                            src={item.product_image || '/placeholder.svg'}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                          </div>
                          <p className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</p>
                        </div>
                      ))}
                      {order.order_items && order.order_items.length > 2 && (
                        <p className="text-sm text-muted-foreground">
                          + {order.order_items.length - 2} sản phẩm khác
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <span className="text-muted-foreground">Tổng tiền: </span>
                        <span className="font-bold text-lg text-primary">{formatPrice(Number(order.total_amount))}</span>
                      </div>
                      <button className="text-primary flex items-center gap-1 hover:underline">
                        Chi tiết <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
