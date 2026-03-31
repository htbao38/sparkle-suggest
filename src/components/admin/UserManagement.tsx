import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

export function UserManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isCurrentlyAdmin }: { userId: string; isCurrentlyAdmin: boolean }) => {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Đã cập nhật quyền');
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
    onError: () => toast.error('Không thể cập nhật quyền'),
  });

  const getRoles = (userId: string) => {
    return roles?.filter(r => r.user_id === userId).map(r => r.role) || [];
  };

  const filteredProfiles = profiles?.filter(p =>
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone || '').includes(searchQuery)
  );

  if (isLoading) return <div className="text-center py-12">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc SĐT..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Người dùng</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">SĐT</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Địa chỉ</th>
                <th className="text-center p-4 font-medium">Vai trò</th>
                <th className="text-center p-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles?.map(profile => {
                const userRoles = getRoles(profile.user_id);
                const isAdmin = userRoles.includes('admin');
                return (
                  <tr key={profile.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">{profile.full_name || 'Chưa cập nhật'}</p>
                      <p className="text-sm text-muted-foreground">ID: {profile.user_id.slice(0, 8)}...</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">{profile.phone || '—'}</td>
                    <td className="p-4 hidden md:table-cell text-sm">{profile.address || '—'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isAdmin ? <Shield className="h-3 w-3" /> : null}
                        {isAdmin ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant={isAdmin ? 'destructive' : 'outline'}
                        onClick={() => {
                          if (confirm(isAdmin ? 'Gỡ quyền admin?' : 'Cấp quyền admin?')) {
                            toggleAdminMutation.mutate({ userId: profile.user_id, isCurrentlyAdmin: isAdmin });
                          }
                        }}
                        disabled={toggleAdminMutation.isPending}
                      >
                        {isAdmin ? <ShieldOff className="h-4 w-4 mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
                        {isAdmin ? 'Gỡ admin' : 'Cấp admin'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
