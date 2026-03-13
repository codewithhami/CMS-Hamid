-- Adds an advance_amount column to the salary_records table

ALTER TABLE public.salary_records 
ADD COLUMN advance_amount numeric(12, 2) not null default 0;
