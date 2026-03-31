import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, ORDER_STATUS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Pencil, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    notes: '',
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, product:products(name, images, slug))`)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('orders').update({
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.trim(),
        customer_email: editForm.customer_email.trim() || null,
        shipping_address: editForm.shipping_address.trim(),
        notes: editForm.notes.trim() || null,
      }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật đơn hàng');
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
      setEditing(false);
    },
    onError: () => toast.error('Không thể cập nhật đơn hàng'),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' as any }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng');
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
    },
    onError: () => toast.error('Không thể hủy đơn hàng'),
  });

  const startEdit = () => {
    if (!order) return;
    setEditForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || '',
      shipping_address: order.shipping_address,
      notes: order.notes || '',
    });
    setEditing(true);
  };

  if (authLoading) return <Layout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  if (!user) return <Navigate to="/dang-nhap" replace />;

  const isPending = order?.status === 'pending';
  const status = ORDER_STATUS[order?.status as keyof typeof ORDER_STATUS];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/don-hang" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Quay lại đơn hàng
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : !order ? (
          <div className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng</div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">Đơn hàng #{order.order_number}</h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), "dd 'tháng' MM, yyyy - HH:mm", { locale: vi })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status?.color}`}>
                  {status?.label}
                </span>
                {isPending && (
                  <>
                    <Button size="sm" variant="outline" onClick={startEdit}>
                      <Pencil className="h-4 w-4 mr-2" /> Sửa
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) cancelMutation.mutate();
                    }} disabled={cancelMutation.isPending}>
                      Hủy đơn
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-card rounded-lg shadow-card p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Thông tin giao hàng</h2>
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Họ và tên</Label>
                      <Input value={editForm.customer_name} onChange={e => setEditForm({ ...editForm, customer_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Số điện thoại</Label>
                      <Input value={editForm.customer_phone} onChange={e => setEditForm({ ...editForm, customer_phone: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={editForm.customer_email} onChange={e => setEditForm({ ...editForm, customer_email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Địa chỉ giao hàng</Label>
                    <Textarea value={editForm.shipping_address} onChange={e => setEditForm({ ...editForm, shipping_address: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4 mr-2" /> Hủy
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      <Check className="h-4 w-4 mr-2" /> {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{order.customer_email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Địa chỉ giao hàng</p>
                    <p className="font-medium">{order.shipping_address}</p>
                  </div>
                  {order.notes && (
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground">Ghi chú</p>
                      <p className="font-medium">{order.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-card rounded-lg shadow-card p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Sản phẩm</h2>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => {
                  const productName = item.product?.name || item.product_name || 'Sản phẩm';
                  const productImage = item.product?.images?.[0] || item.product_image || '/placeholder.svg';
                  const productSlug = item.product?.slug;
                  return (
                    <div key={item.id} className="flex gap-4 items-center">
                      {productSlug ? (
                        <Link to={`/san-pham/${productSlug}`}>
                          <img src={productImage} alt={productName} className="w-16 h-16 object-cover rounded" />
                        </Link>
                      ) : (
                        <img src={productImage} alt={productName} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        {productSlug ? (
                          <Link to={`/san-pham/${productSlug}`} className="font-medium hover:text-primary">{productName}</Link>
                        ) : (
                          <p className="font-medium">{productName}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(Number(item.price))}/sp</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính</span>
                  <span>{formatPrice(Number(order.total_amount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(Number(order.total_amount))}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
