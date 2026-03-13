-- Create the factories table
CREATE TABLE IF NOT EXISTS factories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We assume RLS policies on factories will rely on user association later, 
-- but for now, we'll allow an admin/anon role to manage them based on the current app's open setup.
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon" ON factories FOR ALL USING (true) WITH CHECK (true);

-- Insert a default factory to hold all current data
INSERT INTO factories (name, is_default) VALUES ('Main Factory', true) ON CONFLICT DO NOTHING;

-- Create a helper function to get the default factory ID
CREATE OR REPLACE FUNCTION get_default_factory_id() RETURNS UUID AS $$
DECLARE
    def_id UUID;
BEGIN
    SELECT id INTO def_id FROM factories WHERE is_default = true LIMIT 1;
    RETURN def_id;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- Step 2: Add factory_id to all existing tables
-- We assign the default factory ID to existing rows to maintain integrity
-- -------------------------------------------------------------------------

DO $$
DECLARE
    def_factory UUID := get_default_factory_id();
BEGIN

    -- Add to vendors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'factory_id') THEN
        ALTER TABLE vendors ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE vendors SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE vendors ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    -- Add to vendor_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_orders' AND column_name = 'factory_id') THEN
        ALTER TABLE vendor_orders ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE vendor_orders SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE vendor_orders ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    -- Note: vendor_order_parts and vendor_payments don't strictly *need* factory_id if they 
    -- cascade from vendor_orders/vendors, but for querying isolation, adding it is safer and better.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_order_parts' AND column_name = 'factory_id') THEN
        ALTER TABLE vendor_order_parts ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE vendor_order_parts SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE vendor_order_parts ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_payments' AND column_name = 'factory_id') THEN
        ALTER TABLE vendor_payments ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE vendor_payments SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE vendor_payments ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_taans' AND column_name = 'factory_id') THEN
        ALTER TABLE vendor_taans ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE vendor_taans SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE vendor_taans ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    -- Add to employees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'factory_id') THEN
        ALTER TABLE employees ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE employees SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE employees ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    -- Add to salary_records
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_records' AND column_name = 'factory_id') THEN
        ALTER TABLE salary_records ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE salary_records SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE salary_records ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    -- Add to meal_records
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_records' AND column_name = 'factory_id') THEN
        ALTER TABLE meal_records ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE meal_records SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE meal_records ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    -- Expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mess_bills' AND column_name = 'factory_id') THEN
        ALTER TABLE mess_bills ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE mess_bills SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE mess_bills ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'electricity_bills' AND column_name = 'factory_id') THEN
        ALTER TABLE electricity_bills ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE electricity_bills SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE electricity_bills ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_records' AND column_name = 'factory_id') THEN
        ALTER TABLE rent_records ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE rent_records SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE rent_records ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thread_expenses' AND column_name = 'factory_id') THEN
        ALTER TABLE thread_expenses ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE thread_expenses SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE thread_expenses ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clipping_expenses' AND column_name = 'factory_id') THEN
        ALTER TABLE clipping_expenses ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE clipping_expenses SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE clipping_expenses ALTER COLUMN factory_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'other_expenses' AND column_name = 'factory_id') THEN
        ALTER TABLE other_expenses ADD COLUMN factory_id UUID REFERENCES factories(id) ON DELETE CASCADE;
        UPDATE other_expenses SET factory_id = def_factory WHERE factory_id IS NULL;
        ALTER TABLE other_expenses ALTER COLUMN factory_id SET NOT NULL;
    END IF;

END $$;
