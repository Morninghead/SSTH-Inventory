# Stock Counting Feature - Deployment Guide

## Overview
The End-of-Month (EOM) stock counting feature has been implemented. This guide shows how to deploy it to your Supabase database and make it available in the application.

## Prerequisites
- Access to Supabase Dashboard (https://supabase.com/dashboard/project/viabjxdggrdarcveaxam)
- Admin privileges to run SQL scripts
- The application should be deployed to Netlify

## Step 1: Create Database Tables

1. Open Supabase Dashboard
2. Go to: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new
3. Open the file: `STOCK-COUNT-DATABASE-SCHEMA.sql`
4. Copy and paste the entire SQL script
5. Click "Run" to execute the script
6. ✅ This will create 3 tables and 4 database functions

## Step 2: Verify Table Creation

After running the script, verify the tables were created:

In Supabase Dashboard → Table Editor, you should see:
- ✅ `stock_counts` - Stock count header records
- ✅ `stock_count_lines` - Individual item counts
- ✅ `stock_count_adjustments` - Adjustment records

## Step 3: Check Database Functions

The script creates these functions (visible in Database → Functions):
- ✅ `create_stock_count` - Creates new stock count with all items
- ✅ `update_stock_count_line` - Updates physical count quantities
- ✅ `post_stock_count` - Posts count and creates adjustments
- ✅ `get_stock_counts_paginated` - Retrieves stock counts with pagination

## Step 4: Deploy Application Code

The application code has been updated with:
- New page: `/stock-count` (requires manager role or higher)
- Navigation menu item: "Stock Count" (clipboard icon)
- Database service: `stockCountService.ts`
- UI components for creating, entering, and reviewing counts

### To deploy:
1. The code changes are already in your GitHub repository
2. Netlify will automatically deploy when you merge to main branch
3. If you need to trigger deployment manually:
   - Go to: https://app.netlify.com/sites/ssth-inventory/deploys
   - Click "Trigger deploy" → "Deploy site"

## Step 5: Test the Feature

### Create an EOM Stock Count:
1. Login as an admin or manager user
2. Navigate to "Stock Count" in the sidebar
3. Click "New Stock Count"
4. Select:
   - Type: "End of Month Count"
   - Date: Today's date
   - Period: Current month (e.g., 2024-12)
5. Click "Create Stock Count"

### Enter Physical Counts:
1. Click "Edit" on the created count
2. The system shows all active items with system quantities
3. Enter the actual counted quantities in the "Counted Qty" column
4. Variances are calculated automatically (green = matched, red = variance)
5. Click "Export PDF" to download a count sheet for physical counting
6. Save changes (auto-saves as you type)

### Post the Count:
1. Once all items are counted, click "Review"
2. Set the write-off threshold (default: 5 units)
3. Items with variance ≤ threshold will be auto-written off
4. Items with variance > threshold require manual review
5. Click "Post Stock Count" to finalize

## Features Implemented

### ✅ Database Schema
- Stock count headers with status tracking
- Line items for individual counts
- Adjustment records for variances
- Row Level Security (RLS) policies

### ✅ UI Components
- Stock Count list page with filters
- Create Stock Count modal
- Entry interface with real-time variance calculation
- Review and posting workflow
- PDF export for count sheets

### ✅ Core Functionality
- Full physical count of all items
- Automatic variance calculation
- Configurable write-off threshold
- Adjustment transaction generation
- Complete audit trail

### ✅ Integration
- Role-based access control (manager role required)
- Existing navigation menu
- Transaction system integration
- User profile integration

## Configuration

### Write-off Threshold
Default threshold is 5 units. To change:
- In `StockCountReview.tsx`, modify the default value:
```typescript
const [writeOffThreshold, setWriteOffThreshold] = useState(5)
```

### Adding Support for Multiple Locations
The current implementation tracks one location. To extend:
1. Add `location_id` to `stock_counts` table
2. Add `location_id` to `stock_count_lines` table
3. Update the service to filter by location
4. Add location selector in UI

## Troubleshooting

### Common Issues:

1. **"Stock Count menu not visible"**
   - Check user role: Must be 'manager' or 'admin'
   - Ensure the role is set in `user_profiles` table

2. **"No items showing in count"**
   - Verify `items` table has `is_active = true` records
   - Check `inventory_status` table has quantities

3. **"Error creating stock count"**
   - Check Supabase logs for detailed error
   - Verify RLS policies allow user access

4. **"PDF export not working"**
   - Ensure jspdf library is installed
   - Check browser console for JavaScript errors

## Future Enhancements

1. **Location-based counting** - Track quantities by warehouse/storage area
2. **Cycle counting** - Count categories on rotating schedules
3. **Barcode scanning** - Mobile app integration
4. **Mobile app** - Native mobile application for counting
5. **Analytics dashboard** - Variance trends and insights

## Support

For issues or questions:
- Check the Supabase logs in the dashboard
- Review browser console for JavaScript errors
- Verify all SQL scripts were executed successfully