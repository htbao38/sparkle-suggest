import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/constants';
import { checkoutSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { CreditCard, Truck, CheckCircle, MapPin, Plus } from 'lucide-react';

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Nhà', full_name: '', phone: '', address: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Fetch saved addresses
  const { data: addresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-fill from default address or profile on load
  useEffect(() => {
    if (!user) return;
    
    // Try default address first
    const defaultAddr = addresses?.find((a: any) => a.is_default);
    if (defaultAddr) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || defaultAddr.full_name,
        phone: prev.phone || defaultAddr.phone,
        address: prev.address || defaultAddr.address,
        email: prev.email || user.email || '',
      }));
      return;
    }

    // Fall back to profile
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || profile.full_name || '',
        phone: prev.phone || profile.phone || '',
        address: prev.address || profile.address || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [addresses, profile, user]);

  const selectAddress = (addr: any) => {
    setFormData({
      ...formData,
      fullName: addr.full_name,
      phone: addr.phone,
      address: addr.address,
    });
  };

  const handleSaveNewAddress = async () => {
    if (!user || !newAddress.full_name || !newAddress.phone || !newAddress.address) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const { error } = await supabase.from('user_addresses').insert({
      user_id: user.id,
      label: newAddress.label,
      full_name: newAddress.full_name,
      phone: newAddress.phone,
      address: newAddress.address,
      is_default: !addresses?.length,
    });

    if (error) {
      toast.error('Không thể lưu địa chỉ');
      return;
    }

    toast.success('Đã lưu địa chỉ mới');
    setAddAddressOpen(false);
    setNewAddress({ label: 'Nhà', full_name: '', phone: '', address: '' });
    refetchAddresses();
    // Auto-select the new address
    selectAddress({ full_name: newAddress.full_name, phone: newAddress.phone, address: newAddress.address });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const result = checkoutSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      return;
    }

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          customer_name: formData.fullName.trim(),
          customer_phone: formData.phone.trim(),
          customer_email: formData.email.trim() || user.email,
          shipping_address: formData.address.trim(),
          total_amount: totalPrice,
          notes: formData.notes.trim() || null,
          order_number: 'TEMP' + Date.now(),
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_image: item.product?.images?.[0] || '',
        quantity: item.quantity,
        price: item.product?.price || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Track purchase behavior
      for (const item of items) {
        await supabase.from('user_behaviors').insert({
          user_id: user.id,
          product_id: item.product_id,
          behavior_type: 'purchase',
        });
      }

      await clearCart();
      toast.success('Đặt hàng thành công!');
      setStep(3);
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/dang-nhap');
    return null;
  }

  if (items.length === 0 && step !== 3) {
    navigate('/gio-hang');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: 'Thông tin', icon: Truck },
            { num: 2, label: 'Thanh toán', icon: CreditCard },
            { num: 3, label: 'Hoàn tất', icon: CheckCircle },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="hidden sm:block font-medium">{s.label}</span>
              </div>
              {i < 2 && <div className="w-8 md:w-16 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {step === 3 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="font-display text-3xl font-bold mb-4">Đặt hàng thành công!</h1>
            <p className="text-muted-foreground mb-8">
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.
            </p>
            <div className="flex flex-col gap-4">
              <Button onClick={() => navigate('/don-hang')} className="btn-gold">
                Xem đơn hàng
              </Button>
              <Button onClick={() => navigate('/san-pham')} variant="outline">
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                  <>
                    <h2 className="font-display text-2xl font-bold mb-6">Thông tin giao hàng</h2>
                    
                    {/* Saved addresses */}
                    <div className="mb-6">
                      <Label className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4" /> Chọn địa chỉ giao hàng
                      </Label>
                      <div className="grid gap-2">
                        {addresses?.map((addr: any) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => selectAddress(addr)}
                            className={`text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors ${
                              formData.fullName === addr.full_name && formData.phone === addr.phone && formData.address === addr.address
                                ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <p className="font-medium text-sm">{addr.label} - {addr.full_name}</p>
                            <p className="text-xs text-muted-foreground">{addr.phone} · {addr.address}</p>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setAddAddressOpen(true)}
                          className="flex items-center gap-2 border border-dashed rounded-lg p-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="h-4 w-4" /> Thêm địa chỉ mới
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên *</Label>
                        <Input name="fullName" value={formData.fullName} onChange={handleChange} maxLength={200} required />
                        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input name="phone" value={formData.phone} onChange={handleChange} maxLength={20} required />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input name="email" type="email" value={formData.email} onChange={handleChange} maxLength={255} />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ giao hàng *</Label>
                      <Textarea name="address" value={formData.address} onChange={handleChange} maxLength={500} required rows={3} />
                      {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú đơn hàng</Label>
                      <Textarea name="notes" value={formData.notes} onChange={handleChange} maxLength={1000} rows={2} placeholder="Ví dụ: Giao hàng giờ hành chính" />
                      {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                    </div>
                    <Button type="button" onClick={() => { if (validateForm()) setStep(2); }} className="btn-gold w-full md:w-auto">
                      Tiếp tục thanh toán
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="font-display text-2xl font-bold mb-6">Phương thức thanh toán</h2>
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-primary/5 border-primary">
                        <input type="radio" name="payment" value="cod" defaultChecked className="text-primary" />
                        <div>
                          <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-sm text-muted-foreground">Thanh toán bằng tiền mặt khi nhận hàng</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer opacity-50">
                        <input type="radio" name="payment" value="bank" disabled />
                        <div>
                          <p className="font-medium">Chuyển khoản ngân hàng</p>
                          <p className="text-sm text-muted-foreground">Sắp ra mắt</p>
                        </div>
                      </label>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        Quay lại
                      </Button>
                      <Button type="submit" className="btn-gold flex-1" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Hoàn tất đặt hàng'}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-card p-6 rounded-lg shadow-card h-fit">
              <h3 className="font-display text-xl font-semibold mb-4">Đơn hàng của bạn</h3>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product?.images?.[0] || '/placeholder.svg'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{item.product?.name}</p>
                      <p className="text-muted-foreground text-sm">x{item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Address Dialog */}
      <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm địa chỉ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nhãn</Label>
              <Input value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="Nhà, Công ty..." />
            </div>
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input value={newAddress.full_name} onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại *</Label>
              <Input value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ *</Label>
              <Textarea value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} required rows={3} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddAddressOpen(false)}>Hủy</Button>
              <Button className="btn-gold flex-1" onClick={handleSaveNewAddress}>Lưu địa chỉ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
