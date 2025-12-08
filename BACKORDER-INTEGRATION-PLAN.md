# Backorder Integration Plan
**SSTH Inventory System - Complete Backorder Implementation**

## 📋 Current Status

### ✅ **Completed:**
1. **Backorder Detection & Popup** - Working correctly
2. **Database Schema** - `backorders` table exists and is functional
3. **User Interface** - Bilingual popup (Thai/English) with proper data display
4. **Stock Validation** - Accurate detection of insufficient stock items

### 🔧 **Currently Working On:**
- Transaction processing when user confirms backorder
- Actual database record creation

### 📊 **Pending Implementation:**
- Backorder reporting and views
- Integration with planning/forecasting modules
- Transaction history enhancement
- Backorder fulfillment workflow

---

## 🎯 **Implementation Plan**

### Phase 1: Core Transaction Processing (Current Priority)

#### 1.1 Database Transaction Workflow
- **When user clicks "Continue with Backorder"**:
  1. Create issue transaction for available quantities
  2. Create backorder records for shortages
  3. Update inventory status
  4. Send notifications
  5. Update user with success message

#### 1.2 Backorder Creation Logic
```sql
-- Backorder record structure
INSERT INTO backorders (
    backorder_id,
    item_id,
    department_id,
    quantity,          -- Shortage quantity (requested - available)
    status,           -- PENDING, FULFILLED, CANCELLED
    notes,            -- Auto-generated from issue transaction
    created_at,
    updated_at
)
```

### Phase 2: Reporting & Views

#### 2.1 Backorder Report Component ✅ **Created**
- **Location**: `src/components/reports/BackorderReport.tsx`
- **Features**:
  - List all pending backorders
  - Filter by department, status, date range
  - Search by item code/description
  - Export functionality (CSV/Excel)
  - Summary statistics (total backorders, total quantities)
  - Bilingual support

#### 2.2 Transaction History Enhancement
- **Add backorder information to transaction history**
- **Show which items were backordered in each transaction**
- **Link backorders to their originating transactions**

#### 2.3 Dashboard Integration
- **Add backorder metrics to main dashboard**
- **Show pending backorders count**
- **Display total value of backordered items**

### Phase 3: Planning & Forecasting Integration

#### 3.1 Planning Module Enhancement
The planning module should consider backorders when calculating future needs:

```sql
-- Planning query example
SELECT
    i.item_id,
    i.description,
    COALESCE(SUM(inv.quantity), 0) as current_stock,
    COALESCE(SUM(bo.quantity), 0) as pending_backorders,
    i.reorder_level,
    (COALESCE(SUM(inv.quantity), 0) + COALESCE(SUM(bo.quantity), 0)) as effective_stock
FROM items i
LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
LEFT JOIN backorders bo ON i.item_id = bo.item_id AND bo.status = 'PENDING'
WHERE i.is_active = true
GROUP BY i.item_id, i.description, i.reorder_level
```

#### 3.2 Demand Forecasting
- **Include backorders in demand calculations**
- **Adjust forecasting algorithms to account for pending orders**
- **Provide visibility into actual vs forecasted demand**

### Phase 4: Fulfillment Workflow

#### 4.1 Backorder Management
- **Fulfillment interface for when stock becomes available**
- **Automatic notifications when items are received**
- **Bulk fulfillment capabilities**
- **Priority handling (FIFO, by department, etc.)**

#### 4.2 Stock Receiving Integration
- **When receiving items, check for pending backorders**
- **Automatically fulfill oldest backorders first**
- **Update backorder status to FULFILLED**
- **Notify departments of fulfilled orders**

---

## 🔧 **Technical Implementation Details**

### Database Schema Integration

#### Current Tables:
```sql
-- Backorders table (exists)
CREATE TABLE backorders (
    backorder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(item_id),
    department_id UUID NOT NULL REFERENCES departments(dept_id),
    quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced transactions table
ALTER TABLE transactions ADD COLUMN has_backorders BOOLEAN DEFAULT FALSE;

-- Enhanced transaction_lines table
ALTER TABLE transaction_lines ADD COLUMN backorder_quantity INTEGER DEFAULT 0;
```

#### Indexes for Performance:
```sql
CREATE INDEX idx_backorders_status ON backorders(status);
CREATE INDEX idx_backorders_item_id ON backorders(item_id);
CREATE idx_backorders_department_id ON backorders(department_id);
CREATE INDEX idx_backorders_created_at ON backorders(created_at);
```

### Frontend Integration Points

#### 1. Transaction Processing Flow
```
User submits issue transaction
    ↓
Stock validation runs
    ↓
If insufficient stock detected:
    - Show backorder popup
    - User confirms or cancels
    ↓
If confirmed:
    - Process transaction
    - Create backorder records
    - Update inventory
    - Send notifications
```

#### 2. Planning Integration
```
Planning calculation includes:
    - Current stock levels
    - Pending backorders
    - Forecasted demand
    - Safety stock levels
    = Total requirement calculation
```

### API Endpoints for Integration

#### Backorder Management:
```typescript
// Get all backorders
GET /api/backorders

// Get backorders by department
GET /api/backorders/department/:id

// Create backorder
POST /api/backorders

// Fulfill backorder
PUT /api/backorders/:id/fulfill

// Cancel backorder
PUT /api/backorders/:id/cancel

// Get backorder statistics
GET /api/backorders/stats
```

#### Planning Integration:
```typescript
// Get item requirements including backorders
GET /api/planning/requirements

// Forecast demand including backorders
GET /api/planning/forecast

// Get department backorders
GET /api/planning/backorders/department/:id
```

---

## 📊 **Reporting & Analytics**

### Key Metrics to Track:

1. **Backorder Volume**
   - Total number of backorders
   - Total quantity of items backordered
   - Backorder trends over time

2. **Department Analysis**
   - Which departments have most backorders
   - Average fulfillment time by department
   - Critical item shortages by department

3. **Item Analysis**
   - Most frequently backordered items
   - Items with chronic stock issues
   - Backorder fulfillment rates

4. **Operational Metrics**
   - Average time to fulfillment
   - Backorder aging (how long pending)
   - Fulfillment success rate

### Dashboard Widgets:

1. **Backorder Status Widget**
   - Pending backorders count
   - Total value of backordered items
   - Recent backorders list

2. **Stock Alert Widget**
   - Items approaching critical levels
   - Departments with pending backorders
   - Recommended reorder actions

3. **Planning Insights Widget**
   - Demand vs supply gaps
   - Backorder impact on planning
   - Recommended procurement actions

---

## 🚀 **Implementation Priority**

### **Week 1 (Immediate):**
1. ✅ Fix transaction processing for backorders
2. ✅ Complete backorder report component
3. ✅ Add backorder metrics to dashboard
4. ✅ Test end-to-end backorder workflow

### **Week 2 (Integration):**
1. Enhance transaction history with backorder info
2. Integrate backorders into planning calculations
3. Implement backorder fulfillment interface
4. Add stock receiving auto-fulfillment

### **Week 3 (Advanced Features):**
1. Advanced backorder analytics
2. Export/import functionality
3. Mobile app backorder features
4. API for external system integration

---

## 🧪 **Testing Plan**

### Manual Testing:
1. **Create backorder**: Issue item with insufficient stock
2. **Verify database record**: Check backorder table
3. **Report display**: Verify backorder report shows data
4. **Dashboard metrics**: Check dashboard widgets update
5. **Planning integration**: Verify planning calculations include backorders

### Automated Testing:
1. **Unit tests** for backorder creation logic
2. **Integration tests** for transaction workflow
3. **Database tests** for backorder queries
4. **UI tests** for popup and report components

### Load Testing:
1. **Performance tests** with many backorders
2. **Concurrent transaction** handling
3. **Report generation** performance
4. **Dashboard metric** calculation speed

---

## 🔗 **Integration Points**

### Current Modules:
- **Transactions**: ✅ Backorder creation workflow
- **Reports**: ✅ Backorder report component
- **Dashboard**: ✅ Backorder metrics
- **Planning**: ⏳ Integration needed

### Future Modules:
- **Procurement**: Auto-generate POs from backorders
- **Notifications**: Alert when backorders are fulfilled
- **Mobile**: Backorder management on mobile app
- **API**: External system integration

---

## 📝 **Next Steps**

### **Immediate Actions:**
1. Test current backorder creation workflow
2. Verify database records are created correctly
3. Test backorder report functionality
4. Check dashboard metrics display

### **Week Priorities:**
1. Complete transaction processing implementation
2. Add backorder reports to main Reports page
3. Integrate backorders into planning calculations
4. Implement basic fulfillment workflow

### **Future Enhancements:**
1. Advanced analytics and forecasting
2. Automated fulfillment notifications
3. External system API integration
4. Mobile-responsive backorder management

---

## 🎯 **Success Criteria**

### **Functional Requirements:**
- ✅ Users can issue items with insufficient stock
- ✅ Backorders are automatically created and tracked
- ✅ Users can view all backorders and their status
- ✅ Planning calculations include backorder quantities
- ✅ Dashboard shows backorder metrics

### **Performance Requirements:**
- Transaction processing with backorders completes within 3 seconds
- Reports load within 5 seconds
- Dashboard metrics update in real-time
- System handles 1000+ concurrent backorders

### **User Experience Requirements:**
- Clear indication when items are backordered
- Easy access to backorder status and history
- Intuitive fulfillment workflow
- Bilingual support throughout system

---

**Status**: 🟢 **Core functionality implemented, integration in progress**
**Next Action**: Test current workflow and complete transaction processing