import { createApi, signInTestUser, must, idsByCode, tableExists, categories, currentPeriod, departments, items, planMonth, planYear, previousPeriod, suppliers, testTag, vendorCategories, vendors } from './full-test-api.js'

const supabase = createApi()

async function main() {
  const userId = await signInTestUser(supabase)
  const hasVendors = await tableExists(supabase, 'vendors')
  const hasVendorCategories = await tableExists(supabase, 'vendor_categories')

  await cleanupGeneratedRows()
  await seedBasics(userId)

  const deptIds = await idsByCode(supabase, 'departments', 'dept_code', 'dept_id', departments.map(([code]) => code))
  const categoryIds = await idsByCode(supabase, 'categories', 'category_code', 'category_id', categories.map(([code]) => code))
  const supplierIds = await idsByCode(supabase, 'suppliers', 'supplier_code', 'supplier_id', suppliers.map(([code]) => code))
  if (!supplierIds['TEST-SUP-ACTIVE']) {
    const existing = await must<any[]>('load fallback supplier', supabase.from('suppliers').select('supplier_id').eq('is_active', true).limit(1))
    if (existing[0]?.supplier_id) supplierIds['TEST-SUP-ACTIVE'] = existing[0].supplier_id
  }

  if (hasVendorCategories) await seedVendorCategories(userId)
  const vendorCategoryIds = hasVendorCategories
    ? await idsByCode(supabase, 'vendor_categories', 'category_code', 'vendor_category_id', vendorCategories.map(([code]) => code))
    : {}
  if (hasVendors) await seedVendors(userId, vendorCategoryIds)

  await seedItems(userId, categoryIds)
  const itemIds = await idsByCode(supabase, 'items', 'item_code', 'item_id', items.map(([code]) => code))

  await seedInventory(deptIds, itemIds)
  await seedTransactions(userId, deptIds, supplierIds, itemIds)
  await seedStockCounts(userId, itemIds)
  await seedPlans(userId, deptIds, itemIds)
  await seedBackorders(deptIds, itemIds)

  console.log(`Seeded ${testTag} data via Supabase API.`)
}

async function cleanupGeneratedRows() {
  const txs = await must<any[]>('load test transactions', supabase.from('transactions').select('transaction_id').like('reference_number', `${testTag}-%`))
  const txIds = txs.map((row) => row.transaction_id)
  if (txIds.length) {
    await must('delete test transaction lines', supabase.from('transaction_lines').delete().in('transaction_id', txIds))
    await must('delete test transactions', supabase.from('transactions').delete().in('transaction_id', txIds))
  }

  const counts = await must<any[]>('load test stock counts', supabase.from('stock_counts').select('count_id').like('notes', `${testTag}:%`))
  const countIds = counts.map((row) => row.count_id)
  if (countIds.length) {
    await must('delete test stock adjustments', supabase.from('stock_count_adjustments').delete().in('count_id', countIds))
    await must('delete test stock lines', supabase.from('stock_count_lines').delete().in('count_id', countIds))
    await must('delete test stock counts', supabase.from('stock_counts').delete().in('count_id', countIds))
  }

  const plans = await must<any[]>('load test plans', supabase.from('department_plans').select('plan_id').eq('status', testTag))
  const planIds = plans.map((row) => row.plan_id)
  if (planIds.length) {
    await must('delete test plan items', supabase.from('department_plan_items').delete().in('plan_id', planIds))
    await must('delete test plans', supabase.from('department_plans').delete().in('plan_id', planIds))
  }

  await must('delete test backorders', supabase.from('backorders').delete().like('notes', `${testTag}:%`))
}

async function seedBasics(userId: string) {
  await must('upsert departments', supabase.from('departments').upsert(
    departments.map(([dept_code, dept_name]) => ({ dept_code, dept_name, is_active: true })),
    { onConflict: 'dept_code' },
  ))

  await must('upsert categories', supabase.from('categories').upsert(
    categories.map(([category_code, category_name]) => ({ category_code, category_name, description: `${testTag} category`, is_active: true })),
    { onConflict: 'category_code' },
  ))

  await must('upsert uom', supabase.from('uom').upsert([
    { uom_code: 'PCS', description: 'Pieces', is_base_uom: true, category: 'GENERAL', created_by: userId },
    { uom_code: 'KG', description: 'Kilograms', is_base_uom: true, category: 'WEIGHT', created_by: userId },
    { uom_code: 'BOX', description: 'Boxes', is_base_uom: false, category: 'PACKAGING', created_by: userId },
  ], { onConflict: 'uom_code' }))

  const locationResult = await supabase.from('locations').upsert({
    location_code: 'TEST-LOC-MAIN',
    location_name: 'Test Main Store',
    address: `${testTag} simulated location`,
    is_active: true,
  }, { onConflict: 'location_code' })
  if (locationResult.error) {
    console.warn(`Skipped optional location seed: ${locationResult.error.message}`)
  }

  const supplierResult = await supabase.from('suppliers').upsert(
    suppliers.map(([supplier_code, supplier_name, is_active]) => ({
      supplier_code,
      supplier_name,
      contact_name: 'Test Buyer',
      phone: '020000000',
      email: `${supplier_code.toLowerCase()}@example.test`,
      address: `${testTag} supplier address`,
      is_active,
    })),
    { onConflict: 'supplier_code' },
  )
  if (supplierResult.error) {
    console.warn(`Skipped supplier seed: ${supplierResult.error.message}`)
  }
}

async function seedVendorCategories(userId: string) {
  await must('upsert vendor categories', supabase.from('vendor_categories').upsert(
    vendorCategories.map(([category_code, category_name]) => ({
      category_code,
      category_name,
      description: `${testTag} vendor category`,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })),
    { onConflict: 'category_code' },
  ))
}

async function seedVendors(userId: string, vendorCategoryIds: Record<string, string>) {
  await must('upsert vendors', supabase.from('vendors').upsert(
    vendors.map(([vendor_code, vendor_name, categoryCode, is_active]) => ({
      vendor_code,
      vendor_name,
      vendor_category_id: vendorCategoryIds[categoryCode] || null,
      contact_person: 'Test Contact',
      contact_phone: '020000001',
      contact_email: `${vendor_code.toLowerCase()}@example.test`,
      address_line1: `${testTag} vendor address`,
      city: 'Bangkok',
      province: 'Bangkok',
      postal_code: '10110',
      country: 'Thailand',
      payment_terms: 'Net 30',
      default_vat_rate: 7,
      is_vat_registered: true,
      website: 'https://example.test',
      notes: `${testTag}: ${is_active ? 'active' : 'inactive'} vendor`,
      is_active,
      rating: is_active ? 4 : 1,
      created_by: userId,
      updated_by: userId,
    })),
    { onConflict: 'vendor_code' },
  ))
}

async function seedItems(userId: string, categoryIds: Record<string, string>) {
  await must('upsert items', supabase.from('items').upsert(
    items.map(([item_code, description, categoryCode, base_uom, unit_cost, reorder_level, is_active]) => ({
      item_code,
      description,
      description_th: `${description} TH`,
      category_id: categoryIds[categoryCode] || categoryIds['TEST-CAT-MAINT'],
      base_uom,
      ordering_uom: base_uom,
      unit_cost,
      reorder_level,
      is_active,
      created_by: userId,
      name_en: description,
      name_th: `${description} TH`,
      description_en: description,
      is_vat_applicable: true,
      vat_rate: 7,
    })),
    { onConflict: 'item_code' },
  ))
}

async function seedInventory(deptIds: Record<string, string>, itemIds: Record<string, string>) {
  const activeItems = items.filter(([, , , , , , active]) => active)
  const rows = departments.flatMap(([deptCode]) =>
    activeItems.map(([itemCode], index) => ({
      item_id: itemIds[itemCode],
      dept_id: deptIds[deptCode],
      quantity: itemCode === 'TEST-ITEM-OUT' ? 0 : itemCode === 'TEST-ITEM-LOW' ? 5 : 60 + index * 3,
      updated_at: new Date().toISOString(),
    })),
  )
  await must('upsert inventory', supabase.from('inventory_status').upsert(rows, { onConflict: 'item_id,dept_id' }))
}

async function seedTransactions(userId: string, deptIds: Record<string, string>, supplierIds: Record<string, string>, itemIds: Record<string, string>) {
  const txs = [
    ['RECEIVE', 'TEST-FULL-REC-001', 'TEST-DEP-HK', 'TEST-SUP-ACTIVE', [['TEST-ITEM-TOWEL', 40], ['TEST-ITEM-SHEET', 25]]],
    ['RECEIVE', 'TEST-FULL-REC-002', 'TEST-DEP-FB', 'TEST-SUP-ACTIVE', [['TEST-ITEM-RICE', 80], ['TEST-ITEM-COFFEE', 18]]],
    ['ISSUE', 'TEST-FULL-ISU-001', 'TEST-DEP-HK', null, [['TEST-ITEM-TOWEL', 8], ['TEST-ITEM-SOAP', 12]]],
    ['ISSUE', 'TEST-FULL-ISU-002', 'TEST-DEP-ENG', null, [['TEST-ITEM-BULB', 6], ['TEST-ITEM-FILTER', 4]]],
  ] as const

  for (const [transaction_type, reference_number, deptCode, supplierCode, lines] of txs) {
    const [tx] = await must<any[]>('insert transaction', supabase.from('transactions').insert({
      transaction_type,
      transaction_date: new Date().toISOString(),
      department_id: deptIds[deptCode],
      supplier_id: supplierCode ? supplierIds[supplierCode] : null,
      reference_number,
      notes: `${testTag}: ${transaction_type}`,
      status: 'COMPLETED',
      created_by: userId,
    }).select('transaction_id'))

    const lineRows = lines.map(([itemCode, quantity]) => ({
      transaction_id: tx.transaction_id,
      item_id: itemIds[itemCode],
      quantity,
      unit_cost: items.find(([code]) => code === itemCode)?.[4] || 0,
      notes: `${testTag}: transaction line`,
    }))
    await must('insert transaction lines', supabase.from('transaction_lines').insert(lineRows))

    for (const [itemCode, quantity] of lines) {
      const inv = await must<any[]>('load inventory row', supabase.from('inventory_status').select('quantity').eq('item_id', itemIds[itemCode]).eq('dept_id', deptIds[deptCode]).limit(1))
      const next = Math.max(0, Number(inv[0]?.quantity || 0) + (transaction_type === 'ISSUE' ? -quantity : quantity))
      await must('update inventory row', supabase.from('inventory_status').update({ quantity: next, updated_at: new Date().toISOString() }).eq('item_id', itemIds[itemCode]).eq('dept_id', deptIds[deptCode]))
    }
  }
}

async function seedStockCounts(userId: string, itemIds: Record<string, string>) {
  const previous = await insertStockCount(userId, previousPeriod, 'POSTED', `${testTag}: previous posted EOM`)
  const current = await insertStockCount(userId, currentPeriod, 'IN_PROGRESS', `${testTag}: current carry-forward EOM`)

  for (const [count, offset] of [[previous, 0], [current, 1]] as const) {
    for (const [index, itemCode] of ['TEST-ITEM-TOWEL', 'TEST-ITEM-SOAP', 'TEST-ITEM-LOW', 'TEST-ITEM-OUT'].entries()) {
      const system = itemCode === 'TEST-ITEM-OUT' ? 0 : itemCode === 'TEST-ITEM-LOW' ? 5 : 26 + index
      const counted = count === previous && itemCode === 'TEST-ITEM-SOAP' ? system - 2 : system + offset
      const line = await must<any[]>('load stock count line', supabase
        .from('stock_count_lines')
        .select('line_id')
        .eq('count_id', count.count_id)
        .eq('item_id', itemIds[itemCode])
        .limit(1))
      if (line[0]?.line_id) {
        await must('update stock count line', supabase.from('stock_count_lines').update({
          system_quantity: system,
          counted_quantity: counted,
          notes: `${testTag}: ${itemCode}`,
          status: counted === system ? 'MATCHED' : count === previous ? 'ADJUSTED' : 'DIFFERENCE',
        }).eq('line_id', line[0].line_id))
      }
    }
  }

  await must('insert stock count adjustment', supabase.from('stock_count_adjustments').insert({
    count_id: previous.count_id,
    item_id: itemIds['TEST-ITEM-SOAP'],
    adjustment_type: 'WRITE_OFF',
    system_quantity: 27,
    adjustment_quantity: -2,
    new_quantity: 25,
    reason: `${testTag}: simulated previous cycle adjustment`,
    reference_no: `${testTag}-ADJ-001`,
    created_by: userId,
  }))
}

async function insertStockCount(userId: string, period: string, status: string, notes: string) {
  const [row] = await must<any[]>('insert stock count', supabase.from('stock_counts').insert({
    count_type: 'EOM',
    count_date: `${period}-01`,
    period_month: period,
    status,
    notes,
    created_by: userId,
    completed_by: status === 'POSTED' ? userId : null,
    posted_by: status === 'POSTED' ? userId : null,
    posted_at: status === 'POSTED' ? new Date().toISOString() : null,
  }).select('count_id'))

  return row
}

async function seedPlans(userId: string, deptIds: Record<string, string>, itemIds: Record<string, string>) {
  const planItems = ['TEST-ITEM-TOWEL', 'TEST-ITEM-SOAP', 'TEST-ITEM-BULB', 'TEST-ITEM-LOW']
  for (const [deptIndex, [deptCode]] of departments.entries()) {
    const [plan] = await must<any[]>('upsert plan', supabase.from('department_plans').upsert({
      department_id: deptIds[deptCode],
      month: planMonth,
      year: planYear,
      status: testTag,
      created_by: userId,
    }, { onConflict: 'department_id,month,year' }).select('plan_id'))

    await must('clear plan items', supabase.from('department_plan_items').delete().eq('plan_id', plan.plan_id))
    await must('insert plan items', supabase.from('department_plan_items').insert(planItems.map((itemCode, itemIndex) => ({
      plan_id: plan.plan_id,
      item_id: itemIds[itemCode],
      planned_quantity: (deptIndex + 1) * (itemIndex + 2) * 5,
      notes: `${testTag}: simulated monthly requirement`,
    }))))
  }
}

async function seedBackorders(deptIds: Record<string, string>, itemIds: Record<string, string>) {
  await must('insert backorder', supabase.from('backorders').insert({
    department_id: deptIds['TEST-DEP-HK'],
    item_id: itemIds['TEST-ITEM-OUT'],
    quantity: 12,
    status: 'PENDING',
    notes: `${testTag}: planning shortage signal`,
  }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
