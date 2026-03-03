# Cost Accounting: FIFO Implementation Plan

## Problem
The current system uses a **Single Inventory Record** per item (Standard/Last Cost), which means it cannot track differing costs for different lots (e.g., Lot A @ $10, Lot B @ $12).

## Solution: Lot Tracking (FIFO)
We need to refactor the database and transaction logic to support **First-In-First-Out (FIFO)** cost accounting.

### 1. Database Schema Changes
- [ ] **Modify `inventory_status` table**:
    - Add `lot_number` (string, nullable)
    - Add `received_date` (timestamp)
    - Add `unit_cost` (decimal) - specific to this lot
    - Change Primary Key from partial `(item_id)` to `(item_id, lot_number, received_date)` or add a unique ID `inventory_id`.

### 2. Transaction Logic Changes
- [ ] **Receive (Inbound)**:
    - Instead of updating a single row, **INSERT a new row** into `inventory_status` for each new receipt/lot with its specific cost.
- [ ] **Issue (Outbound)**:
    - Query `inventory_status` ordered by `received_date ASC` (oldest first).
    - Loop through available lots and deduct quantity until the request is filled.
    - Record which lots were used in `transaction_lines` (this might require a new child table `transaction_line_details` if one line consumes multiple lots).

### 3. Impact Assessment
- **Complexity**: High. Requires rewriting core transaction logic.
- **Benefits**: Accurate COGS (Cost of Goods Sold), traceable lots (good for expiry tracking too).

---

## Action Plan
1.  **Analyze current schema** (`database.types.ts`).
2.  **Create Migration Script**: SQL to alter tables.
3.  **Update `transactionHelpers.ts`**: Implement the FIFO looping logic.
