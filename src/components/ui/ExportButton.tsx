import React, { useState } from 'react'
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react'
import Button from './Button'
import { exportInventory } from '../../utils/exportUtils'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'


interface ExportButtonProps {
  filename?: string
  className?: string
  variant?: 'inventory' | 'audit' // Default is 'inventory'
}

export default function ExportButton({ filename, className }: ExportButtonProps) {
  const { t } = useI18n()
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch total count of items on mount
  React.useEffect(() => {
    const fetchItemCount = async () => {
      try {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        setTotalCount(count || 0)
      } catch (error) {
        console.error('Error fetching item count:', error)
      }
    }
    fetchItemCount()
  }, [])

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf-current' | 'pdf-audit') => {
    setIsExporting(true)
    setShowDropdown(false)

    try {
      // Fetch ALL items for export (no pagination)
      const { data: items, error } = await supabase
        .from('items')
        .select('*, categories(category_name)')
        .eq('is_active', true)
        .order('item_code')

      if (error) throw error

      // Fetch inventory status for all items
      const itemIds = items?.map(item => item.item_id) || []
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_status')
        .select('item_id, quantity')
        .in('item_id', itemIds)

      if (inventoryError) {
        console.error('Error fetching inventory status:', inventoryError)
      }

      // Merge items with inventory status
      const itemsWithInventory = items?.map(item => ({
        ...item,
        inventory_status: inventoryData
          ?.filter(inv => inv.item_id === item.item_id)
          .map(inv => ({ quantity: inv.quantity || 0 })) || [{ quantity: 0 }],
        categories: item.categories
      })) || []

      await exportInventory(itemsWithInventory, format, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Failed to export to ${format.replace('-', ' ').toUpperCase()}. Please try again.`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting || totalCount === 0}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {isExporting ? t('common.exporting') : t('common.export')}
        <FileText className="w-4 h-4" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                disabled={isExporting}
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>{t('common.exportAsCSV')}</span>
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                disabled={isExporting}
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>{t('common.exportAsExcel')}</span>
              </button>
              <button
                onClick={() => handleExport('pdf-current')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                disabled={isExporting}
              >
                <File className="w-4 h-4 text-red-600" />
                <span>{t('common.currentInventoryPDF')}</span>
              </button>
              <button
                onClick={() => handleExport('pdf-audit')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                disabled={isExporting}
              >
                <File className="w-4 h-4 text-orange-600" />
                <span>{t('common.auditReportPDF')}</span>
              </button>
            </div>

            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <p className="text-xs text-gray-600">
                {totalCount} {t('common.totalItems')} • {t('common.allDataIncluded')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}