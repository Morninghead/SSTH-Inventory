import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Search, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { stockCountService } from '../../services/stockCountService'
import { generateStockCountPDF } from '../../utils/pdfExportStockCount'
import type { StockCountWithLines } from '../../types/stockCount.types'
import type { Database } from '../../types/database.types'

interface StockCountEntryProps {
  countId: string
  onBack: () => void
  onSave: () => void
}

type StockCountLine = Database['public']['Tables']['stock_count_lines']['Row'] & {
  item: Database['public']['Tables']['items']['Row'] & {
    categories?: { category_name: string } | null
  }
}

export default function StockCountEntry({ countId, onBack, onSave }: StockCountEntryProps) {
  const [stockCount, setStockCount] = useState<StockCountWithLines | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [modifiedLines, setModifiedLines] = useState<Set<string>>(new Set())
  const itemsPerPage = 50

  useEffect(() => {
    loadStockCount()
  }, [countId])

  const loadStockCount = async () => {
    try {
      setLoading(true)
      const data = await stockCountService.getStockCountWithLines(countId)
      setStockCount(data)
    } catch (error) {
      console.error('Error loading stock count:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCountChange = async (lineId: string, countedQty: string | number) => {
    const quantity = countedQty === '' ? null : parseFloat(countedQty.toString())

    // Update local state immediately for responsiveness
    setStockCount(prev => {
      if (!prev) return prev
      return {
        ...prev,
        lines: prev.lines.map(line =>
          line.line_id === lineId
            ? { ...line, counted_quantity: quantity }
            : line
        )
      }
    })

    // Mark as modified
    setModifiedLines(prev => new Set(prev).add(lineId))

    // Save to database
    try {
      await stockCountService.updateCountLine(lineId, quantity || 0)
      // Remove from modified set after successful save
      setModifiedLines(prev => {
        const newSet = new Set(prev)
        newSet.delete(lineId)
        return newSet
      })
    } catch (error) {
      console.error('Error updating count line:', error)
      // Revert on error
      loadStockCount()
    }
  }

  const handleSaveAll = async () => {
    if (modifiedLines.size === 0) return

    try {
      setSaving(true)
      // The lines are already saved individually as they change
      // Just trigger a reload to ensure everything is in sync
      await loadStockCount()
      onSave()
    } catch (error) {
      console.error('Error saving stock count:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    if (!stockCount) return

    try {
      await generateStockCountPDF(stockCount)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  const getFilteredLines = () => {
    if (!stockCount) return []

    return stockCount.lines.filter(line => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        line.item?.item_code?.toLowerCase().includes(search) ||
        line.item?.description?.toLowerCase().includes(search) ||
        line.item?.categories?.category_name?.toLowerCase().includes(search)
      )
    })
  }

  const filteredLines = getFilteredLines()
  const totalPages = Math.ceil(filteredLines.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLines = filteredLines.slice(startIndex, startIndex + itemsPerPage)

  const getLineIcon = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'DIFFERENCE':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getRowClass = (line: StockCountLine) => {
    if (line.status === 'MATCHED') return 'bg-green-50'
    if (line.status === 'DIFFERENCE') return 'bg-red-50'
    if (line.counted_quantity === null) return 'bg-yellow-50'
    return ''
  }

  const calculateVariance = (system: number, counted: number | null) => {
    if (counted === null) return null
    return counted - system
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stockCount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Stock count not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="outline" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Count Entry</h1>
            <p className="text-gray-600">
              {stockCount.count_type} - {stockCount.period_month || new Date(stockCount.count_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={modifiedLines.size === 0}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save All ({modifiedLines.size})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stockCount.discrepancy_summary.totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Matched</p>
              <p className="text-2xl font-bold text-gray-900">{stockCount.discrepancy_summary.matched_items}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Variances</p>
              <p className="text-2xl font-bold text-gray-900">{stockCount.discrepancy_summary.difference_items}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stockCount.discrepancy_summary.pending_items}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by item code, description, or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLines.length)} of {filteredLines.length} items
          </div>
        </div>
      </Card>

      {/* Count Entry Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counted Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLines.map((line, index) => {
                const variance = calculateVariance(line.system_quantity, line.counted_quantity)
                const varianceValue = variance !== null ? Math.abs(variance * (line.item?.unit_cost || 0)) : 0

                return (
                  <tr key={line.line_id} className={`${getRowClass(line)} hover:bg-opacity-80`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {getLineIcon(line.status)}
                        <span className="ml-2">{startIndex + index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {line.item?.item_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {line.item?.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.item?.categories?.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {line.system_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.001"
                        value={line.counted_quantity ?? ''}
                        onChange={(e) => handleCountChange(line.line_id, e.target.value)}
                        className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {variance !== null && (
                        <span className={variance === 0 ? 'text-green-600' : 'text-red-600'}>
                          {variance > 0 ? '+' : ''}{variance.toFixed(3)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {varianceValue > 0 && formatCurrency(varianceValue)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}