import * as XLSX from 'xlsx';

// All items categorized with UOM settings
const items = [
    // Office Supplies
    { item_code: 'OFF-001', description: 'A4 Copy Paper 70 Grams', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 150, reorder_level: 50 },
    { item_code: 'OFF-002', description: 'A4 - red', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-003', description: 'A4 - blue', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-004', description: 'A4 - green', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-005', description: 'A4 - yellow', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-006', description: 'A4 - pink', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-007', description: 'A4 - purple', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-008', description: 'A4 - green (เขียวอ่อน)', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-009', description: 'A4- green (QA) เขียวแก่', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 180, reorder_level: 20 },
    { item_code: 'OFF-010', description: 'A3 Copy Paper', category: 'Office Supplies', uom: 'REAM', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 250, reorder_level: 20 },
    { item_code: 'OFF-011', description: 'Ballpen - blue', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 10, reorder_level: 100 },
    { item_code: 'OFF-012', description: 'Ballpen - red', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 10, reorder_level: 50 },
    { item_code: 'OFF-013', description: 'Pencil', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 5, reorder_level: 100 },
    { item_code: 'OFF-014', description: 'Eraser', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 10, reorder_level: 50 },
    { item_code: 'OFF-015', description: 'Sharpener', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 15, reorder_level: 30 },
    { item_code: 'OFF-016', description: 'Ruler', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 20, reorder_level: 30 },
    { item_code: 'OFF-017', description: 'Scissors', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 50, reorder_level: 20 },
    { item_code: 'OFF-018', description: 'Glue Stick', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 25, reorder_level: 50 },
    { item_code: 'OFF-019', description: 'Stapler', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 10 },
    { item_code: 'OFF-020', description: 'Staples no.10', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 15, reorder_level: 50 },
    { item_code: 'OFF-021', description: 'Staples no.10-1M', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 20, reorder_level: 30 },
    { item_code: 'OFF-022', description: 'Staples no.3(24/6)', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 15, reorder_level: 50 },
    { item_code: 'OFF-023', description: 'Staples no.23/10-M', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 25, reorder_level: 30 },
    { item_code: 'OFF-024', description: 'Staples no.23/13-H', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 30, reorder_level: 30 },
    { item_code: 'OFF-025', description: 'Steple Remover', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 25, reorder_level: 20 },
    { item_code: 'OFF-026', description: 'Paper Clip', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 20, reorder_level: 50 },
    { item_code: 'OFF-027', description: 'Binder Clip No.108 (Very Big)', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'OFF-028', description: 'Binder Clip No.109 (Big)', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'OFF-029', description: 'Binder Clip No.110 (Middle)', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 25, reorder_level: 40 },
    { item_code: 'OFF-030', description: 'Binder Clip No.112 (Small)', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 20, reorder_level: 50 },
    { item_code: 'OFF-031', description: 'Cutter (BIG)', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'OFF-032', description: 'Cutter Spare Blade A-100', category: 'Office Supplies', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 30, reorder_level: 30 },
    { item_code: 'OFF-033', description: 'Cutter Spare Blade A-150', category: 'Office Supplies', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'OFF-034', description: 'Fastenner', category: 'Office Supplies', uom: 'BOX', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 50, reorder_level: 20 },
    { item_code: 'OFF-035', description: 'L-Holder', category: 'Office Supplies', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 5, reorder_level: 100 },

    // Markers & Writing
    { item_code: 'MRK-001', description: 'Marker - red', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 25, reorder_level: 30 },
    { item_code: 'MRK-002', description: 'Marker - blue', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 25, reorder_level: 30 },
    { item_code: 'MRK-003', description: 'Marker - black', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 25, reorder_level: 30 },
    { item_code: 'MRK-004', description: 'Highlighter', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 20, reorder_level: 50 },
    { item_code: 'MRK-005', description: 'Whiteboard - black', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'MRK-006', description: 'Whiteboard - blue', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'MRK-007', description: 'Whiteboard - red', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 20 },
    { item_code: 'MRK-008', description: 'Board Eraser', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 50, reorder_level: 10 },
    { item_code: 'MRK-009', description: 'Permanent - Black', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 30, reorder_level: 30 },
    { item_code: 'MRK-010', description: 'Permanent - Blue', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 30, reorder_level: 20 },
    { item_code: 'MRK-011', description: 'Permanent - Red', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 30, reorder_level: 20 },
    { item_code: 'MRK-012', description: 'Paint Marker (Orange)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-013', description: 'Paint Marker (Pink)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-014', description: 'Paint Marker (Yellow)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-015', description: 'Paint Marker (Green)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-016', description: 'Paint Marker (White)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-017', description: 'Paint Marker (Blue)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-018', description: 'Paint Marker (Red)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-019', description: 'Paint Marker (Black)', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'MRK-020', description: 'Dermatograph Pencil - black', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 20 },
    { item_code: 'MRK-021', description: 'Dermatograph Pencil - red', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 20 },
    { item_code: 'MRK-022', description: 'Liquid Paper & Correction Tape', category: 'Markers & Writing', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 25, reorder_level: 30 },

    // Stamps & Ink
    { item_code: 'STP-001', description: 'Stamp Pad - blue', category: 'Stamps & Ink', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 50, reorder_level: 10 },
    { item_code: 'STP-002', description: 'Stamp Pad Ink - blue', category: 'Stamps & Ink', uom: 'BOTTLE', ordering_uom: 'EA', outermost_uom: '', unit_cost: 35, reorder_level: 20 },
    { item_code: 'STP-003', description: 'Stamp Pad Ink - red', category: 'Stamps & Ink', uom: 'BOTTLE', ordering_uom: 'EA', outermost_uom: '', unit_cost: 35, reorder_level: 10 },
    { item_code: 'STP-004', description: 'Refill Ink - blue', category: 'Stamps & Ink', uom: 'BOTTLE', ordering_uom: 'EA', outermost_uom: '', unit_cost: 30, reorder_level: 20 },
    { item_code: 'STP-005', description: 'Date Stamp', category: 'Stamps & Ink', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 150, reorder_level: 5 },
    { item_code: 'STP-006', description: 'Date Stamp (แบบยาง)', category: 'Stamps & Ink', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 5 },

    // Paper & Filing
    { item_code: 'FIL-001', description: 'Post-it Small', category: 'Paper & Filing', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 25, reorder_level: 50 },
    { item_code: 'FIL-002', description: 'Post-it 3*3', category: 'Paper & Filing', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 35, reorder_level: 50 },
    { item_code: 'FIL-003', description: 'Sheet Protector - 11 holes', category: 'Paper & Filing', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 80, reorder_level: 30 },
    { item_code: 'FIL-004', description: 'Seminar File A4', category: 'Paper & Filing', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 15, reorder_level: 100 },
    { item_code: 'FIL-005', description: 'Laminating Pouch Film - A3', category: 'Paper & Filing', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 150, reorder_level: 10 },
    { item_code: 'FIL-006', description: 'Laminating Pouch Film - A4', category: 'Paper & Filing', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 100, reorder_level: 20 },

    // Tape & Adhesives
    { item_code: 'TAP-001', description: 'Transparent Tape - Big Roll', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 25, reorder_level: 50 },
    { item_code: 'TAP-002', description: 'Transparent Tape - Small Roll', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 15, reorder_level: 50 },
    { item_code: 'TAP-003', description: 'Double Sided Tissue Tape', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'TAP-004', description: 'Double Sided Foam Tape', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'TAP-005', description: 'Anti Slip Tape', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'EA', outermost_uom: '', unit_cost: 250, reorder_level: 10 },
    { item_code: 'TAP-006', description: 'Reflective tape Yellow/Black', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'EA', outermost_uom: '', unit_cost: 300, reorder_level: 10 },
    { item_code: 'TAP-007', description: 'Reflective tape White/Red', category: 'Tape & Adhesives', uom: 'ROLL', ordering_uom: 'EA', outermost_uom: '', unit_cost: 300, reorder_level: 10 },
    { item_code: 'TAP-008', description: 'Self Adhesive Rings', category: 'Tape & Adhesives', uom: 'PACK', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 50, reorder_level: 20 },

    // Safety Equipment (PPE)
    { item_code: 'PPE-001', description: 'Cotton Glove', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: 'CASE', unit_cost: 15, reorder_level: 100 },
    { item_code: 'PPE-002', description: 'Microtex Glove', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: 'CASE', unit_cost: 25, reorder_level: 50 },
    { item_code: 'PPE-003', description: 'PU Glove - Black', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: 'CASE', unit_cost: 35, reorder_level: 50 },
    { item_code: 'PPE-004', description: 'PU Glove - orange', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: 'CASE', unit_cost: 35, reorder_level: 50 },
    { item_code: 'PPE-005', description: 'PU Glove - White', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: 'CASE', unit_cost: 35, reorder_level: 50 },
    { item_code: 'PPE-006', description: 'Rubber Glove', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 45, reorder_level: 30 },
    { item_code: 'PPE-007', description: 'Cut Resistant gloves level 5', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 150, reorder_level: 20 },
    { item_code: 'PPE-008', description: 'Cut Resistant gloves level 5 (Dot)', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 180, reorder_level: 20 },
    { item_code: 'PPE-009', description: 'Welding leather gloves', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 200, reorder_level: 10 },
    { item_code: 'PPE-010', description: 'safety glasses', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 80, reorder_level: 30 },
    { item_code: 'PPE-011', description: 'Visor Bracket', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 150, reorder_level: 10 },
    { item_code: 'PPE-012', description: 'Face Sheild', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 120, reorder_level: 20 },
    { item_code: 'PPE-013', description: 'N95 Mask 3M', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 45, reorder_level: 100 },
    { item_code: 'PPE-014', description: 'Carbon Mask 5 Layers', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 15, reorder_level: 200 },
    { item_code: 'PPE-015', description: 'Cotton Mask', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 10, reorder_level: 100 },
    { item_code: 'PPE-016', description: 'KF94', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'BOX', outermost_uom: 'CASE', unit_cost: 25, reorder_level: 100 },
    { item_code: 'PPE-017', description: 'Ear Plug - wire', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 15, reorder_level: 100 },
    { item_code: 'PPE-018', description: 'Ear Plug - wireless(refill)', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'BOX', outermost_uom: '', unit_cost: 10, reorder_level: 100 },
    { item_code: 'PPE-019', description: 'Safety Shoes NO.39', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'EA', outermost_uom: '', unit_cost: 800, reorder_level: 5 },
    { item_code: 'PPE-020', description: 'Safety Shoes NO.40', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'EA', outermost_uom: '', unit_cost: 800, reorder_level: 5 },
    { item_code: 'PPE-021', description: 'Safety Shoes NO.41', category: 'Safety Equipment', uom: 'PAIR', ordering_uom: 'EA', outermost_uom: '', unit_cost: 800, reorder_level: 5 },
    { item_code: 'PPE-022', description: 'HMT-AYL Safety helmet', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 350, reorder_level: 10 },
    { item_code: 'PPE-023', description: 'ARM-GN - Hand Protection', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 120, reorder_level: 20 },
    { item_code: 'PPE-024', description: 'APN-AP04 - Apron Leather', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 450, reorder_level: 5 },
    { item_code: 'PPE-025', description: 'MDC CAP', category: 'Safety Equipment', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 20 },

    // Cleaning Supplies
    { item_code: 'CLN-001', description: 'Dishwashing Cleaner', category: 'Cleaning Supplies', uom: 'BOTTLE', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 65, reorder_level: 20 },
    { item_code: 'CLN-002', description: 'Floor Cleaner', category: 'Cleaning Supplies', uom: 'BOTTLE', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 85, reorder_level: 20 },
    { item_code: 'CLN-003', description: 'Handwashing Cleaner', category: 'Cleaning Supplies', uom: 'BOTTLE', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 75, reorder_level: 30 },
    { item_code: 'CLN-004', description: 'Mirror Cleaner', category: 'Cleaning Supplies', uom: 'BOTTLE', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 95, reorder_level: 10 },
    { item_code: 'CLN-005', description: 'Toilet Cleaner (Ped Pro)', category: 'Cleaning Supplies', uom: 'BOTTLE', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 85, reorder_level: 20 },
    { item_code: 'CLN-006', description: 'Washing Powder', category: 'Cleaning Supplies', uom: 'KG', ordering_uom: 'BAG', outermost_uom: '', unit_cost: 50, reorder_level: 20 },
    { item_code: 'CLN-007', description: 'Dust Mop Liquid', category: 'Cleaning Supplies', uom: 'BOTTLE', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 120, reorder_level: 10 },
    { item_code: 'CLN-008', description: 'Sponge for washing dishes', category: 'Cleaning Supplies', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 15, reorder_level: 50 },
    { item_code: 'CLN-009', description: 'Garbage bag 18*20', category: 'Cleaning Supplies', uom: 'PACK', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 45, reorder_level: 50 },
    { item_code: 'CLN-010', description: 'Garbage bag 24*28', category: 'Cleaning Supplies', uom: 'PACK', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 65, reorder_level: 50 },
    { item_code: 'CLN-011', description: 'Garbage bag 30*40', category: 'Cleaning Supplies', uom: 'PACK', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 85, reorder_level: 30 },
    { item_code: 'CLN-012', description: 'Garbage bag 36*45', category: 'Cleaning Supplies', uom: 'PACK', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 120, reorder_level: 30 },
    { item_code: 'CLN-013', description: 'Red garbage bags', category: 'Cleaning Supplies', uom: 'PACK', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 150, reorder_level: 20 },
    { item_code: 'CLN-014', description: 'Tissue - mouth', category: 'Cleaning Supplies', uom: 'BOX', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 35, reorder_level: 50 },
    { item_code: 'CLN-015', description: 'Tissue - Face', category: 'Cleaning Supplies', uom: 'BOX', ordering_uom: 'CASE', outermost_uom: '', unit_cost: 45, reorder_level: 50 },

    // Cleaning Tools
    { item_code: 'CTL-001', description: 'Mop', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 150, reorder_level: 10 },
    { item_code: 'CTL-002', description: 'Mop 10"', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 180, reorder_level: 10 },
    { item_code: 'CTL-003', description: 'tatter(Mop)', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 20 },
    { item_code: 'CTL-004', description: 'Spare Dust Mop', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 120, reorder_level: 10 },
    { item_code: 'CTL-005', description: 'Dust Mop', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 250, reorder_level: 5 },
    { item_code: 'CTL-006', description: 'Dustpan', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 10 },
    { item_code: 'CTL-007', description: 'Soft Broom', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 120, reorder_level: 10 },
    { item_code: 'CTL-008', description: 'Coconut Broom', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 10 },
    { item_code: 'CTL-009', description: 'Cobweb broom', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 150, reorder_level: 5 },
    { item_code: 'CTL-010', description: 'Water broom 24"', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 180, reorder_level: 5 },
    { item_code: 'CTL-011', description: 'Long handle floor brush', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 200, reorder_level: 5 },
    { item_code: 'CTL-012', description: 'Toilet brush', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 65, reorder_level: 10 },
    { item_code: 'CTL-013', description: 'Duster', category: 'Cleaning Tools', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 80, reorder_level: 10 },

    // Batteries
    { item_code: 'BAT-001', description: '2A Battery', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: 'BOX', unit_cost: 15, reorder_level: 100 },
    { item_code: 'BAT-002', description: '3A Battery', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: 'BOX', unit_cost: 15, reorder_level: 100 },
    { item_code: 'BAT-003', description: 'Lithium Battery (3V) 2025', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'BAT-004', description: 'Lithium Battery (3V) 2032', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 35, reorder_level: 30 },
    { item_code: 'BAT-005', description: 'Lithium Battery (1.5V) LR44', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 25, reorder_level: 30 },
    { item_code: 'BAT-006', description: 'Microphone Battery (9V)', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 45, reorder_level: 20 },
    { item_code: 'BAT-007', description: 'Panasonic 23A', category: 'Batteries', uom: 'PCS', ordering_uom: 'PACK', outermost_uom: '', unit_cost: 35, reorder_level: 20 },

    // IT & Electronics
    { item_code: 'IT-001', description: 'Keyboard', category: 'IT & Electronics', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 350, reorder_level: 5 },
    { item_code: 'IT-002', description: 'Computer Mouse', category: 'IT & Electronics', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 250, reorder_level: 5 },
    { item_code: 'IT-003', description: 'Fingertip Moistener', category: 'IT & Electronics', uom: 'PCS', ordering_uom: 'EA', outermost_uom: '', unit_cost: 35, reorder_level: 10 },
];

// Create workbook
const wb = XLSX.utils.book_new();

// Convert to worksheet format
const wsData = [
    ['Item Code', 'Description', 'Category', 'UOM', 'Ordering UOM', 'Outermost UOM', 'Unit Cost', 'Reorder Level'],
    ...items.map(item => [
        item.item_code,
        item.description,
        item.category,
        item.uom,
        item.ordering_uom,
        item.outermost_uom,
        item.unit_cost,
        item.reorder_level
    ])
];

const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
    { wch: 12 },  // Item Code
    { wch: 35 },  // Description
    { wch: 20 },  // Category
    { wch: 8 },   // UOM
    { wch: 14 },  // Ordering UOM
    { wch: 14 },  // Outermost UOM
    { wch: 10 },  // Unit Cost
    { wch: 14 }   // Reorder Level
];

XLSX.utils.book_append_sheet(wb, ws, 'Items');

// Write file
const outputPath = './inventory_items_import.xlsx';
XLSX.writeFile(wb, outputPath);

console.log(`✅ Generated ${outputPath} with ${items.length} items`);
console.log('\nCategory breakdown:');
const categories = {};
items.forEach(item => {
    categories[item.category] = (categories[item.category] || 0) + 1;
});
Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} items`);
});
