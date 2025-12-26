import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Use non-VITE prefixed env vars for Netlify functions (fallback to VITE_ for local dev)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ItemRow {
    item_code: string
    description: string
    category: string
    base_uom: string
    unit_cost?: number
    reorder_level?: number
}

interface ImportResult {
    created: number
    updated: number
    skipped: number
    details: {
        created: string[]
        updated: string[]
        skipped: { item_code: string; reason: string }[]
    }
}

// Get or create category
async function getOrCreateCategory(categoryName: string): Promise<string | null> {
    if (!categoryName) return null

    const { data: existing } = await supabase
        .from('categories')
        .select('category_id')
        .ilike('category_name', categoryName.trim())
        .single()

    if (existing) {
        return existing.category_id
    }

    const categoryCode = `CAT-${Date.now().toString().slice(-6)}`
    const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
            category_name: categoryName.trim(),
            category_code: categoryCode,
            is_active: true
        })
        .select('category_id')
        .single()

    if (error) {
        console.error('Failed to create category:', categoryName, error)
        return null
    }

    return newCategory.category_id
}

// Process item row
async function processItem(
    row: ItemRow,
    userId: string
): Promise<{ status: 'created' | 'updated' | 'skipped'; error?: string }> {
    try {
        const categoryId = await getOrCreateCategory(row.category)

        const { data: existing } = await supabase
            .from('items')
            .select('item_id')
            .eq('item_code', row.item_code)
            .single()

        const itemData: any = {
            description: row.description.trim(),
            category_id: categoryId,
            base_uom: row.base_uom || 'PCS',
            unit_cost: row.unit_cost || null,
            reorder_level: row.reorder_level || null,
            is_active: true,
        }

        if (existing) {
            const { error } = await supabase
                .from('items')
                .update(itemData)
                .eq('item_id', existing.item_id)

            if (error) throw error
            return { status: 'updated' }
        } else {
            const { error } = await supabase
                .from('items')
                .insert({
                    ...itemData,
                    item_code: row.item_code.trim(),
                    created_by: userId
                })

            if (error) throw error
            return { status: 'created' }
        }
    } catch (err: any) {
        return { status: 'skipped', error: err.message }
    }
}

exports.handler = async (event: any) => {
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
        const authHeader = event.headers.authorization
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
        }

        const body = event.isBase64Encoded
            ? Buffer.from(event.body!, 'base64')
            : Buffer.from(event.body!)

        // Parse Excel
        const workbook = XLSX.read(body, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet) as any[]

        if (data.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Excel file is empty' }) }
        }

        const result: ImportResult = {
            created: 0,
            updated: 0,
            skipped: 0,
            details: { created: [], updated: [], skipped: [] }
        }

        for (const row of data) {
            const itemCode = row['Item Code']?.toString().trim()
            if (!itemCode) continue

            const itemRow: ItemRow = {
                item_code: itemCode,
                description: row['Description']?.toString().trim() || row['Item Name']?.toString().trim() || itemCode,
                category: row['Category']?.toString().trim() || '',
                base_uom: row['UOM']?.toString().trim() || row['Base UOM']?.toString().trim() || 'PCS',
                unit_cost: parseFloat(row['Unit Cost']?.toString().replace(/[^\d.]/g, '') || '0') || undefined,
                reorder_level: parseFloat(row['Reorder Level']?.toString().replace(/[^\d.]/g, '') || '0') || undefined
            }

            const processResult = await processItem(itemRow, user.id)

            if (processResult.status === 'created') {
                result.created++
                result.details.created.push(itemCode)
            } else if (processResult.status === 'updated') {
                result.updated++
                result.details.updated.push(itemCode)
            } else {
                result.skipped++
                result.details.skipped.push({ item_code: itemCode, reason: processResult.error || 'Unknown error' })
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Import completed', ...result })
        }

    } catch (error: any) {
        console.error('Import error:', error)
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Import failed' }) }
    }
}
