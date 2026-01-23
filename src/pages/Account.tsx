import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, ORDER_STATUS } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, Package, Heart, Eye, Settings, LogOut, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { items: wishlistItems, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Fetch profile
  const { refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      
      // Update form with fetched data
      if (data) {
        setProfileForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)` )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch view history
  const { data: viewHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['view-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_behaviors')
        .select(`
          *,
          product:products (
            id, name, slug, price, images
          )
        `)
        .eq('user_id', user!.id)
        .eq('behavior_type', 'view')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Remove duplicates, keep most recent
      const seen = new Set();
      return data?.filter(item => {
        if (seen.has(item.product_id)) return false;
        seen.add(item.product_id);
        return true;
      }) || [];
    },
    enabled: !!user,
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          address: profileForm.address,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await refetchProfile();
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Tài khoản của tôi</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
              <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Thông tin</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 py-3">
                <Package className="h-4 w-4" />
                <span className="hidden md:inline">Đơn hàng</span>
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="flex items-center gap-2 py-3">
                <Heart className="h-4 w-4" />
                <span className="hidden md:inline">Yêu thích</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 py-3">
                <Eye className="h-4 w-4" />
                <span className="hidden md:inline">Đã xem</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 py-3">
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Cài đặt</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ''} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Họ và tên</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử đơn hàng</CardTitle>
                  <CardDescription>Xem và theo dõi các đơn hàng của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold">#{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label || order.status}
                              </span>
                              <span className="font-semibold text-primary">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              {order.order_items?.length || 0} sản phẩm
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào</p>
                      <Button asChild>
                        <Link to="/san-pham">Mua sắm ngay</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm yêu thích</CardTitle>
                  <CardDescription>Các sản phẩm bạn đã lưu vào danh sách yêu thích</CardDescription>
                </CardHeader>
                <CardContent>
                  {wishlistLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : wishlistItems && wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="flex gap-4 border rounded-lg p-4">
                          <Link to={`/san-pham/${item.product?.slug}`} className="flex-shrink-0">
                            <img
                              src={item.product?.images?.[0] || '/placeholder.svg'}
                              alt={item.product?.name}
                              className="w-20 h-20 object-cover rounded-md"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/san-pham/${item.product?.slug}`} className="hover:text-primary">
                              <h4 className="font-medium truncate">{item.product?.name}</h4>
                            </Link>
                            <p className="text-primary font-semibold mt-1">
                              {formatPrice(item.product?.price || 0)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromWishlist(item.product_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Chưa có sản phẩm yêu thích</p>
                      <Button asChild>
                        <Link to="/san-pham">Khám phá sản phẩm</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* View History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm đã xem</CardTitle>
                  <CardDescription>Các sản phẩm bạn đã xem gần đây</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : viewHistory && viewHistory.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {viewHistory.map((item) => (
                        <Link 
                          key={item.id} 
                          to={`/san-pham/${item.product?.slug}`}
                          className="group"
                        >
                          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                            <img
                              src={item.product?.images?.[0] || '/placeholder.svg'}
                              alt={item.product?.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <h4 className="mt-2 text-sm font-medium truncate group-hover:text-primary">
                            {item.product?.name}
                          </h4>
                          <p className="text-sm text-primary font-semibold">
                            {formatPrice(item.product?.price || 0)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Chưa có lịch sử xem sản phẩm</p>
                      <Button asChild>
                        <Link to="/san-pham">Khám phá sản phẩm</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt tài khoản</CardTitle>
                  <CardDescription>Quản lý tài khoản của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="w-full md:w-auto"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
