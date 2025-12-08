# ✨ Plan Creation Form - User Guide

## 🎯 How to Create a Monthly Plan

### Step 1: Open the Form
Click the **"Create Plan"** button on the Planning page (or "Create Your First Plan" if no plans exist yet)

### Step 2: Fill in Plan Details
The form has a beautiful gradient blue section at the top:

**Required Fields:**
- **Department** - Select which department this plan is for
- **Month** - Choose the month (defaults to current month)
- **Year** - Choose the year (defaults to current year)

### Step 3: Add Items to Your Plan
The green gradient section below lets you add items:

1. **Search for items** - Type in the search box to find items by code or description
2. **Click an item** to add it to your plan
3. **Set quantity** - Enter the planned quantity for each item
4. **Add notes** (optional) - Add any notes about the item

### Step 4: Review and Submit
- Review all items and quantities
- Click **"Create Plan"** to save as DRAFT status
- The plan will appear in your plans list

---

## 🎨 Form Design Features

### Modern UI/UX Elements:
✨ **Gradient Headers** - Blue gradient header with calendar icon  
✨ **Color-Coded Sections** - Blue for plan details, green for items  
✨ **Smooth Transitions** - Hover effects and smooth animations  
✨ **Responsive Design** - Works perfectly on desktop, tablet, and mobile  
✨ **Real-time Search** - Instant item filtering as you type  
✨ **Visual Feedback** - Loading states, success messages, error handling  
✨ **Clean Layout** - Organized with clear visual hierarchy  

### Form Sections:

#### 1. Header (Blue Gradient)
```
┌────────────────────────────────────────────┐
│ 📅 Create Monthly Plan                     │
│    Forecast your department's item usage   │
└────────────────────────────────────────────┘
```

#### 2. Plan Details (Blue Background)
```
┌────────────────────────────────────────────┐
│ • Plan Details                             │
│                                            │
│ Department *    Month *       Year *       │
│ [Select...]     [January]     [2025]       │
└────────────────────────────────────────────┘
```

#### 3. Add Items (Green Background)
```
┌────────────────────────────────────────────┐
│ • Add Items to Plan                        │
│                                            │
│ 🔍 Search items by code or description...  │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ ABC-001                                │ │
│ │ Office Chair - Black                   │ │
│ │                                        │ │
│ │ Planned Quantity *    Notes (Optional) │ │
│ │ [50]                  [For new office] │ │
│ │                                    🗑️  │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

#### 4. Footer Actions
```
┌────────────────────────────────────────────┐
│                    [Cancel] [Create Plan]  │
└────────────────────────────────────────────┘
```

---

## 💡 Tips for Best UX

### Search Tips:
- Type item code for exact matches
- Type description for broader search
- Results show top 10 matches
- Click any result to add it

### Item Management:
- Each item shows code and description
- Quantity must be greater than 0
- Notes are optional but helpful
- Click trash icon to remove items

### Validation:
- ✅ Department is required
- ✅ At least one item required
- ✅ All quantities must be > 0
- ✅ Clear error messages

---

## 🚀 What Happens After Creation?

1. **Plan is saved** with status "DRAFT"
2. **Success message** appears
3. **Form closes** automatically
4. **Plans list refreshes** showing your new plan
5. **Plan card appears** in the grid with:
   - Month and Year
   - Department ID
   - DRAFT status badge (gray)
   - Creation date

---

## 📊 Plan Status Flow

```
DRAFT ──────> SUBMITTED ──────> APPROVED
(Gray)        (Blue)            (Green)
```

- **DRAFT** - Just created, can be edited
- **SUBMITTED** - Sent for approval (coming soon)
- **APPROVED** - Approved by admin (coming soon)

---

## 🎯 Next Features Coming:

- ✨ Edit plans (DRAFT status only)
- ✨ Submit plans for approval
- ✨ Approve/reject plans (admin)
- ✨ View planned vs actual usage
- ✨ Copy plan to next month
- ✨ Export plans to Excel

---

**Enjoy the beautiful, intuitive planning experience!** 🎉
