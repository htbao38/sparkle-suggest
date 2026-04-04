import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { formatPrice, CATEGORIES } from '@/lib/constants';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items?: Array<{
    product_id: string;
    quantity: number;
    price: number;
    product?: { name: string; images: string[] | null } | null;
  }>;
}

interface Product {
  id: string;
  name: string;
  stock: number | null;
  category: string;
  images: string[] | null;
  price: number;
}

interface Props {
  orders: Order[];
  products: Product[];
}

export function RevenueChart({ orders, products }: Props) {
  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    const now = new Date();

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      map.set(key, { revenue: 0, count: 0 });
    }

    orders
      .filter(o => o.status !== 'cancelled')
      .forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (map.has(key)) {
          const v = map.get(key)!;
          v.revenue += Number(o.total_amount);
          v.count += 1;
        }
      });

    return Array.from(map.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.count,
    }));
  }, [orders]);

  // Best selling products
  const bestSellers = useMemo(() => {
    const soldMap = new Map<string, number>();
    orders
      .filter(o => o.status !== 'cancelled')
      .forEach(o => {
        o.order_items?.forEach(item => {
          if (item.product_id) {
            soldMap.set(item.product_id, (soldMap.get(item.product_id) || 0) + item.quantity);
          }
        });
      });

    return products
      .map(p => ({ ...p, totalSold: soldMap.get(p.id) || 0 }))
      .filter(p => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);
  }, [orders, products]);

  // Restock suggestions: best sellers with low stock
  const restockSuggestions = useMemo(() => {
    return bestSellers
      .filter(p => (p.stock ?? 0) <= 5)
      .map(p => ({
        ...p,
        urgency: (p.stock ?? 0) === 0 ? 'critical' : 'warning',
      }));
  }, [bestSellers]);

  // Also add products with 0 stock that aren't in best sellers
  const outOfStock = useMemo(() => {
    const bestSellerIds = new Set(bestSellers.map(p => p.id));
    return products
      .filter(p => (p.stock ?? 0) === 0 && !bestSellerIds.has(p.id))
      .slice(0, 5);
  }, [products, bestSellers]);

  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = monthlyRevenue.reduce((s, m) => s + m.orders, 0);

  const formatTooltip = (value: number) => formatPrice(value);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-lg shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground text-sm">Doanh thu 6 tháng</span>
          </div>
          <p className="font-display text-2xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground text-sm">Tổng đơn hàng</span>
          </div>
          <p className="font-display text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-muted-foreground text-sm">Cần nhập hàng</span>
          </div>
          <p className="font-display text-2xl font-bold">{restockSuggestions.length + outOfStock.length}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-card p-6 rounded-lg shadow-card">
        <h3 className="font-display text-lg font-semibold mb-4">Biểu đồ doanh thu theo tháng</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Doanh thu']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders trend */}
      <div className="bg-card p-6 rounded-lg shadow-card">
        <h3 className="font-display text-lg font-semibold mb-4">Xu hướng đơn hàng</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [value, 'Đơn hàng']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Best sellers */}
        <div className="bg-card p-6 rounded-lg shadow-card">
          <h3 className="font-display text-lg font-semibold mb-4">Top sản phẩm bán chạy</h3>
          {bestSellers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có dữ liệu bán hàng</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                  <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="w-10 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIES[p.category as keyof typeof CATEGORIES]?.label} · Tồn: {p.stock ?? 0}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{p.totalSold} đã bán</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restock suggestions */}
        <div className="bg-card p-6 rounded-lg shadow-card">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Gợi ý nhập hàng
          </h3>
          {restockSuggestions.length === 0 && outOfStock.length === 0 ? (
            <p className="text-muted-foreground text-sm">Tất cả sản phẩm bán chạy đều đủ hàng</p>
          ) : (
            <div className="space-y-3">
              {restockSuggestions.map(p => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg ${p.urgency === 'critical' ? 'bg-destructive/10 border border-destructive/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                  <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="w-10 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.totalSold} đã bán · Tồn kho: {p.stock ?? 0}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${p.urgency === 'critical' ? 'bg-destructive text-destructive-foreground' : 'bg-yellow-500 text-white'}`}>
                    {p.urgency === 'critical' ? 'Hết hàng' : 'Sắp hết'}
                  </span>
                </div>
              ))}
              {outOfStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="w-10 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Tồn kho: 0</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-destructive text-destructive-foreground">Hết hàng</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
