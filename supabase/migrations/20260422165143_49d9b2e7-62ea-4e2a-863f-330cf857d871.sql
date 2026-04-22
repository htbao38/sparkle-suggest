DROP POLICY IF EXISTS "Buyers can create reviews" ON public.product_reviews;

CREATE POLICY "Buyers can create reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = product_reviews.product_id
      AND o.user_id = auth.uid()
      AND o.status = 'delivered'::order_status
  )
);