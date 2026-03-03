-- Create sample issue transactions for November 2025 to demonstrate dashboard functionality

-- First, let's create some sample issue transactions with realistic items

-- Issue Transaction 1 - Office Supplies to Administration
INSERT INTO transactions (transaction_type, reference_number, department_id, notes, created_by, created_at) VALUES
('ISSUE', 'ISU-2025112001',
 (SELECT dept_id FROM departments WHERE dept_name = 'Administration' LIMIT 1),
 'Monthly office supplies distribution',
 (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
 '2025-11-15 09:30:00');

-- Get the transaction ID
SET @trans1_id = (SELECT currval('transactions_transaction_id_seq'));

-- Add transaction lines for office supplies
INSERT INTO transaction_lines (transaction_id, item_id, quantity, unit_cost, notes) VALUES
(@trans1_id, (SELECT item_id FROM items WHERE description ILIKE '%A4 paper%' LIMIT 1), 5, 25.00, 'Ream of A4 paper'),
(@trans1_id, (SELECT item_id FROM items WHERE description ILIKE '%pen%' LIMIT 1), 20, 5.00, 'Ballpoint pens'),
(@trans1_id, (SELECT item_id FROM items WHERE description ILIKE '%stapler%' LIMIT 1), 2, 45.00, 'Heavy duty staplers'),
(@trans1_id, (SELECT item_id FROM items WHERE description ILIKE '%folder%' LIMIT 1), 15, 8.00, 'File folders');

-- Issue Transaction 2 - Medical Supplies to Medical Department
INSERT INTO transactions (transaction_type, reference_number, department_id, notes, created_by, created_at) VALUES
('ISSUE', 'ISU-2025112002',
 (SELECT dept_id FROM departments WHERE dept_name = 'Medical' LIMIT 1),
 'Medical supplies restock',
 (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
 '2025-11-18 14:20:00');

SET @trans2_id = (SELECT currval('transactions_transaction_id_seq'));

INSERT INTO transaction_lines (transaction_id, item_id, quantity, unit_cost, notes) VALUES
(@trans2_id, (SELECT item_id FROM items WHERE description ILIKE '%glove%' LIMIT 1), 50, 2.50, 'Latex gloves'),
(@trans2_id, (SELECT item_id FROM items WHERE description ILIKE '%mask%' LIMIT 1), 100, 1.00, 'Face masks'),
(@trans2_id, (SELECT item_id FROM items WHERE description ILIKE '%thermometer%' LIMIT 1), 5, 120.00, 'Digital thermometers'),
(@trans2_id, (SELECT item_id FROM items WHERE description ILIKE '%bandage%' LIMIT 1), 30, 15.00, 'Medical bandages');

-- Issue Transaction 3 - Cleaning Supplies to Housekeeping
INSERT INTO transactions (transaction_type, reference_number, department_id, notes, created_by, created_at) VALUES
('ISSUE', 'ISU-2025112003',
 (SELECT dept_id FROM departments WHERE dept_name = 'Housekeeping' LIMIT 1),
 'Weekly cleaning supplies',
 (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
 '2025-11-19 08:15:00');

SET @trans3_id = (SELECT currval('transactions_transaction_id_seq'));

INSERT INTO transaction_lines (transaction_id, item_id, quantity, unit_cost, notes) VALUES
(@trans3_id, (SELECT item_id FROM items WHERE description ILIKE '%soap%' LIMIT 1), 25, 18.00, 'Hand soap dispensers'),
(@trans3_id, (SELECT item_id FROM items WHERE description ILIKE '%trash bag%' LIMIT 1), 40, 6.00, 'Large trash bags'),
(@trans3_id, (SELECT item_id FROM items WHERE description ILIKE '%mop%' LIMIT 1), 8, 85.00, 'Mop heads'),
(@trans3_id, (SELECT item_id FROM items WHERE description ILIKE '%broom%' LIMIT 1), 6, 120.00, 'Angle brooms');

-- Issue Transaction 4 - Safety Equipment to Operations
INSERT INTO transactions (transaction_type, reference_number, department_id, notes, created_by, created_at) VALUES
('ISSUE', 'ISU-2025112004',
 (SELECT dept_id FROM departments WHERE dept_name = 'Operations' LIMIT 1),
 'Safety equipment distribution',
 (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
 '2025-11-20 10:45:00');

SET @trans4_id = (SELECT currval('transactions_transaction_id_seq'));

INSERT INTO transaction_lines (transaction_id, item_id, quantity, unit_cost, notes) VALUES
(@trans4_id, (SELECT item_id FROM items WHERE description ILIKE '%helmet%' LIMIT 1), 15, 150.00, 'Safety helmets'),
(@trans4_id, (SELECT item_id FROM items WHERE description ILIKE '%glove%' LIMIT 1), 30, 25.00, 'Work gloves'),
(@trans4_id, (SELECT item_id FROM items WHERE description ILIKE '%vest%' LIMIT 1), 20, 65.00, 'Safety vests'),
(@trans4_id, (SELECT item_id FROM items WHERE description ILIKE '%goggle%' LIMIT 1), 25, 35.00, 'Safety goggles');

-- Issue Transaction 5 - Electronics to IT Department
INSERT INTO transactions (transaction_type, reference_number, department_id, notes, created_by, created_at) VALUES
('ISSUE', 'ISU-2025112005',
 (SELECT dept_id FROM departments WHERE dept_name = 'IT' LIMIT 1),
 'IT equipment allocation',
 (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
 '2025-11-19 16:30:00');

SET @trans5_id = (SELECT currval('transactions_transaction_id_seq'));

INSERT INTO transaction_lines (transaction_id, item_id, quantity, unit_cost, notes) VALUES
(@trans5_id, (SELECT item_id FROM items WHERE description ILIKE '%keyboard%' LIMIT 1), 12, 450.00, 'USB keyboards'),
(@trans5_id, (SELECT item_id FROM items WHERE description ILIKE '%mouse%' LIMIT 1), 12, 280.00, 'Wireless mice'),
(@trans5_id, (SELECT item_id FROM items WHERE description ILIKE '%cable%' LIMIT 1), 30, 45.00, 'USB cables'),
(@trans5_id, (SELECT item_id FROM items WHERE description ILIKE '%extension%' LIMIT 1), 8, 120.00, 'Power extension cords');