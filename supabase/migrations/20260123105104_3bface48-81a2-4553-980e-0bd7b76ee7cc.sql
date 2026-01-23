-- Create wishlist table
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlist
CREATE POLICY "Users can view own wishlist"
ON public.wishlist_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
ON public.wishlist_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
ON public.wishlist_items FOR DELETE
USING (auth.uid() = user_id);