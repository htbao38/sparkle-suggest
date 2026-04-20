-- Function to adjust stock when order status changes to/from cancelled
CREATE OR REPLACE FUNCTION public.adjust_stock_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when status actually changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Order moved TO cancelled => restore stock
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      UPDATE public.products p
      SET stock = COALESCE(p.stock, 0) + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id;

    -- Order moved FROM cancelled to something else => decrease stock again
    ELSIF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
      UPDATE public.products p
      SET stock = GREATEST(0, COALESCE(p.stock, 0) - oi.quantity)
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_adjust_stock_on_order_status_change ON public.orders;

-- Trigger on orders update
CREATE TRIGGER trg_adjust_stock_on_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.adjust_stock_on_order_status_change();