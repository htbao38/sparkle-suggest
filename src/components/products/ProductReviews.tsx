import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Props {
  productId: string;
}

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: { full_name: string | null } | null;
};

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(!readOnly && 'cursor-pointer hover:scale-110 transition-transform', readOnly && 'cursor-default')}
          aria-label={`${n} sao`}
        >
          <Star className={cn(sizeClass, n <= value ? 'fill-primary text-primary' : 'text-muted-foreground')} />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch reviewer names (profiles isn't FK-linked in types)
      const userIds = Array.from(new Set((data || []).map((r) => r.user_id)));
      let profileMap: Record<string, string | null> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.full_name]));
      }
      return (data || []).map((r) => ({
        ...r,
        reviewer: { full_name: profileMap[r.user_id] ?? null },
      })) as ReviewRow[];
    },
  });

  // Has the current user purchased this product?
  const { data: hasPurchased } = useQuery({
    queryKey: ['has-purchased', productId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('order_items')
        .select('order_id, orders!inner(user_id, status)')
        .eq('product_id', productId)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered')
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  const myReview = useMemo(
    () => reviews?.find((r) => r.user_id === user?.id) ?? null,
    [reviews, user?.id]
  );

  const stats = useMemo(() => {
    if (!reviews?.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return { avg: sum / reviews.length, count: reviews.length };
  }, [reviews]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not-auth');
      if (editingId && myReview) {
        const { error } = await supabase
          .from('product_reviews')
          .update({ rating, comment: comment.trim() || null })
          .eq('id', myReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_reviews')
          .insert({ product_id: productId, user_id: user.id, rating, comment: comment.trim() || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá');
      setEditingId(null);
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
    onError: (e: any) => {
      const msg = String(e?.message || '');
      if (msg.includes('duplicate')) toast.error('Bạn đã đánh giá sản phẩm này rồi');
      else if (msg.includes('row-level') || msg.includes('policy'))
        toast.error('Bạn cần mua sản phẩm trước khi đánh giá');
      else toast.error('Không thể gửi đánh giá');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xoá đánh giá');
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
    onError: () => toast.error('Không thể xoá đánh giá'),
  });

  const startEdit = () => {
    if (!myReview) return;
    setEditingId(myReview.id);
    setRating(myReview.rating);
    setComment(myReview.comment || '');
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  return (
    <section className="mt-16 border-t border-border pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Đánh giá sản phẩm</h2>
          {stats.count > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <StarRating value={Math.round(stats.avg)} readOnly />
              <span className="text-sm text-muted-foreground">
                {stats.avg.toFixed(1)} / 5 · {stats.count} đánh giá
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      {!user ? (
        <div className="bg-secondary/30 rounded-lg p-6 text-center text-sm text-muted-foreground mb-8">
          <Link to="/dang-nhap" className="text-primary hover:underline">Đăng nhập</Link> để đánh giá sản phẩm.
        </div>
      ) : !hasPurchased ? (
        <div className="bg-secondary/30 rounded-lg p-6 text-center text-sm text-muted-foreground mb-8">
          Bạn cần mua sản phẩm này trước khi có thể đánh giá.
        </div>
      ) : myReview && !editingId ? (
        <div className="bg-secondary/30 rounded-lg p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-3">Bạn đã đánh giá sản phẩm này.</p>
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Sửa đánh giá của tôi
          </Button>
        </div>
      ) : (
        <form
          id="review-form"
          onSubmit={(e) => {
            e.preventDefault();
            upsertMutation.mutate();
          }}
          className="bg-card border border-border rounded-lg p-6 space-y-4 mb-8"
        >
          <div>
            <label className="text-sm font-medium block mb-2">Đánh giá của bạn</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Bình luận</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              rows={4}
              maxLength={1000}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={upsertMutation.isPending} className="btn-gold">
              {upsertMutation.isPending ? 'Đang gửi...' : editingId ? 'Cập nhật' : 'Gửi đánh giá'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setComment('');
                  setRating(5);
                }}
              >
                Huỷ
              </Button>
            )}
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !reviews?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-medium">{r.reviewer?.full_name || 'Khách hàng'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={r.rating} readOnly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'dd MMM yyyy', { locale: vi })}
                    </span>
                  </div>
                </div>
                {user?.id === r.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Xoá đánh giá của bạn?')) deleteMutation.mutate(r.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {r.comment && <p className="text-sm leading-relaxed mt-2 whitespace-pre-wrap">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
