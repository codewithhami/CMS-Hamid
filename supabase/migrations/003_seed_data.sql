-- Seed data for testing Industry Management System

-- 1. Insert a test employee
INSERT INTO employees (id, name, father_name, cnic, phone, designation, department, salary, joining_date, status, address)
VALUES 
('d5000000-0000-0000-0000-000000000001', 'Ahmed Khan', 'Mohammad Khan', '35201-1234567-1', '0300-1234567', 'Machine Operator', 'Production', 35000, '2023-01-15', 'active', 'Lahore'),
('d5000000-0000-0000-0000-000000000002', 'Ali Raza', 'Raza Ali', '35201-7654321-2', '0312-9876543', 'Supervisor', 'Production', 50000, '2022-06-01', 'active', 'Faisalabad');

-- 2. Insert Mess (Food) Records
INSERT INTO meal_records (id, employee_id, date, meal_type, amount, notes)
VALUES
(gen_random_uuid(), 'd5000000-0000-0000-0000-000000000001', CURRENT_DATE, 'lunch', 250, 'Standard lunch'),
(gen_random_uuid(), 'd5000000-0000-0000-0000-000000000002', CURRENT_DATE, 'lunch', 250, 'Standard lunch');

-- 3. Insert Salary Records
INSERT INTO salary_records (id, employee_id, month, year, base_salary, deductions, bonus, advance_amount, net_salary, status)
VALUES
(gen_random_uuid(), 'd5000000-0000-0000-0000-000000000001', 1, 2024, 35000, 2000, 5000, 10000, 38000, 'partial'),
(gen_random_uuid(), 'd5000000-0000-0000-0000-000000000002', 1, 2024, 50000, 0, 0, 0, 50000, 'pending');

-- 4. Insert Thread Expenses
INSERT INTO thread_expenses (id, date, vendor, thread_type, quantity, unit, unit_price, total_amount)
VALUES
(gen_random_uuid(), CURRENT_DATE - INTERVAL '2 days', 'Pakistan Textiles', 'Cotton 40/2', 100, 'cones', 250, 25000),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', 'Lahore Threads', 'Polyester 60/2', 50, 'cones', 180, 9000);

-- 5. Insert Clipping Expenses
INSERT INTO clipping_expenses (id, date, description, quantity, unit_price, total_amount)
VALUES
(gen_random_uuid(), CURRENT_DATE, 'Edge trimming blades', 20, 350, 7000);

-- 6. Insert Rent Records
INSERT INTO rent_records (id, property_name, month, year, amount, status)
VALUES
(gen_random_uuid(), 'Factory Unit A', 1, 2024, 150000, 'paid');

-- 7. Insert Electricity Bills
INSERT INTO electricity_bills (id, meter_name, month, year, units_consumed, rate_per_unit, total_amount, status)
VALUES
(gen_random_uuid(), 'MTR-001', 1, 2024, 5200, 25, 130000, 'paid');

-- 8. Insert Other Expenses
INSERT INTO other_expenses (id, date, category, description, amount)
VALUES
(gen_random_uuid(), CURRENT_DATE, 'General', 'Office Supplies', 5000);

-- 9. Insert Vendors details
INSERT INTO vendors (id, name, phone)
VALUES
('b5000000-0000-0000-0000-000000000001', 'Essa Whole Sale Dealer', '0300-1122334');

-- 10. Insert Vendor Orders & Parts
INSERT INTO vendor_orders (id, vendor_id, date, design_name, invoice_label)
VALUES
('c5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', CURRENT_DATE, 'ES-37', 'Dated 07-11-2025');

INSERT INTO vendor_order_parts (id, order_id, part_name, stitches, rate, head, repeat_count)
VALUES
(gen_random_uuid(), 'c5000000-0000-0000-0000-000000000001', 'Front', 101514, 0.9, 24, 4),
(gen_random_uuid(), 'c5000000-0000-0000-0000-000000000001', 'Back', 11663, 0.9, 24, 4),
(gen_random_uuid(), 'c5000000-0000-0000-0000-000000000001', 'Duphata', 28546, 0.9, 24, 8);

-- 11. Insert Vendor Payments
INSERT INTO vendor_payments (id, vendor_id, date, amount, notes)
VALUES
(gen_random_uuid(), 'b5000000-0000-0000-0000-000000000001', CURRENT_DATE, 15000, 'Cash advance');
