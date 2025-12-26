import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Use non-VITE prefixed env vars for Netlify functions (fallback to VITE_ for local dev)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface POLine {
    item_name: string
    quantity: number
    uom: string
    unit_cost: number
    gross: number
}

interface POData {
    po_number: string
    po_date: string
    vendor_name: string
    invoice_no: string
    invoice_date: string
    lines: POLine[]
}

// Parse date from Excel format (e.g., "2-Jan-25")
function parseExcelDate(dateStr: string): string {
    try {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
        }
        // Try parsing "2-Jan-25" format
        const parts = dateStr.trim().match(/(\d+)-(\w+)-(\d+)/)
        if (parts) {
            const [, day, monthStr, year] = parts
            const monthMap: Record<string, string> = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            }
            const month = monthMap[monthStr] || '01'
            const fullYear = year.length === 2 ? `20${year}` : year
            return `${fullYear}-${month}-${day.padStart(2, '0')}`
        }
    } catch (e) {
        console.error('Date parsing error:', e)
    }
    return new Date().toISOString().split('T')[0]
}

// Get or create vendor (using suppliers table for PO)
async function getOrCreateVendor(vendorName: string): Promise<string> {
    // Search for existing supplier
    const { data: existing } = await supabase
        .from('suppliers')
        .select('supplier_id')
        .ilike('supplier_name', vendorName)
        .single()

    if (existing) {
        return existing.supplier_id
    }

    // Create new supplier
    const supplierCode = `SUP-${Date.now().toString().slice(-6)}`
    const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert({
            supplier_name: vendorName,
            supplier_code: supplierCode,
            is_active: true
        })
        .select('supplier_id')
        .single()

    if (error) {
        throw new Error(`Failed to create supplier: ${vendorName} - ${error.message}`)
    }

    return newSupplier.supplier_id
}

// Get item by description
async function getItemByDescription(itemName: string): Promise<string | null> {
    const { data } = await supabase
        .from('items')
        .select('item_id')
        .eq('description', itemName.trim())
        .single()

    return data?.item_id || null
}

// Process PO data and create records
async function processPO(po: POData, userId: string) {
    // Get or create vendor
    const supplierId = await getOrCreateVendor(po.vendor_name)

    // Get item IDs for all lines
    const lineItems = await Promise.all(
        po.lines.map(async (line) => {
            const itemId = await getItemByDescription(line.item_name)
            if (!itemId) {
                throw new Error(`Item not found: ${line.item_name}`)
            }
            return {
                item_id: itemId,
                quantity: line.quantity,
                unit_cost: line.unit_cost,
                line_total: line.gross
            }
        })
    )

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
    const vatAmount = subtotal * 0.07
    const totalAmount = subtotal + vatAmount

    // Create PO header
    const { data: poHeader, error: poError } = await supabase
        .from('purchase_order')
        .insert({
            po_number: po.po_number,
            supplier_id: supplierId,
            po_date: po.po_date,
            expected_date: po.invoice_date,
            reference_number: po.invoice_no,
            subtotal_amount: subtotal,
            vat_amount: vatAmount,
            vat_rate: 7.0,
            total_amount: totalAmount,
            status: 'COMPLETED',
            created_by: userId,
            notes: 'Imported from Excel'
        })
        .select('po_id')
        .single()

    if (poError) {
        throw new Error(`Failed to create PO ${po.po_number}: ${poError.message}`)
    }

    // Create PO lines
    const lines = lineItems.map(item => ({
        ...item,
        po_id: poHeader.po_id
    }))

    const { error: linesError } = await supabase
        .from('purchase_order_line')
        .insert(lines)

    if (linesError) {
        throw new Error(`Failed to create PO lines: ${linesError.message}`)
    }

    return poHeader.po_id
}

exports.handler = async (event: any) => {
    // CORS headers
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
        // Get user from auth header
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

        // Parse the multipart form data to get the file
        const contentType = event.headers['content-type'] || ''

        if (!contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'File upload required' })
            }
        }

        // Get file from base64 body - need to parse multipart form data
        const rawBody = event.isBase64Encoded
            ? Buffer.from(event.body!, 'base64')
            : Buffer.from(event.body!)

        // Extract file from multipart form data
        const boundary = contentType.split('boundary=')[1]
        if (!boundary) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid multipart boundary' })
            }
        }

        // Simple multipart parser - find the file content between boundaries
        const bodyStr = rawBody.toString('binary')
        const parts = bodyStr.split('--' + boundary)

        let fileBuffer: Buffer | null = null
        for (const part of parts) {
            if (part.includes('filename=') && part.includes('Content-Type')) {
                // Find where headers end (double newline)
                const headerEnd = part.indexOf('\r\n\r\n')
                if (headerEnd !== -1) {
                    // Extract file content (remove trailing \r\n--)
                    let fileContent = part.slice(headerEnd + 4)
                    if (fileContent.endsWith('\r\n')) {
                        fileContent = fileContent.slice(0, -2)
                    }
                    fileBuffer = Buffer.from(fileContent, 'binary')
                    break
                }
            }
        }

        if (!fileBuffer || fileBuffer.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No file found in upload' })
            }
        }

        // Parse Excel file
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
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

        // Group rows by PO Number
        const posMap = new Map<string, POData>()

        for (const row of data) {
            const poNumber = row['PO No.']?.toString().trim()
            if (!poNumber) continue

            if (!posMap.has(poNumber)) {
                posMap.set(poNumber, {
                    po_number: poNumber,
                    po_date: parseExcelDate(row['Date Open PO']),
                    vendor_name: row['Vendor']?.toString().trim(),
                    invoice_no: row['Invoice No.']?.toString().trim(),
                    invoice_date: parseExcelDate(row['Invoice Issue']),
                    lines: []
                })
            }

            const po = posMap.get(poNumber)!
            po.lines.push({
                item_name: row['Item']?.toString().trim(),
                quantity: parseFloat(row['Quantity']?.toString().replace(/\s/g, '') || '0'),
                uom: row['UOM']?.toString().trim(),
                unit_cost: parseFloat(row['Price/Unit']?.toString().replace(/\s/g, '') || '0'),
                gross: parseFloat(row['Gross']?.toString().replace(/\s/g, '') || '0')
            })
        }

        // Process each PO
        const results = {
            successful: [] as string[],
            failed: [] as { po_number: string; error: string }[]
        }

        for (const po of posMap.values()) {
            try {
                await processPO(po, user.id)
                results.successful.push(po.po_number)
            } catch (error: any) {
                results.failed.push({
                    po_number: po.po_number,
                    error: error.message
                })
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Import completed',
                total: posMap.size,
                successful: results.successful.length,
                failed: results.failed.length,
                details: results
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
