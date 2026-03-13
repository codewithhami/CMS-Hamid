-- Migration to simplify thread_expenses table
-- Removing unused columns and standardizing units

-- 1. Update existing 'cones' to 'boxes'
UPDATE public.thread_expenses 
SET unit = 'boxes' 
WHERE unit = 'cones';

-- 2. Remove columns
ALTER TABLE public.thread_expenses 
DROP COLUMN IF EXISTS vendor,
DROP COLUMN IF EXISTS unit_price,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS created_by;

-- 3. Set default for unit
ALTER TABLE public.thread_expenses 
ALTER COLUMN unit SET DEFAULT 'boxes';
