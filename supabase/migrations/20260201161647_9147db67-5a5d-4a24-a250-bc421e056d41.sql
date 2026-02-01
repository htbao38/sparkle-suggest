-- Add database constraints for input validation

-- Orders table constraints
ALTER TABLE public.orders 
  ADD CONSTRAINT check_customer_name_length CHECK (length(customer_name) <= 200),
  ADD CONSTRAINT check_customer_phone_format CHECK (customer_phone ~ '^[0-9+\-\s()]{7,20}$'),
  ADD CONSTRAINT check_customer_email_format CHECK (customer_email IS NULL OR customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT check_shipping_address_length CHECK (length(shipping_address) <= 500),
  ADD CONSTRAINT check_notes_length CHECK (notes IS NULL OR length(notes) <= 1000),
  ADD CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0);

-- Products table constraints  
ALTER TABLE public.products
  ADD CONSTRAINT check_product_name_length CHECK (length(name) <= 300),
  ADD CONSTRAINT check_product_description_length CHECK (description IS NULL OR length(description) <= 5000),
  ADD CONSTRAINT check_price_positive CHECK (price > 0),
  ADD CONSTRAINT check_price_max CHECK (price <= 100000000000),
  ADD CONSTRAINT check_original_price_positive CHECK (original_price IS NULL OR original_price > 0),
  ADD CONSTRAINT check_weight_valid CHECK (weight IS NULL OR (weight > 0 AND weight <= 10000)),
  ADD CONSTRAINT check_stock_valid CHECK (stock IS NULL OR (stock >= 0 AND stock <= 100000));

-- Profiles table constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT check_full_name_length CHECK (full_name IS NULL OR length(full_name) <= 200),
  ADD CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~ '^[0-9+\-\s()]*$'),
  ADD CONSTRAINT check_phone_length CHECK (phone IS NULL OR length(phone) <= 20),
  ADD CONSTRAINT check_address_length CHECK (address IS NULL OR length(address) <= 500);