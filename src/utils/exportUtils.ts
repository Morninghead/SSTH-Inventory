import type { Database } from '../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type ItemWithInventory = Item & {
  inventory_status: Array<{ quantity: number }> | null
  categories: { category_name: string } | null
}

// CSV Export Function (no unit costs)
export const exportToCSV = (items: ItemWithInventory[], filename: string = 'inventory-export') => {
  // Create CSV headers - Category first, no item code, reorder level, or status
  const headers = [
    'Category',
    'Description',
    'Current Quantity',
    'UOM'
  ]

  // Convert items to CSV rows
  const csvRows = [
    headers.join(','),
    ...items.map(item => {
      const quantity = item.inventory_status?.[0]?.quantity || 0

      return [
        `"${item.categories?.category_name || 'Uncategorized'}"`,
        `"${item.description || ''}"`,
        quantity,
        `"${item.base_uom || ''}"`
      ].join(',')
    })
  ]

  // Create blob and download
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Excel Export Function using SheetJS (xlsx)
export const exportToXLSX = async (items: ItemWithInventory[], filename: string = 'inventory-export') => {
  try {
    // Dynamically import xlsx
    const XLSX = await import('xlsx')

    // Prepare data for Excel (no unit costs) - Category first, no item code, reorder level, or status
    const excelData = items.map(item => {
      const quantity = item.inventory_status?.[0]?.quantity || 0

      return {
        'Category': item.categories?.category_name || 'Uncategorized',
        'Description': item.description || '',
        'Current Quantity': quantity,
        'UOM': item.base_uom || ''
      }
    })

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')

    // Generate file
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export to Excel. Please make sure the xlsx library is available.')
  }
}

// PDF Export for Current Inventory (no unit costs)
export const exportToPDFCurrent = async (items: ItemWithInventory[], filename: string = 'inventory-current') => {
  try {
    // Dynamically import jspdf and autoTable
    const { jsPDF } = await import('jspdf')
    const autoTable = await import('jspdf-autotable')

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text('Current Inventory Report', 14, 15)

    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25)

    // Prepare table data (no unit costs) - Category first, no item code, reorder level, or status
    const tableData = items.map(item => {
      const quantity = item.inventory_status?.[0]?.quantity || 0

      return [
        item.categories?.category_name || 'Uncategorized',
        item.description || '',
        quantity.toString(),
        item.base_uom || ''
      ]
    })

    // Add table with borders optimized for A4
    autoTable.default(doc, {
      head: [
        ['Category', 'Description', 'Quantity', 'UOM']
      ],
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      body: tableData,
      startY: 35,
      pageBreak: 'auto',
      tableWidth: 'auto',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: 'linebreak',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Category (now first)
        1: { cellWidth: 70, halign: 'left' },   // Description
        2: { cellWidth: 20, halign: 'center' }, // Quantity
        3: { cellWidth: 15, halign: 'center' }  // UOM
      },
      margin: { left: 15, right: 15, top: 35, bottom: 20 },
      didDrawPage: (data) => {
        // Add page footer with page numbers
        const pageCount = (doc as any).internal.getNumberOfPages()
        const pageCurrent = (doc as any).internal.getCurrentPageInfo().pageNumber

        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`Page ${pageCurrent} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10)

        // Add date and time on each page
        const dateStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        const timeStr = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        doc.text(`Generated: ${dateStr} ${timeStr}`, doc.internal.pageSize.width - data.settings.margin.right - 40, doc.internal.pageSize.height - 10)
      }
    })

    // Add summary statistics
    const finalY = (doc as any).lastAutoTable?.finalY || 200 + 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary Statistics', 14, finalY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const totalItems = items.length
    const totalQuantity = items.reduce((sum, item) => sum + (item.inventory_status?.[0]?.quantity || 0), 0)
    const outOfStock = items.filter(item => (item.inventory_status?.[0]?.quantity || 0) === 0).length
    const lowStock = items.filter(item => {
      const quantity = item.inventory_status?.[0]?.quantity || 0
      return quantity > 0 && quantity <= (item.reorder_level || 0)
    }).length

    doc.text(`Total Items: ${totalItems}`, 14, finalY + 8)
    doc.text(`Total Quantity: ${totalQuantity.toLocaleString()}`, 14, finalY + 13)
    doc.text(`Out of Stock: ${outOfStock}`, 14, finalY + 18)
    doc.text(`Low Stock: ${lowStock}`, 14, finalY + 23)

    // Save PDF
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    throw new Error('Failed to export to PDF. Please make sure the PDF libraries are available.')
  }
}

// PDF Export for Audit with additional columns
export const exportToPDFAudit = async (items: ItemWithInventory[], filename: string = 'inventory-audit') => {
  try {
    // Dynamically import jspdf and autoTable
    const { jsPDF } = await import('jspdf')
    const autoTable = await import('jspdf-autotable')

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text('Inventory Audit Report', 14, 15)

    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25)
    doc.setFontSize(9)
    doc.text('Please complete the audit columns during physical verification', 14, 30)

    // Prepare table data for audit - Category first, no item code, reorder level, or status
    const tableData = items.map(item => {
      const quantity = item.inventory_status?.[0]?.quantity || 0

      return [
        item.categories?.category_name || 'Uncategorized',
        item.description || '',
        quantity.toString(),
        item.base_uom || '',
        '', // Physical Count (empty for auditor to fill)
        '', // Variance (empty for auditor to fill)
        '', // Remarks (empty for auditor to fill)
        ''  // Auditor Notes (empty for auditor to fill)
      ]
    })

    // Add audit table optimized for A4
    autoTable.default(doc, {
      head: [
        ['Category', 'Description', 'System', 'UOM', 'Physical', 'Variance', 'Remarks', 'Auditor Notes']
      ],
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      body: tableData,
      startY: 40,
      pageBreak: 'auto',
      tableWidth: 'auto',
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: 'linebreak',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Category (now first)
        1: { cellWidth: 40, halign: 'left' },   // Description
        2: { cellWidth: 12, halign: 'center' }, // System Qty
        3: { cellWidth: 10, halign: 'center' }, // UOM
        4: { cellWidth: 12, halign: 'center' }, // Physical Count
        5: { cellWidth: 10, halign: 'center' }, // Variance
        6: { cellWidth: 20, halign: 'left' },   // Remarks
        7: { cellWidth: 20, halign: 'left' }    // Auditor Notes
      },
      margin: { left: 10, right: 10, top: 40, bottom: 20 },
      didDrawPage: (data) => {
        // Add page footer with page numbers
        const pageCount = (doc as any).internal.getNumberOfPages()
        const pageCurrent = (doc as any).internal.getCurrentPageInfo().pageNumber

        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`Page ${pageCurrent} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10)

        // Add date and time on each page
        const dateStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        const timeStr = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        doc.text(`Generated: ${dateStr} ${timeStr}`, doc.internal.pageSize.width - data.settings.margin.right - 40, doc.internal.pageSize.height - 10)
      }
    })

    // Add audit summary and instructions on new page if needed
    let finalY = (doc as any).lastAutoTable?.finalY || 200

    // Check if we need a new page for the summary
    if (finalY > 220) {
      doc.addPage()
      finalY = 20
    }

    // Draw border for summary section
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.1)
    doc.rect(10, finalY, 190, 80)

    // Add audit summary header with background
    doc.setFillColor(240, 240, 240)
    doc.rect(10, finalY, 190, 12, 'F')
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.2)
    doc.line(10, finalY + 12, 200, finalY + 12)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Audit Summary & Instructions', 15, finalY + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const totalItems = items.length
    const totalQuantity = items.reduce((sum, item) => sum + (item.inventory_status?.[0]?.quantity || 0), 0)
    const outOfStock = items.filter(item => (item.inventory_status?.[0]?.quantity || 0) === 0).length
    const lowStock = items.filter(item => {
      const quantity = item.inventory_status?.[0]?.quantity || 0
      return quantity > 0 && quantity <= (item.reorder_level || 0)
    }).length

    // Summary statistics
    doc.setFont('helvetica', 'bold')
    doc.text('System Summary:', 15, finalY + 22)
    doc.setFont('helvetica', 'normal')
    doc.text(`• Total Items: ${totalItems}`, 20, finalY + 28)
    doc.text(`• Total Quantity: ${totalQuantity.toLocaleString()}`, 20, finalY + 33)
    doc.text(`• Out of Stock: ${outOfStock}`, 20, finalY + 38)
    doc.text(`• Low Stock Items: ${lowStock}`, 20, finalY + 43)

    // Audit instructions
    doc.setFont('helvetica', 'bold')
    doc.text('Audit Instructions:', 110, finalY + 22)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('1. Perform physical count of all items', 115, finalY + 28)
    doc.text('2. Fill in Physical Count column', 115, finalY + 33)
    doc.text('3. Calculate Variance: Physical - System', 115, finalY + 38)
    doc.text('4. Add remarks for discrepancies', 115, finalY + 43)
    doc.text('5. Sign and date completed audit', 115, finalY + 48)

    // Add signature lines
    doc.setFontSize(8)
    doc.text('Auditor Signature: _________________________ Date: _____________', 15, finalY + 60)
    doc.text('Reviewed By: _________________________ Date: _____________', 15, finalY + 68)

    // Add border for signature area
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.1)
    doc.rect(15, finalY + 55, 170, 20)

    // Save PDF
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting audit PDF:', error)
    throw new Error('Failed to export audit PDF. Please make sure the PDF libraries are available.')
  }
}

// Main export function that handles all formats
export const exportInventory = async (
  items: ItemWithInventory[],
  format: 'csv' | 'xlsx' | 'pdf-current' | 'pdf-audit',
  filename?: string
) => {
  const defaultFilename = filename || 'inventory-export'

  switch (format) {
    case 'csv':
      exportToCSV(items, defaultFilename)
      break
    case 'xlsx':
      await exportToXLSX(items, defaultFilename)
      break
    case 'pdf-current':
      await exportToPDFCurrent(items, defaultFilename)
      break
    case 'pdf-audit':
      await exportToPDFAudit(items, defaultFilename)
      break
    default:
      throw new Error('Unsupported export format')
  }
}