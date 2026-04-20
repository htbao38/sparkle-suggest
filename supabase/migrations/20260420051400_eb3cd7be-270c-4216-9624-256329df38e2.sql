-- 1. Fix RLS để user có thể huỷ đơn pending của mình
DROP POLICY IF EXISTS "Users can update pending orders" ON public.orders;

CREATE POLICY "Users can update pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::order_status)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending'::order_status, 'cancelled'::order_status)
);

-- 2. Bảng đánh giá sản phẩm
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON public.product_reviews(user_id);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Ai cũng xem được review
CREATE POLICY "Anyone can view reviews"
ON public.product_reviews FOR SELECT
TO public
USING (true);

-- Chỉ user đã mua sản phẩm (đơn không cancelled) mới được tạo review
CREATE POLICY "Buyers can create reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = product_reviews.product_id
      AND o.user_id = auth.uid()
      AND o.status <> 'cancelled'::order_status
  )
);

-- User update review của mình
CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User xoá review của mình
CREATE POLICY "Users can delete own reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admin quản lý tất cả
CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();