import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  is_default: boolean;
}

interface AddressManagerProps {
  selectable?: boolean;
  selectedId?: string;
  onSelect?: (address: Address) => void;
}

export function AddressManager({ selectable, selectedId, onSelect }: AddressManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState({ label: 'Nhà', full_name: '', phone: '', address: '' });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const payload = { ...form, user_id: user.id };
      if (editing) {
        const { error } = await supabase.from('user_addresses').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_addresses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      // Remove default from all
      await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
      // Set new default
      const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã đặt làm mặc định');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const resetForm = () => {
    setForm({ label: 'Nhà', full_name: '', phone: '', address: '' });
    setEditing(null);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({ label: addr.label, full_name: addr.full_name, phone: addr.phone, address: addr.address });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Địa chỉ giao hàng</CardTitle>
          <CardDescription>Quản lý các địa chỉ giao hàng của bạn</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Thêm địa chỉ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nhãn (VD: Nhà, Văn phòng)</Label>
                <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} maxLength={50} required />
              </div>
              <div className="space-y-2">
                <Label>Họ và tên *</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} maxLength={200} required />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại *</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={20} required />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ chi tiết *</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} maxLength={500} required />
              </div>
              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!addresses?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ giao hàng.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                  selectable && selectedId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => selectable && onSelect?.(addr)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Mặc định</span>
                      )}
                    </div>
                    <p className="text-sm">{addr.full_name} - {addr.phone}</p>
                    <p className="text-sm text-muted-foreground">{addr.address}</p>
                  </div>
                  {!selectable && (
                    <div className="flex gap-1 flex-shrink-0">
                      {!addr.is_default && (
                        <Button size="icon" variant="ghost" onClick={() => setDefaultMutation.mutate(addr.id)} title="Đặt mặc định">
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(addr)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                        if (confirm('Xóa địa chỉ này?')) deleteMutation.mutate(addr.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
