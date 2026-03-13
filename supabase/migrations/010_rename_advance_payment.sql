-- Rename amount to advance_payment in vendor_payments table
ALTER TABLE vendor_payments RENAME COLUMN amount TO advance_payment;
