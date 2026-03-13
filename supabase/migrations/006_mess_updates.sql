-- Create Mess Bills table (monthly total bill)
CREATE TABLE IF NOT EXISTS mess_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, year)
);

-- RLS
ALTER TABLE mess_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to mess_bills" ON mess_bills FOR ALL TO authenticated USING (true);
