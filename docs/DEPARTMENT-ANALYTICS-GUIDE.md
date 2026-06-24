# Department Analytics - Enhanced Chart Filtering Guide

## Overview

The Department Withdrawal Analytics module now includes powerful chart filtering capabilities that allow you to analyze inventory usage patterns from multiple perspectives.

## New Features

### 1. **Chart Filter Modes**

#### **Total Usage Mode**
- Shows overall withdrawal patterns by department
- Aggregates all item quantities or values for each department
- Perfect for high-level departmental analysis
- Ideal for budget planning and resource allocation

#### **By Items Mode**
- Allows you to track specific inventory items across departments
- Select multiple items to compare their usage patterns
- Useful for identifying popular items and inventory needs
- Helps with procurement planning for specific products

### 2. **Display Metrics**

#### **Quantity Metric**
- Shows the number of items withdrawn
- Units: Individual pieces/items
- Best for: Usage volume analysis, demand planning

#### **Value Metric**
- Shows the monetary value of withdrawn items
- Units: Thai Baht (฿)
- Best for: Cost analysis, budget management, ROI calculations

### 3. **Time-Based Views**

#### **Monthly View**
- Displays data by calendar months
- Shows long-term trends and seasonal patterns
- Great for annual planning and budget forecasting

#### **Weekly View**
- Displays data by weeks
- Shows short-term usage patterns
- Useful for operational planning and staffing

#### **Yearly View**
- Displays annual summaries
- Shows year-over-year comparisons
- Ideal for strategic planning and trend analysis

## How to Use the Enhanced Features

### Step 1: Navigate to Department Analytics
1. Click on **Reports** in the sidebar
2. Select the **Department Analytics** tab

### Step 2: Configure Chart Filters
1. **Choose Filter Mode:**
   - Click **Total Usage** for department-level analysis
   - Click **By Items** for item-specific analysis

2. **Select Display Metric:**
   - Click **Quantity** to see item counts
   - Click **Value** to see monetary values

3. **Choose Items (if in "By Items" mode):**
   - Hold **Ctrl** (Windows) or **Cmd** (Mac) to select multiple items
   - Select up to 5 items for best chart visibility

### Step 3: Apply Additional Filters
1. **Set Date Range:**
   - Use custom date pickers or quick presets
   - Choose from Last 7 days, 30 days, 90 days, or 1 year

2. **Filter by Department (optional):**
   - Select a specific department or view all departments

3. **Select View Mode:**
   - Choose Monthly, Weekly, or Yearly view

### Step 4: Analyze the Results
1. **View Interactive Chart:**
   - Hover over data points for detailed information
   - Click on legend items to show/hide specific lines

2. **Check Chart Summary:**
   - Review the data points count
   - See current metric and filter settings

## Use Cases and Examples

### **Scenario 1: Budget Planning**
- **Filter Mode:** Total Usage
- **Metric:** Value
- **View:** Monthly
- **Purpose:** See which departments have the highest inventory costs for budget allocation

### **Scenario 2: Popular Items Analysis**
- **Filter Mode:** By Items
- **Metric:** Quantity
- **View:** Weekly
- **Purpose:** Identify most frequently used items for better stock management

### **Scenario 3: Cost Management**
- **Filter Mode:** By Items
- **Metric:** Value
- **View:** Monthly
- **Purpose:** Track high-value items to control costs and identify savings opportunities

### **Scenario 4: Department Performance**
- **Filter Mode:** Total Usage
- **Metric:** Quantity
- **View:** Monthly
- **Department:** [Specific Department]
- **Purpose:** Analyze usage patterns for a single department over time

## Chart Features

### **Interactive Elements**
- **Hover tooltips:** Show exact values for each data point
- **Legend:** Click to toggle specific department/item lines
- **Responsive design:** Adapts to different screen sizes
- **Color coding:** Consistent colors across all views

### **Data Formatting**
- **Value metric:** Displays as Thai Baht (฿) with proper formatting
- **Quantity metric:** Shows item counts with thousand separators
- **Time periods:** Formatted for optimal readability

### **Performance**
- **Smart loading:** Only fetches required data based on filters
- **Caching:** Optimized queries for fast response times
- **Error handling:** Graceful fallbacks if data is unavailable

## Tips for Best Results

1. **For Better Performance:**
   - Limit selections to 5 items or departments
   - Use reasonable date ranges (avoid very large date spans)
   - Clear selections when switching between modes

2. **For Clearer Charts:**
   - Choose contrasting items with different usage patterns
   - Use Monthly view for long-term trends
   - Use Weekly view for recent patterns

3. **For Meaningful Analysis:**
   - Compare similar time periods (e.g., same months in different years)
   - Consider seasonal factors when analyzing trends
   - Use Value metric for financial planning
   - Use Quantity metric for operational planning

## Troubleshooting

### **No Data Displayed**
- Check that you have selected at least one item (in "By Items" mode)
- Verify your date range includes transaction data
- Ensure you have ISSUE transactions in the selected period

### **Chart Appears Empty**
- Try expanding the date range
- Check if you have transactions in the system
- Verify that items are active and have withdrawal history

### **Performance Issues**
- Reduce the number of selected items
- Use shorter date ranges
- Close other browser tabs to free memory

## Technical Details

### **Data Sources**
- **Transactions Table:** ISSUE transactions only
- **Transaction Lines:** Individual item details
- **Items Table:** Item codes and descriptions
- **Departments Table:** Department information

### **Calculations**
- **Total Usage:** Sum of quantities or values per department
- **Item Usage:** Individual item tracking across departments
- **Time Aggregation:** Monthly, weekly, or yearly grouping

### **Dependencies**
- **Recharts:** For interactive chart rendering
- **Supabase:** For real-time data fetching
- **React:** For state management and UI updates

---

## Need Help?

For questions or issues with the Department Analytics module:
1. Check this guide first
2. Look for browser console errors
3. Ensure you have the proper permissions
4. Contact system administrator if problems persist

**Last Updated:** November 21, 2025
**Module Version:** Enhanced Analytics v1.0