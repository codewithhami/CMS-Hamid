-- Cleanup messy columns across multiple tables
ALTER TABLE employees DROP COLUMN IF EXISTS created_by;

ALTER TABLE meal_records 
  DROP COLUMN IF EXISTS meal_type,
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE salary_records
  DROP COLUMN IF EXISTS deductions,
  DROP COLUMN IF EXISTS bonus,
  DROP COLUMN IF EXISTS paid_date,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE clipping_expenses
  DROP COLUMN IF EXISTS date,
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS unit_price,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE rent_records
  DROP COLUMN IF EXISTS property_name,
  DROP COLUMN IF EXISTS paid_date,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;

-- Electricity Bills cleanup
ALTER TABLE electricity_bills
  DROP COLUMN IF EXISTS meter_name,
  DROP COLUMN IF EXISTS units_consumed,
  DROP COLUMN IF EXISTS rate_per_unit,
  DROP COLUMN IF EXISTS paid_date,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;

-- Other Expenses cleanup
ALTER TABLE other_expenses
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;

