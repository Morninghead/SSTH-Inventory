import { Handler, HandlerEvent } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Robust env var resolution with hardcoded fallback for local dev
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://viabjxdggrdarcveaxam.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9BQaCt3C8dZ_jeWB3LxA8g_QrgJy360'
const supabase = createClient(supabaseUrl, supabaseKey)

export const handler: Handler = async (event: HandlerEvent) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' }
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    try {
        // Auth check
        const authHeader = event.headers.authorization
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
        }

        // Create an AUTHENTICATED Supabase client with user's token
        // This ensures RLS policies see the user as "authenticated"
        const dbClient = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        })

        // Parse Excel
        const body = event.isBase64Encoded
            ? Buffer.from(event.body!, 'base64')
            : Buffer.from(event.body!)

        const workbook = XLSX.read(body, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        console.log(`📊 Parsed ${rows.length} rows from sheet "${sheetName}"`)

        if (rows.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Excel file is empty' }) }
        }

        // ========== STEP 1: Collect unique categories ==========
        const categoryNames = new Set<string>()
        for (const row of rows) {
            const cat = row['Category']?.toString().trim()
            if (cat) categoryNames.add(cat)
        }

        // Fetch existing categories in one call
        const { data: existingCategories } = await dbClient
            .from('categories')
            .select('category_id, category_name')

        const categoryMap = new Map<string, string>() // name (lowercase) -> id
        for (const cat of existingCategories || []) {
            categoryMap.set(cat.category_name.toLowerCase(), cat.category_id)
        }

        // Create missing categories in bulk
        const missingCategories = []
        for (const name of categoryNames) {
            if (!categoryMap.has(name.toLowerCase())) {
                missingCategories.push({
                    category_name: name,
                    category_code: `CAT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
                    is_active: true
                })
            }
        }

        if (missingCategories.length > 0) {
            const { data: newCats, error: catError } = await dbClient
                .from('categories')
                .insert(missingCategories)
                .select('category_id, category_name')

            if (catError) {
                console.error('Category insert error:', catError)
            } else if (newCats) {
                for (const cat of newCats) {
                    categoryMap.set(cat.category_name.toLowerCase(), cat.category_id)
                }
            }
        }

        // ========== STEP 2: Fetch existing items (by item_code) ==========
        const itemCodes = rows
            .map(r => r['Item Code']?.toString().trim())
            .filter(Boolean)

        const { data: existingItems } = await dbClient
            .from('items')
            .select('item_id, item_code')
            .in('item_code', itemCodes)

        const existingItemMap = new Map<string, string>() // item_code -> item_id
        for (const item of existingItems || []) {
            existingItemMap.set(item.item_code, item.item_id)
        }

        // ========== STEP 3: Prepare bulk inserts/updates ==========
        const toInsert: any[] = []
        const toUpdate: { id: string; data: any }[] = []
        const quantityMap = new Map<string, number>() // item_code -> quantity
        const created: string[] = []
        const updated: string[] = []
        const skipped: { item_code: string; reason: string }[] = []

        for (const row of rows) {
            const itemCode = row['Item Code']?.toString().trim()
            if (!itemCode) continue

            const description = row['Description']?.toString().trim() || row['Item Name']?.toString().trim() || itemCode
            const descriptionTh = row['Description (TH)']?.toString().trim() || row['Description TH']?.toString().trim() || null
            const categoryName = row['Category']?.toString().trim() || ''
            const categoryId = categoryName ? (categoryMap.get(categoryName.toLowerCase()) || null) : null

            // Extract quantity if present
            const quantity = parseFloat(row['Quantity']?.toString().replace(/[^\d.]/g, '') || row['Qty']?.toString().replace(/[^\d.]/g, '') || '0')
            if (!isNaN(quantity)) {
                quantityMap.set(itemCode, quantity)
            }

            const itemData: any = {
                description,
                description_th: descriptionTh,
                category_id: categoryId,
                base_uom: row['UOM']?.toString().trim() || row['Base UOM']?.toString().trim() || 'PCS',
                ordering_uom: row['Ordering UOM']?.toString().trim() || null,
                outermost_uom: row['Outermost UOM']?.toString().trim() || null,
                unit_cost: parseFloat(row['Unit Cost']?.toString().replace(/[^\d.]/g, '') || '0') || null,
                reorder_level: parseFloat(row['Reorder Level']?.toString().replace(/[^\d.]/g, '') || '0') || null,
                is_active: true,
            }

            if (existingItemMap.has(itemCode)) {
                toUpdate.push({ id: existingItemMap.get(itemCode)!, data: itemData })
                updated.push(itemCode)
            } else {
                toInsert.push({
                    ...itemData,
                    item_code: itemCode,
                    created_by: user.id
                })
                created.push(itemCode)
            }
        }

        // ========== STEP 4: Bulk INSERT new items ==========
        if (toInsert.length > 0) {
            // Process in batches of 50 to avoid payload limits
            for (let i = 0; i < toInsert.length; i += 50) {
                const batch = toInsert.slice(i, i + 50)
                const { data: insertedItems, error: insertError } = await dbClient
                    .from('items')
                    .insert(batch)
                    .select('item_id, item_code')

                if (insertError) {
                    console.error(`Insert batch error (${i}-${i + batch.length}):`, insertError)
                    // Move these from created to skipped
                    const failedCodes = batch.map((b: any) => b.item_code)
                    for (const code of failedCodes) {
                        const idx = created.indexOf(code)
                        if (idx > -1) {
                            created.splice(idx, 1)
                            skipped.push({ item_code: code, reason: insertError.message })
                        }
                    }
                } else if (insertedItems) {
                    // Update map with new IDs for quantity update
                    for (const item of insertedItems) {
                        existingItemMap.set(item.item_code, item.item_id)
                    }
                }
            }
        }

        // ========== STEP 5: Bulk UPDATE existing items ==========
        // Supabase doesn't support bulk update natively, but we can do parallel promises
        if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map(({ id, data }) =>
                dbClient.from('items').update(data).eq('item_id', id)
            )
            const results = await Promise.all(updatePromises)
            results.forEach((res, idx) => {
                if (res.error) {
                    const code = updated[idx]
                    skipped.push({ item_code: code, reason: res.error.message })
                }
            })
        }

        // ========== STEP 6: Update Inventory Quantities ==========
        const quantityUpdates = []

        // Process both created and updated items that have quantity data
        const allProcessed = [...created, ...updated]
        for (const code of allProcessed) {
            const id = existingItemMap.get(code)
            const qty = quantityMap.get(code)

            // Only update if we have a valid ID and a valid quantity
            if (id && qty !== undefined && !isNaN(qty)) {
                quantityUpdates.push({
                    item_id: id,
                    quantity: qty,
                    updated_at: new Date().toISOString()
                })
            }
        }

        if (quantityUpdates.length > 0) {
            console.log(`Updating quantities for ${quantityUpdates.length} items...`)
            for (let i = 0; i < quantityUpdates.length; i += 100) {
                const batch = quantityUpdates.slice(i, i + 100)
                const { error: qtyError } = await dbClient
                    .from('inventory_status')
                    .upsert(batch)

                if (qtyError) {
                    console.error('Error updating quantities batch:', qtyError)
                }
            }
        }

        console.log(`✅ Import done: ${created.length} created, ${updated.length} updated, ${skipped.length} skipped`)

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Import completed',
                created: created.length,
                updated: updated.length,
                skipped: skipped.length,
                details: { created, updated, skipped }
            })
        }

    } catch (error: any) {
        console.error('Import error:', error)
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Import failed' }) }
    }
}
