"""
Bulk Import Purchase Orders from Tab-Delimited File
===================================================

This script imports historical purchase order data into the SSTH Inventory system.

Requirements:
- Python 3.7+
- pandas
- python-dotenv
- supabase-py

Usage:
    python import_po_data.py input_file.txt

Input Format:
    Tab-delimited file with columns:
    PO No., Date Open PO, Item, Quantity, UOM, Price/Unit, Gross, Vat, Total, 
    Vendor, Invoice No., Invoice Date Issue

Features:
- Auto-creates vendors if they don't exist
- Expects pre-cleaned item names
- Imports with original dates (historical data)
- Groups multiple lines into single POs
- UTF-8 encoding for Thai language support
"""

import pandas as pd
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials in .env file")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global caches
vendor_cache: Dict[str, str] = {}  # vendor_name -> supplier_id
item_cache: Dict[str, str] = {}    # item_description -> item_id


def parse_date(date_str: str) -> str:
    """Parse date from '2-Jan-25' format to ISO format"""
    try:
        # Handle formats like "2-Jan-25" or "3-Jan-25"
        dt = datetime.strptime(date_str.strip(), '%d-%b-%y')
        return dt.strftime('%Y-%m-%d')
    except ValueError:
        print(f"⚠️  Warning: Could not parse date '{date_str}', using today's date")
        return datetime.now().strftime('%Y-%m-%d')


def clean_number(value) -> float:
    """Remove spaces and convert to float"""
    if pd.isna(value):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    # Remove spaces and convert
    return float(str(value).replace(' ', '').replace(',', ''))


def get_or_create_vendor(vendor_name: str) -> str:
    """Get vendor ID or create new vendor"""
    vendor_name = vendor_name.strip()
    
    # Check cache first
    if vendor_name in vendor_cache:
        return vendor_cache[vendor_name]
    
    # Search for existing vendor
    response = supabase.table('suppliers').select('supplier_id').ilike('supplier_name', vendor_name).execute()
    
    if response.data and len(response.data) > 0:
        supplier_id = response.data[0]['supplier_id']
        vendor_cache[vendor_name] = supplier_id
        print(f"✓ Found existing vendor: {vendor_name}")
        return supplier_id
    
    # Create new vendor
    supplier_code = f"SUP-{len(vendor_cache) + 1:04d}"
    new_vendor = {
        'supplier_name': vendor_name,
        'supplier_code': supplier_code,
        'is_active': True
    }
    
    response = supabase.table('suppliers').insert(new_vendor).execute()
    
    if response.data and len(response.data) > 0:
        supplier_id = response.data[0]['supplier_id']
        vendor_cache[vendor_name] = supplier_id
        print(f"✓ Created new vendor: {vendor_name} ({supplier_code})")
        return supplier_id
    else:
        raise Exception(f"Failed to create vendor: {vendor_name}")


def get_item_id(item_name: str, uom: str) -> str:
    """Get item ID by description (assumes items are pre-cleaned)"""
    item_name = item_name.strip()
    
    # Check cache first
    if item_name in item_cache:
        return item_cache[item_name]
    
    # Search for existing item by description
    response = supabase.table('items').select('item_id').eq('description', item_name).execute()
    
    if response.data and len(response.data) > 0:
        item_id = response.data[0]['item_id']
        item_cache[item_name] = item_id
        return item_id
    else:
        raise Exception(f"Item not found: '{item_name}'. Please ensure items are created first.")


def create_purchase_order(po_data: Dict, lines: List[Dict]) -> str:
    """Create purchase order with line items"""
    
    # Calculate totals
    subtotal = sum(line['line_total'] for line in lines)
    vat_amount = subtotal * 0.07  # 7% VAT
    total_amount = subtotal + vat_amount
    
    # Create PO header
    po_record = {
        'po_number': po_data['po_number'],
        'supplier_id': po_data['supplier_id'],
        'po_date': po_data['po_date'],
        'expected_date': po_data.get('invoice_date'),
        'reference_number': po_data.get('invoice_no'),
        'subtotal_amount': subtotal,
        'vat_amount': vat_amount,
        'vat_rate': 7.0,
        'total_amount': total_amount,
        'status': 'COMPLETED',
        'notes': 'Imported from historical data'
    }
    
    response = supabase.table('purchase_order').insert(po_record).execute()
    
    if not response.data or len(response.data) == 0:
        raise Exception(f"Failed to create PO: {po_data['po_number']}")
    
    po_id = response.data[0]['po_id']
    
    # Create PO lines
    line_records = []
    for line in lines:
        line_records.append({
            'po_id': po_id,
            'item_id': line['item_id'],
            'quantity': line['quantity'],
            'unit_cost': line['unit_cost'],
            'line_total': line['line_total']
        })
    
    response = supabase.table('purchase_order_line').insert(line_records).execute()
    
    if not response.data:
        raise Exception(f"Failed to create PO lines for: {po_data['po_number']}")
    
    return po_id


def import_po_data(file_path: str):
    """Main import function"""
    
    print(f"\n{'='*60}")
    print(f"Starting PO Import from: {file_path}")
    print(f"{'='*60}\n")
    
    # Read tab-delimited file with UTF-8 encoding
    df = pd.read_csv(file_path, sep='\t', encoding='utf-8')
    
    print(f"📊 Loaded {len(df)} rows from file\n")
    
    # Clean column names (remove extra spaces)
    df.columns = df.columns.str.strip()
    
    # Group by PO Number
    grouped = df.groupby('PO No.')
    
    total_pos = len(grouped)
    successful_pos = 0
    failed_pos = []
    
    print(f"📦 Processing {total_pos} purchase orders...\n")
    
    for po_number, po_lines in grouped:
        try:
            print(f"Processing PO: {po_number} ({len(po_lines)} items)")
            
            # Get first row for PO-level data
            first_row = po_lines.iloc[0]
            
            # Get or create vendor
            vendor_id = get_or_create_vendor(first_row['Vendor'])
            
            # Prepare PO data
            po_data = {
                'po_number': str(po_number),
                'supplier_id': vendor_id,
                'po_date': parse_date(first_row['Date Open PO']),
                'invoice_no': str(first_row['Invoice No.']),
                'invoice_date': parse_date(first_row['Invoice Date Issue'])
            }
            
            # Process line items
            lines = []
            for _, row in po_lines.iterrows():
                item_id = get_item_id(row['Item'], row['UOM'])
                
                lines.append({
                    'item_id': item_id,
                    'quantity': clean_number(row['Quantity']),
                    'unit_cost': clean_number(row['Price/Unit']),
                    'line_total': clean_number(row['Gross'])
                })
            
            # Create PO
            po_id = create_purchase_order(po_data, lines)
            
            print(f"✅ Successfully created PO: {po_number} (ID: {po_id})\n")
            successful_pos += 1
            
        except Exception as e:
            print(f"❌ Error processing PO {po_number}: {str(e)}\n")
            failed_pos.append((po_number, str(e)))
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Import Summary")
    print(f"{'='*60}")
    print(f"✅ Successful: {successful_pos}/{total_pos} POs")
    if failed_pos:
        print(f"❌ Failed: {len(failed_pos)}/{total_pos} POs")
        print("\nFailed POs:")
        for po_num, error in failed_pos:
            print(f"  - {po_num}: {error}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_po_data.py <input_file.txt>")
        print("\nExample:")
        print("  python import_po_data.py purchasing_data.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not Path(input_file).exists():
        print(f"❌ Error: File not found: {input_file}")
        sys.exit(1)
    
    import_po_data(input_file)
