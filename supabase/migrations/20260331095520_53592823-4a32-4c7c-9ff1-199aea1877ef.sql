
-- Make product_name nullable with default (keep for backward compat but stop requiring it)
ALTER TABLE public.order_items ALTER COLUMN product_name SET DEFAULT '';
ALTER TABLE public.order_items ALTER COLUMN product_name DROP NOT NULL;

-- Create user_addresses table
CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text DEFAULT 'Nhà',
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON public.user_addresses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to update their pending orders (for editing order info)
CREATE POLICY "Users can update pending orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Allow admins to view all profiles for user management
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
