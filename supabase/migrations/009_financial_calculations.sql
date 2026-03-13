-- Add total_bill generated column to vendor_order_parts
ALTER TABLE vendor_order_parts 
ADD COLUMN IF NOT EXISTS total_bill NUMERIC(12, 2) 
GENERATED ALWAYS AS ((stitches / 1000.0) * rate * head * repeat_count) STORED;
