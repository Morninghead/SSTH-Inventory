# Multi-Level UOM Setup Guide

This guide will help you set up multi-level Unit of Measure (UOM) support for your SSTH Inventory System.

## Overview

The multi-level UOM feature allows you to:
- Define hierarchical relationships between units (e.g., 1 BOX = 10 PACKS = 120 EA)
- Track inventory in the base unit while ordering/receiving in any supported unit
- Display stock levels in multiple UOMs for better understanding
- Configure item-specific UOM conversions when needed

## Setup Instructions

### 1. Apply Database Schema

First, run the SQL script to create the necessary tables and functions:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `MULTI-LEVEL-UOM-SCHEMA-FIXED.sql` (the fixed version)
5. Paste it into the SQL editor
6. Click **Run** to execute

This will create:
- `uom` table - Master list of all available units
- `uom_conversions` table - Conversion factors between units
- New columns in `items` table for enhanced UOM support
- Helper functions for conversions

### 2. Generate Updated TypeScript Types

After applying the schema, update your TypeScript types:

```bash
npx supabase gen types typescript --project-id viabjxdggrdarcveaxam > src/types/database.types.ts
```

### 3. Verify Setup

Once complete, you should see:
- 38 predefined UOMs (EA, PCS, BOX, PACK, CASE, PALLET, etc.)
- 18 global conversion rules (e.g., 1 BOX = 10 PACKS)
- New UOM management features in the Item form

## Usage Guide

### Managing UOMs for Items

1. **Edit any item** in your inventory
2. Click the **Package icon** (📦) next to the UOM dropdown
3. This opens the **UOM Management Modal** where you can:
   - View existing conversions (global and item-specific)
   - Add item-specific conversions
   - Edit or delete conversions

### Example: Setting Up Box/Pack/Each Hierarchy

For an item that comes in boxes containing packs:

1. **Base UOM**: Select "EA" (Each) as the smallest unit
2. **Add conversions**:
   - 1 PACK = 12 EA
   - 1 BOX = 10 PACKS (or 120 EA)
3. **Result**:
   - Stock is tracked in EA
   - You can issue/receive in EA, PACK, or BOX
   - System automatically converts between units

### Viewing Multi-Level Stock

In the inventory list, you'll see:
- Primary quantity in base UOM (e.g., "120 EA")
- A **layers icon** (📚) next to the quantity
- Click the icon to see the breakdown:
  - "1 Box, 0 Pack, 0 Each"
  - Or "0 Box, 10 Pack, 0 Each"
  - Or "0 Box, 0 Pack, 120 Each"

### Adding Custom UOMs

Need a special UOM? Admins can add new ones:

1. Go to the UOM Management Modal
2. Add conversions using any existing UOM codes
3. Common patterns:
   - Regional units: "CRATE", "BOTTLE", "TUBE"
   - Industry-specific: "SET", "KIT", "REEL"
   - Weight/Volume: "KG", "L", "GAL"

## Technical Details

### Conversion Logic

The system uses a recursive algorithm to:
1. Find direct conversions first
2. Build conversion chains for complex cases
3. Always convert through base UOM for accuracy
4. Support up to 5 levels of conversion

### Performance Considerations

- Conversions are cached after first calculation
- Global conversions (item_id = null) apply to all items
- Item-specific conversions override global ones
- Rounding is handled at 6 decimal places for precision

### Database Functions

The schema includes these helpful functions:
- `get_uom_conversion(item_id, from_uom, to_uom)` - Get conversion factor
- `convert_uom_quantity(item_id, quantity, from_uom, to_uom)` - Convert quantity
- `get_item_uom_hierarchy(item_id)` - Get all UOMs for an item

## Troubleshooting

### Issue: Can't see UOM Management button
- **Solution**: Ensure you're logged in as Admin or Developer
- **Check**: User role in `user_profiles` table

### Issue: Conversion not working
- **Solution**: Verify the conversion chain exists
- **Check**: Look in `uom_conversions` table for required paths

### Issue: TypeScript errors after update
- **Solution**: Regenerate types using the command above
- **Check**: Make sure `database.types.ts` was updated

## Best Practices

1. **Use standard abbreviations**: EA, PCS, BOX, PACK, CASE
2. **Keep base UOM small**: Use EA or PCS for most items
3. **Document unusual conversions**: Add notes for custom units
4. **Test conversions**: Verify with sample quantities
5. **Keep it simple**: Avoid overly complex conversion chains

## Example Scenarios

### Office Supplies
- Pens: 1 BOX = 12 PACKS, 1 PACK = 12 EA (144 EA total)
- Paper: 1 REAM = 500 SHEETS
- Ink: 1 CARTRIDGE = 1 EA

### Medical Supplies
- Gloves: 1 BOX = 10 PACKS, 1 PACK = 100 PAIRS
- Masks: 1 CASE = 20 BOXES, 1 BOX = 50 EA
- Medicine: 1 BOTTLE = 100 TABLETS

### Cleaning Supplies
- Soap: 1 BOTTLE = 500 ML
- Trash Bags: 1 ROLL = 20 BAGS
- Mops: 1 EACH (no conversion needed)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify database schema was applied correctly
3. Ensure TypeScript types are up to date
4. Test with simple conversions first

## Next Steps

After setup:
1. Configure UOMs for your key items
2. Train staff on using the UOM Management feature
3. Update any existing inventory quantities if needed
4. Consider importing item-specific conversions in bulk