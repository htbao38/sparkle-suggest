import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface OrderEditorProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderEditor({ order, open, onOpenChange }: OrderEditorProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    customer_name: order?.customer_name || '',
    customer_phone: order?.customer_phone || '',
    customer_email: order?.customer_email || '',
    shipping_address: order?.shipping_address || '',
    notes: order?.notes || '',
    total_amount: order?.total_amount?.toString() || '',
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('orders').update({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        shipping_address: form.shipping_address.trim(),
        notes: form.notes.trim() || null,
        total_amount: parseFloat(form.total_amount),
      }).eq('id', order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật đơn hàng');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onOpenChange(false);
    },
    onError: () => toast.error('Không thể cập nhật'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn hàng #{order?.order_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên khách hàng</Label>
              <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Địa chỉ giao hàng</Label>
            <Textarea value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Tổng tiền (VND)</Label>
            <Input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-4 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
