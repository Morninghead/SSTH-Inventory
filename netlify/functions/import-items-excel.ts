import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import * as JSZip from 'jszip'

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
    image_filename?: string
}

interface ImportResult {
    created: number
    updated: number
    skipped: number
    imageUploaded: number
    details: {
        created: string[]
        updated: string[]
        skipped: { item_code: string; reason: string }[]
        imageErrors: { item_code: string; error: string }[]
    }
}

// Get or create category
async function getOrCreateCategory(categoryName: string): Promise<string | null> {
    if (!categoryName) return null

    // Search for existing category
    const { data: existing } = await supabase
        .from('categories')
        .select('category_id')
        .ilike('category_name', categoryName.trim())
        .single()

    if (existing) {
        return existing.category_id
    }

    // Create new category
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

// Upload image to Supabase Storage
async function uploadImage(
    itemCode: string,
    imageBuffer: Buffer,
    filename: string
): Promise<{ url: string; path: string } | null> {
    try {
        const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg'
        const filePath = `items/${itemCode}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('inventory-items')
            .upload(filePath, imageBuffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage
            .from('inventory-items')
            .getPublicUrl(filePath)

        return {
            url: data.publicUrl,
            path: filePath
        }
    } catch (err: any) {
        console.error('Image upload error:', err)
        return null
    }
}

// Process item row
async function processItem(
    row: ItemRow,
    userId: string,
    images: Map<string, Buffer>
): Promise<{ status: 'created' | 'updated' | 'skipped'; imageUploaded: boolean; error?: string; imageError?: string }> {
    try {
        // Get or create category
        const categoryId = await getOrCreateCategory(row.category)

        // Check if item exists
        const { data: existing } = await supabase
            .from('items')
            .select('item_id, image_url, image_path')
            .eq('item_code', row.item_code)
            .single()

        // Upload image if provided
        let imageData: { url: string; path: string } | null = null
        let imageError: string | undefined

        if (row.image_filename && images.has(row.image_filename.toLowerCase())) {
            const imageBuffer = images.get(row.image_filename.toLowerCase())!
            const uploaded = await uploadImage(row.item_code, imageBuffer, row.image_filename)
            if (uploaded) {
                imageData = uploaded
            } else {
                imageError = `Failed to upload image: ${row.image_filename}`
            }
        }

        const itemData: any = {
            description: row.description.trim(),
            category_id: categoryId,
            base_uom: row.base_uom || 'PCS',
            unit_cost: row.unit_cost || null,
            reorder_level: row.reorder_level || null,
            is_active: true,
        }

        if (imageData) {
            itemData.image_url = imageData.url
            itemData.image_path = imageData.path
        }

        if (existing) {
            // Update existing item
            const { error } = await supabase
                .from('items')
                .update(itemData)
                .eq('item_id', existing.item_id)

            if (error) throw error

            return {
                status: 'updated',
                imageUploaded: !!imageData,
                imageError
            }
        } else {
            // Create new item
            const { error } = await supabase
                .from('items')
                .insert({
                    ...itemData,
                    item_code: row.item_code.trim(),
                    created_by: userId
                })

            if (error) throw error

            return {
                status: 'created',
                imageUploaded: !!imageData,
                imageError
            }
        }
    } catch (err: any) {
        return {
            status: 'skipped',
            imageUploaded: false,
            error: err.message
        }
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
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        }
    }

    try {
        // Auth check
        const authHeader = event.headers.authorization
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' })
            }
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' })
            }
        }

        const contentType = event.headers['content-type'] || ''
        if (!contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'File upload required' })
            }
        }

        const body = event.isBase64Encoded
            ? Buffer.from(event.body!, 'base64')
            : Buffer.from(event.body!)

        let excelBuffer: Buffer
        const images = new Map<string, Buffer>()

        // Check if it's a ZIP file
        const isZip = body[0] === 0x50 && body[1] === 0x4B // PK signature

        if (isZip) {
            // Process ZIP file
            const zip = await JSZip.loadAsync(body)

            // Find Excel file
            let excelFile: JSZip.JSZipObject | null = null
            for (const [filename, file] of Object.entries(zip.files)) {
                if (!file.dir) {
                    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                        excelFile = file
                    } else if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        // Extract image
                        const imageBuffer = await file.async('nodebuffer')
                        const imageName = filename.split('/').pop()?.toLowerCase() || filename.toLowerCase()
                        images.set(imageName, imageBuffer)
                    }
                }
            }

            if (!excelFile) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'No Excel file found in ZIP' })
                }
            }

            excelBuffer = await excelFile.async('nodebuffer')
        } else {
            // Direct Excel upload
            excelBuffer = body
        }

        // Parse Excel
        const workbook = XLSX.read(excelBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet) as any[]

        if (data.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Excel file is empty' })
            }
        }

        // Process items
        const result: ImportResult = {
            created: 0,
            updated: 0,
            skipped: 0,
            imageUploaded: 0,
            details: {
                created: [],
                updated: [],
                skipped: [],
                imageErrors: []
            }
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
                reorder_level: parseFloat(row['Reorder Level']?.toString().replace(/[^\d.]/g, '') || '0') || undefined,
                image_filename: row['Image']?.toString().trim() || row['Image Filename']?.toString().trim()
            }

            const processResult = await processItem(itemRow, user.id, images)

            if (processResult.status === 'created') {
                result.created++
                result.details.created.push(itemCode)
            } else if (processResult.status === 'updated') {
                result.updated++
                result.details.updated.push(itemCode)
            } else {
                result.skipped++
                result.details.skipped.push({
                    item_code: itemCode,
                    reason: processResult.error || 'Unknown error'
                })
            }

            if (processResult.imageUploaded) {
                result.imageUploaded++
            }

            if (processResult.imageError) {
                result.details.imageErrors.push({
                    item_code: itemCode,
                    error: processResult.imageError
                })
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Import completed',
                ...result
            })
        }

    } catch (error: any) {
        console.error('Import error:', error)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Import failed' })
        }
    }
}
