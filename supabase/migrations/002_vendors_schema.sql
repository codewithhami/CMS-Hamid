-- Create Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Vendor Orders (Invoices)
CREATE TABLE IF NOT EXISTS vendor_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  design_name TEXT NOT NULL,
  invoice_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order Parts (Front/Back/Duphata)
CREATE TABLE IF NOT EXISTS vendor_order_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES vendor_orders(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  stitches INTEGER NOT NULL DEFAULT 0,
  rate NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  head INTEGER NOT NULL DEFAULT 1,
  repeat_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Vendor Payments
CREATE TABLE IF NOT EXISTS vendor_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage vendor data
CREATE POLICY "Allow authenticated users full access to vendors" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to vendor_orders" ON vendor_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to vendor_order_parts" ON vendor_order_parts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to vendor_payments" ON vendor_payments FOR ALL TO authenticated USING (true);
