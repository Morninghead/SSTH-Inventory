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

// Parse date from Excel format (e.g., "2-Jan-25" or Excel serial number)
function parseExcelDate(dateValue: any): string {
    try {
        if (!dateValue) return new Date().toISOString().split('T')[0]

        // Handle Excel serial date numbers
        if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1899, 11, 30)
            const date = new Date(excelEpoch.getTime() + dateValue * 86400000)
            return date.toISOString().split('T')[0]
        }

        const dateStr = dateValue.toString()
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
        }
        // Try parsing "2-Jan-25" format
        const parts = dateStr.trim().match(/(\d+)[-/](\w+)[-/](\d+)/)
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

// Extract file from multipart form data
function extractFileFromMultipart(body: Buffer, boundary: string): Buffer | null {
    const bodyStr = body.toString('binary')
    const parts = bodyStr.split('--' + boundary)

    for (const part of parts) {
        if (part.includes('filename=') && part.includes('Content-Type')) {
            const headerEnd = part.indexOf('\r\n\r\n')
            if (headerEnd !== -1) {
                let fileContent = part.slice(headerEnd + 4)
                if (fileContent.endsWith('\r\n')) {
                    fileContent = fileContent.slice(0, -2)
                }
                return Buffer.from(fileContent, 'binary')
            }
        }
    }
    return null
}

exports.handler = async (event: any) => {
    const startTime = Date.now()

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
        // Verify auth
        const authHeader = event.headers.authorization || event.headers.Authorization
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Authorization header required' })
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

        // Parse multipart form data
        const contentType = event.headers['content-type'] || ''
        if (!contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'File upload required' })
            }
        }

        const rawBody = event.isBase64Encoded
            ? Buffer.from(event.body!, 'base64')
            : Buffer.from(event.body!)

        const boundary = contentType.split('boundary=')[1]
        if (!boundary) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid multipart boundary' })
            }
        }

        const fileBuffer = extractFileFromMultipart(rawBody, boundary)
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

        // OPTIMIZATION: Fetch ALL suppliers and items upfront in 2 queries
        const [suppliersResult, itemsResult] = await Promise.all([
            supabase.from('suppliers').select('supplier_id, supplier_name'),
            supabase.from('items').select('item_id, item_name, description')
        ])

        // Build lookup maps (case-insensitive)
        const supplierMap = new Map<string, string>()
        for (const s of (suppliersResult.data || [])) {
            supplierMap.set(s.supplier_name.toLowerCase().trim(), s.supplier_id)
        }

        const itemMap = new Map<string, string>()
        for (const i of (itemsResult.data || [])) {
            if (i.item_name) itemMap.set(i.item_name.toLowerCase().trim(), i.item_id)
            if (i.description) itemMap.set(i.description.toLowerCase().trim(), i.item_id)
        }

        // Group rows by PO number
        const posMap = new Map<string, POData>()
        for (const row of data) {
            const poNumber = row['PO No.']?.toString().trim()
            if (!poNumber) continue

            if (!posMap.has(poNumber)) {
                posMap.set(poNumber, {
                    po_number: poNumber,
                    po_date: parseExcelDate(row['Date Open PO']),
                    vendor_name: row['Vendor']?.toString().trim() || '',
                    invoice_no: row['Invoice No.']?.toString().trim() || '',
                    invoice_date: parseExcelDate(row['Invoice Issue']),
                    lines: []
                })
            }

            const po = posMap.get(poNumber)!
            po.lines.push({
                item_name: row['Item']?.toString().trim() || '',
                quantity: parseFloat(row['Quantity']?.toString().replace(/\s/g, '') || '0'),
                uom: row['UOM']?.toString().trim() || '',
                unit_cost: parseFloat(row['Price/Unit']?.toString().replace(/[,\s]/g, '') || '0'),
                gross: parseFloat(row['Gross']?.toString().replace(/[,\s]/g, '') || '0')
            })
        }

        if (posMap.size === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No valid POs found in Excel. Check column headers: PO No., Date Open PO, Item, Quantity, UOM, Price/Unit, Gross, Vendor, Invoice No., Invoice Issue' })
            }
        }

        // Collect unique vendor names that need creation
        const newVendors: string[] = []
        for (const po of posMap.values()) {
            if (po.vendor_name && !supplierMap.has(po.vendor_name.toLowerCase().trim())) {
                if (!newVendors.includes(po.vendor_name)) {
                    newVendors.push(po.vendor_name)
                }
            }
        }

        // Batch create new vendors
        if (newVendors.length > 0) {
            const vendorsToInsert = newVendors.map((name, idx) => ({
                supplier_name: name,
                supplier_code: `SUP-${Date.now().toString().slice(-4)}${idx}`,
                is_active: true
            }))

            const { data: newSuppliers } = await supabase
                .from('suppliers')
                .insert(vendorsToInsert)
                .select('supplier_id, supplier_name')

            for (const s of (newSuppliers || [])) {
                supplierMap.set(s.supplier_name.toLowerCase().trim(), s.supplier_id)
            }
        }

        // Process all POs
        const results = {
            successful: [] as string[],
            failed: [] as { po_number: string; error: string }[]
        }

        for (const po of posMap.values()) {
            try {
                // Get supplier ID
                const supplierId = supplierMap.get(po.vendor_name.toLowerCase().trim())
                if (!supplierId) {
                    throw new Error(`Supplier not found: ${po.vendor_name}`)
                }

                // Get item IDs (from cache)
                const lineItems: { item_id: string; quantity: number; unit_cost: number; line_total: number }[] = []
                for (const line of po.lines) {
                    const itemId = itemMap.get(line.item_name.toLowerCase().trim())
                    if (!itemId) {
                        throw new Error(`Item not found: ${line.item_name}`)
                    }
                    lineItems.push({
                        item_id: itemId,
                        quantity: line.quantity,
                        unit_cost: line.unit_cost,
                        line_total: line.gross
                    })
                }

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
                        created_by: user.id,
                        notes: 'Imported from Excel'
                    })
                    .select('po_id')
                    .single()

                if (poError) {
                    throw new Error(`Failed to create PO: ${poError.message}`)
                }

                // Create PO lines
                const linesToInsert = lineItems.map(item => ({
                    ...item,
                    po_id: poHeader.po_id
                }))

                const { error: linesError } = await supabase
                    .from('purchase_order_line')
                    .insert(linesToInsert)

                if (linesError) {
                    throw new Error(`Failed to create PO lines: ${linesError.message}`)
                }

                results.successful.push(po.po_number)
            } catch (error: any) {
                results.failed.push({
                    po_number: po.po_number,
                    error: error.message
                })
            }
        }

        const elapsed = Date.now() - startTime
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Import completed',
                total: posMap.size,
                successful: results.successful.length,
                failed: results.failed.length,
                details: results,
                elapsedMs: elapsed
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
