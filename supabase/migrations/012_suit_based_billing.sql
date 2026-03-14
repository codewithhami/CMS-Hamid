-- Convert total_bill to regular column and add suit billing fields
DO $$ 
BEGIN
    -- 1. Create a temporary column to hold existing generated data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_order_parts' AND column_name = 'total_bill' AND is_generated = 'ALWAYS') THEN
        ALTER TABLE vendor_order_parts ADD COLUMN temp_total NUMERIC(12, 2);
        
        -- 2. Copy the data from the generated column
        UPDATE vendor_order_parts SET temp_total = total_bill;
        
        -- 3. Drop the generated column
        ALTER TABLE vendor_order_parts DROP COLUMN total_bill;
        
        -- 4. Re-add total_bill as a regular column
        ALTER TABLE vendor_order_parts ADD COLUMN total_bill NUMERIC(12, 2) DEFAULT 0.0;
        
        -- 5. Copy the data back
        UPDATE vendor_order_parts SET total_bill = temp_total;
        
        -- 6. Remove the temporary column
        ALTER TABLE vendor_order_parts DROP COLUMN temp_total;
    END IF;

    -- 7. Add suit-based billing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_order_parts' AND column_name = 'is_suit') THEN
        ALTER TABLE vendor_order_parts ADD COLUMN is_suit BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_order_parts' AND column_name = 'suit_quantity') THEN
        ALTER TABLE vendor_order_parts ADD COLUMN suit_quantity NUMERIC(12, 2) DEFAULT 0.0;
    END IF;
END $$;
