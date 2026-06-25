import { createApi, signInTestUser, countRows, categories, currentPeriod, departments, items, previousPeriod, suppliers, tableExists, testTag, vendors } from './full-test-api.js'

const supabase = createApi()

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

async function main() {
  await signInTestUser(supabase)
  const activeItemCodes = items.filter(([, , , , , , active]) => active).map(([code]) => code)

  assert(await countRows(supabase, 'active items', supabase.from('items').select('*', { count: 'exact', head: true }).in('item_code', activeItemCodes).eq('is_active', true)) === activeItemCodes.length, 'Active TEST items missing')
  assert(await countRows(supabase, 'inactive item', supabase.from('items').select('*', { count: 'exact', head: true }).eq('item_code', 'TEST-ITEM-DELETED').eq('is_active', false)) === 1, 'Inactive TEST item missing')
  assert(await countRows(supabase, 'categories', supabase.from('categories').select('*', { count: 'exact', head: true }).in('category_code', categories.map(([code]) => code)).eq('is_active', true)) === categories.length, 'TEST categories missing')
  assert(await countRows(supabase, 'departments', supabase.from('departments').select('*', { count: 'exact', head: true }).in('dept_code', departments.map(([code]) => code)).eq('is_active', true)) === departments.length, 'TEST departments missing')

  const testSupplierCount = await countRows(supabase, 'test suppliers', supabase.from('suppliers').select('*', { count: 'exact', head: true }).in('supplier_code', suppliers.map(([code]) => code)))
  if (testSupplierCount === suppliers.length) {
    assert(await countRows(supabase, 'active supplier', supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('supplier_code', 'TEST-SUP-ACTIVE').eq('is_active', true)) === 1, 'Active TEST supplier missing')
    assert(await countRows(supabase, 'inactive supplier', supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('supplier_code', 'TEST-SUP-INACTIVE').eq('is_active', false)) === 1, 'Inactive TEST supplier missing')
  } else {
    console.warn('Skipped TEST supplier checks: suppliers table is RLS-protected for API seed writes.')
  }

  if (await tableExists(supabase, 'vendors')) {
    assert(await countRows(supabase, 'active vendor', supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('vendor_code', 'TEST-VEN-ACTIVE').eq('is_active', true)) === 1, 'Active TEST vendor missing')
    assert(await countRows(supabase, 'inactive vendor', supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('vendor_code', 'TEST-VEN-INACTIVE').eq('is_active', false)) === 1, 'Inactive TEST vendor missing')
    assert(await countRows(supabase, 'vendors', supabase.from('vendors').select('*', { count: 'exact', head: true }).in('vendor_code', vendors.map(([code]) => code))) === vendors.length, 'TEST vendors incomplete')
  }

  const itemRows = await supabase.from('items').select('item_id,item_code').in('item_code', activeItemCodes)
  const deptRows = await supabase.from('departments').select('dept_id,dept_code').in('dept_code', departments.map(([code]) => code))
  if (itemRows.error) throw itemRows.error
  if (deptRows.error) throw deptRows.error
  const itemIds = itemRows.data.map((row) => row.item_id)
  const deptIds = deptRows.data.map((row) => row.dept_id)

  assert(await countRows(supabase, 'inventory matrix', supabase.from('inventory_status').select('*', { count: 'exact', head: true }).in('item_id', itemIds).in('dept_id', deptIds)) === activeItemCodes.length * departments.length, 'Department inventory matrix incomplete')
  assert(await countRows(supabase, 'low stock', supabase.from('inventory_status').select('*,items!inner(item_code)', { count: 'exact', head: true }).eq('items.item_code', 'TEST-ITEM-LOW').lte('quantity', 25)) >= 1, 'Low-stock TEST item missing')
  assert(await countRows(supabase, 'out stock', supabase.from('inventory_status').select('*,items!inner(item_code)', { count: 'exact', head: true }).eq('items.item_code', 'TEST-ITEM-OUT').eq('quantity', 0)) >= 1, 'Out-of-stock TEST item missing')

  assert(await countRows(supabase, 'receive tx', supabase.from('transactions').select('*', { count: 'exact', head: true }).like('reference_number', `${testTag}-REC-%`).eq('transaction_type', 'RECEIVE')) >= 2, 'Receive TEST transactions missing')
  assert(await countRows(supabase, 'issue tx', supabase.from('transactions').select('*', { count: 'exact', head: true }).like('reference_number', `${testTag}-ISU-%`).eq('transaction_type', 'ISSUE')) >= 2, 'Issue TEST transactions missing')

  assert(await countRows(supabase, 'previous stock count', supabase.from('stock_counts').select('*', { count: 'exact', head: true }).eq('period_month', previousPeriod).eq('status', 'POSTED').like('notes', `${testTag}:%`)) === 1, 'Previous posted stock count missing')
  assert(await countRows(supabase, 'current stock count', supabase.from('stock_counts').select('*', { count: 'exact', head: true }).eq('period_month', currentPeriod).eq('status', 'IN_PROGRESS').like('notes', `${testTag}:%`)) === 1, 'Current carry-forward stock count missing')

  const plans = await supabase.from('department_plans').select('plan_id,department_id').eq('status', testTag).in('department_id', deptIds)
  if (plans.error) throw plans.error
  assert(new Set(plans.data.map((row) => row.department_id)).size === departments.length, 'Department plans incomplete')
  assert(await countRows(supabase, 'plan items', supabase.from('department_plan_items').select('*', { count: 'exact', head: true }).in('plan_id', plans.data.map((row) => row.plan_id))) >= departments.length, 'Department plan items missing')
  assert(await countRows(supabase, 'backorders', supabase.from('backorders').select('*', { count: 'exact', head: true }).like('notes', `${testTag}:%`).eq('status', 'PENDING')) >= 1, 'Planning backorder signal missing')

  console.log(`${testTag} smoke check passed.`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
