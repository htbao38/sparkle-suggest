import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/constants';

export default function Cart() {
  const { items, loading, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <p className="text-muted-foreground mb-6">Đăng nhập để xem giỏ hàng của bạn</p>
          <Link to="/dang-nhap">
            <Button className="btn-gold">Đăng nhập</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return <Layout><div className="container py-16 text-center">Đang tải...</div></Layout>;
  }

  if (!items.length) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Giỏ hàng trống</h1>
          <Link to="/san-pham">
            <Button className="btn-gold">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">Giỏ hàng</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-card rounded-lg shadow-card">
                <img
                  src={item.product?.images?.[0] || '/placeholder.svg'}
                  alt={item.product?.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-display font-semibold">{item.product?.name}</h3>
                  <p className="text-primary font-semibold">{formatPrice(item.product?.price || 0)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive ml-auto" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-card p-6 rounded-lg shadow-card h-fit">
            <h3 className="font-display text-xl font-semibold mb-4">Tổng đơn hàng</h3>
            <div className="flex justify-between text-lg font-semibold mb-6">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
            <Link to="/thanh-toan">
              <Button className="w-full btn-gold">Thanh toán</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
