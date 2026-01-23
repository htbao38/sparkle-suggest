import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  if (!user || !isAdmin) return <Navigate to="/dang-nhap" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-onyx text-pearl p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="font-display text-2xl font-bold text-gold">Admin Dashboard</h1>
          <span className="text-sm">Xin chào, Admin</span>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg shadow-card">
            <h3 className="text-muted-foreground text-sm mb-2">Sản phẩm</h3>
            <p className="font-display text-3xl font-bold">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-card">
            <h3 className="text-muted-foreground text-sm mb-2">Đơn hàng</h3>
            <p className="font-display text-3xl font-bold">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-card">
            <h3 className="text-muted-foreground text-sm mb-2">Doanh thu</h3>
            <p className="font-display text-3xl font-bold">0₫</p>
          </div>
        </div>
        <p className="text-muted-foreground text-center py-12">
          Dashboard quản trị đang được phát triển. Bạn có thể quản lý sản phẩm và đơn hàng tại đây.
        </p>
      </div>
    </div>
  );
}
