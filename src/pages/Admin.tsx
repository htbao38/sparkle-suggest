import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package, DollarSign, Users, ShoppingCart, Search, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice, CATEGORIES, MATERIALS, ORDER_STATUS, generateSlug } from '@/lib/constants';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    material: '',
    weight: '',
    price: '',
    original_price: '',
    stock: '',
    images: '',
    is_featured: false,
    is_active: true,
  });

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category: '',
      material: '',
      weight: '',
      price: '',
      original_price: '',
      stock: '',
      images: '',
      is_featured: false,
      is_active: true,
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      material: product.material,
      weight: product.weight?.toString() || '',
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      stock: product.stock?.toString() || '',
      images: product.images?.join(', ') || '',
      is_featured: product.is_featured || false,
      is_active: product.is_active ?? true,
    });
    setProductDialogOpen(true);
  };

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const productData = {
        name: productForm.name,
        slug: generateSlug(productForm.name),
        description: productForm.description,
        category: productForm.category as any,
        material: productForm.material as any,
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
        price: parseFloat(productForm.price),
        original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
        stock: parseInt(productForm.stock) || 0,
        images: productForm.images.split(',').map(s => s.trim()).filter(Boolean),
        is_featured: productForm.is_featured,
        is_active: productForm.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setProductDialogOpen(false);
      resetProductForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  if (!user || !isAdmin) return <Navigate to="/dang-nhap" replace />;

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    products: products?.length || 0,
    orders: orders?.length || 0,
    revenue: orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
    pending: orders?.filter(o => o.status === 'pending').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-onyx text-pearl p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="font-display text-2xl font-bold text-gold">
            LUXE JEWELRY
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block">Xin chào, Admin</span>
            <Button variant="outline" size="sm" onClick={signOut} className="text-pearl border-pearl/30 hover:bg-pearl/10">
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Quản trị hệ thống</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-6 rounded-lg shadow-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Sản phẩm</p>
              <p className="font-display text-2xl font-bold">{stats.products}</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Đơn hàng</p>
              <p className="font-display text-2xl font-bold">{stats.orders}</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Doanh thu</p>
              <p className="font-display text-xl font-bold">{formatPrice(stats.revenue)}</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Chờ xử lý</p>
              <p className="font-display text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={productDialogOpen} onOpenChange={(open) => { setProductDialogOpen(open); if (!open) resetProductForm(); }}>
                <DialogTrigger asChild>
                  <Button className="btn-gold">
                    <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={e => { e.preventDefault(); saveProductMutation.mutate(); }} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tên sản phẩm *</Label>
                        <Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Danh mục *</Label>
                        <Select value={productForm.category} onValueChange={v => setProductForm({...productForm, category: v})}>
                          <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORIES).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Chất liệu *</Label>
                        <Select value={productForm.material} onValueChange={v => setProductForm({...productForm, material: v})}>
                          <SelectTrigger><SelectValue placeholder="Chọn chất liệu" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(MATERIALS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Trọng lượng (gram)</Label>
                        <Input type="number" step="0.01" value={productForm.weight} onChange={e => setProductForm({...productForm, weight: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Giá bán (VND) *</Label>
                        <Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Giá gốc (VND)</Label>
                        <Input type="number" value={productForm.original_price} onChange={e => setProductForm({...productForm, original_price: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Số lượng</Label>
                        <Input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hình ảnh (URL, phân cách bằng dấu phẩy)</Label>
                      <Input value={productForm.images} onChange={e => setProductForm({...productForm, images: e.target.value})} placeholder="https://example.com/image1.jpg, https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Mô tả</Label>
                      <Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows={3} />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={productForm.is_featured} onChange={e => setProductForm({...productForm, is_featured: e.target.checked})} />
                        <span>Sản phẩm nổi bật</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm({...productForm, is_active: e.target.checked})} />
                        <span>Hiển thị</span>
                      </label>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Hủy</Button>
                      <Button type="submit" className="btn-gold flex-1" disabled={saveProductMutation.isPending}>
                        {saveProductMutation.isPending ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Thêm sản phẩm')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {productsLoading ? (
              <div className="text-center py-12">Đang tải...</div>
            ) : (
              <div className="bg-card rounded-lg shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Sản phẩm</th>
                        <th className="text-left p-4 font-medium hidden md:table-cell">Danh mục</th>
                        <th className="text-right p-4 font-medium">Giá</th>
                        <th className="text-center p-4 font-medium hidden sm:table-cell">Tồn kho</th>
                        <th className="text-center p-4 font-medium hidden sm:table-cell">Trạng thái</th>
                        <th className="text-center p-4 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts?.map(product => (
                        <tr key={product.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={product.images?.[0] || '/placeholder.svg'} alt="" className="w-12 h-12 object-cover rounded" />
                              <div>
                                <p className="font-medium line-clamp-1">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{MATERIALS[product.material as keyof typeof MATERIALS]?.label}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {CATEGORIES[product.category as keyof typeof CATEGORIES]?.label}
                          </td>
                          <td className="p-4 text-right font-medium">{formatPrice(Number(product.price))}</td>
                          <td className="p-4 text-center hidden sm:table-cell">{product.stock}</td>
                          <td className="p-4 text-center hidden sm:table-cell">
                            {product.is_active ? (
                              <span className="inline-flex items-center gap-1 text-green-600"><Eye className="h-4 w-4" /></span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground"><EyeOff className="h-4 w-4" /></span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button size="icon" variant="ghost" onClick={() => openEditDialog(product)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                                if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {ordersLoading ? (
              <div className="text-center py-12">Đang tải...</div>
            ) : !orders?.length ? (
              <div className="text-center py-12 text-muted-foreground">Chưa có đơn hàng nào</div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
                  return (
                    <div key={order.id} className="bg-card rounded-lg shadow-card p-4 md:p-6">
                      <div className="flex flex-wrap gap-4 items-start justify-between mb-4">
                        <div>
                          <p className="font-display font-semibold text-lg">#{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                        </div>
                        <Select
                          value={order.status}
                          onValueChange={(v) => updateOrderStatusMutation.mutate({ orderId: order.id, status: v })}
                        >
                          <SelectTrigger className={`w-40 ${status?.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ORDER_STATUS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Khách hàng</p>
                          <p className="font-medium">{order.customer_name}</p>
                          <p>{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Địa chỉ giao hàng</p>
                          <p>{order.shipping_address}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Sản phẩm ({order.order_items?.length})</p>
                        <div className="space-y-2">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product_name} x{item.quantity}</span>
                              <span className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                          <span>Tổng cộng</span>
                          <span className="text-primary">{formatPrice(Number(order.total_amount))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
