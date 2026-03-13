-- Create Vendor Taans
CREATE TABLE IF NOT EXISTS vendor_taans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE vendor_taans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage vendor taans
CREATE POLICY "Allow authenticated users full access to vendor_taans" ON vendor_taans FOR ALL TO authenticated USING (true);
