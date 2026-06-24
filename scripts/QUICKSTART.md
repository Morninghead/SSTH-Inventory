# Quick Start Guide - PO Import

## Step 1: Install Dependencies

```bash
pip install pandas openpyxl python-dotenv supabase
```

## Step 2: Create Your Items First

Before importing, you need to create all items in the system with cleaned-up names. The import script will match items by exact description.

**Example**: If your data has "Ballpen - blue", create an item with description exactly "Ballpen - blue"

## Step 3: Prepare Your Data File

Save your data as an Excel file (.xlsx). 

**Important**: 
- Keep all columns with exact header names
- Save as .xlsx format (Excel 2007 or later)
- UTF-8 encoding is handled automatically

## Step 4: Run Import

```bash
python scripts/import_po_data.py your_data_file.xlsx
```

## Step 5: Verify Results

The script will show:
- ✅ Each PO created successfully
- ✓ Vendors found/created  
- ❌ Any errors encountered
- Final summary with counts

---

## Test with Sample Data

A sample file is included: `scripts/sample_po_data.txt`

To test:
```bash
# 1. Create the items first in your system (13 items from sample)
# 2. Run the import
python scripts/import_po_data.py scripts/sample_po_data.txt
```

Expected result: 3 POs with 13 total line items

---

## When You're Ready for Full Import

1. Clean up your item names in Excel
2. Create all items in the SSTH Inventory system  
3. Save your Excel file (.xlsx format)
4. Run the import script
5. Verify the results in your Purchase Orders page

---

## Need Help?

Common issues:
- **"Item not found"**: Create the item in system first with exact same description
- **"Error reading Excel file"**: Ensure file is .xlsx format and openpyxl is installed
- **Missing columns**: Ensure all required columns are present with correct names
