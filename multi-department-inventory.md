# Multi-Department Inventory Plan

## Goal
Modify the database and application to track inventory quantities separately for each department (Admin, Material, Maintenance, Production), allowing overlapping items.

## Tasks
- [ ] Task 1: Create SQL migration to update `inventory_status` schema → Verify: Check if table has composite primary key `(item_id, dept_id)` and default rows are mapped to a Central/Material department.
- [ ] Task 2: Update `src/types/database.types.ts` with new `inventory_status` type definitions → Verify: Ensure TypeScript compilation does not fail on database types.
- [ ] Task 3: Update `src/utils/transactionHelpers.ts` to query and update inventory per department → Verify: Receive and Issue functions query `.eq('department_id', ...)` instead of just `item_id`.
- [ ] Task 4: Update `ReceiveTransactionForm.tsx` and `StockAdjustmentForm.tsx` to include department selection → Verify: Ensure UI has department dropdown selector for inventory destination.
- [ ] Task 5: Update `InventoryPage.tsx` to show stock separated by department with filter dropdown → Verify: Verify items with duplicate code across departments show correct distinct quantities.
- [ ] Task 6: Run build check to verify TypeScript and build compilation → Verify: Run `npm run build` with zero errors.

## Done When
- [ ] Inventory balance is tracked independently per department.
- [ ] Users can filter the inventory list by department in the UI.
- [ ] Transactions correctly adjust stock for the specific department involved.

## Notes
- We must handle existing inventory data by migrating all current global stocks to a default department (e.g. `Material` or `Central`).
- Transactions header table already contains `department_id` which makes tracking mapping straightforward.
