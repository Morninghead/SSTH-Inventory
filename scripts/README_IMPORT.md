# Purchase Order Import Script

This script imports historical purchase order data from an Excel (.xlsx) file.

## Prerequisites

Install required packages:
```bash
pip install pandas openpyxl python-dotenv supabase
```

## Setup

1. Ensure your `.env` file has Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. **Important**: Create all items in the system FIRST before running the import
   - The script will look up items by exact description match
   - If an item is not found, the import will fail for that PO

## Input File Format

Excel (.xlsx) file with these columns:
```
PO No. | Date Open PO | Item | Quantity | UOM | Price/Unit | Gross | Vat | Total | Vendor | Invoice No. | Invoice Date Issue
```

## Usage

```bash
python scripts/import_po_data.py path/to/your/data.xlsx
```

## What It Does

1. ✅ **Auto-creates vendors** if they don't exist in suppliers table
2. ✅ **Looks up items** by description (must exist first)
3. ✅ **Preserves original dates** from your data
4. ✅ **Groups line items** by PO Number
5. ✅ **Calculates totals** automatically
6. ✅ **Handles Thai characters** (UTF-8 encoding)

## Example

If your data file is `purchasing_2025.xlsx`:
```bash
python scripts/import_po_data.py purchasing_2025.xlsx
```

## Output

The script will show:
- Progress for each PO
- Vendor creation/lookup results
- Success/failure summary
- Any errors encountered

## Troubleshooting

**"Item not found" error**: 
- Create the item in the system first
- Ensure the item description matches exactly (case-sensitive)

**Date parsing error**:
- Dates should be in format: `2-Jan-25` or `3-Jan-2025`
- Script will use today's date if parsing fails

**Vendor issues**:
- Vendors are auto-created with code `SUP-0001`, `SUP-0002`, etc.
- Check the suppliers table after import
