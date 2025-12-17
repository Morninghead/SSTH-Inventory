import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, AlertTriangle, DollarSign, FileText, Settings } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { stockCountService } from '../../services/stockCountService'
import { useAuth } from '../../contexts/AuthContext'
import type { StockCountWithLines, StockCountAdjustment } from '../../types/stockCount.types'

interface StockCountReviewProps {
  countId: string
  onBack: () => void
  onPosted: () => void
}

export default function StockCountReview({ countId, onBack, onPosted }: StockCountReviewProps) {
  const { profile } = useAuth()
  const [stockCount, setStockCount] = useState<StockCountWithLines | null>(null)
  const [adjustments, setAdjustments] = useState<StockCountAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [writeOffThreshold, setWriteOffThreshold] = useState(5)
  const [createAdjustmentTxns, setCreateAdjustmentTxns] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [countId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [countData, adjustmentsData] = await Promise.all([
        stockCountService.getStockCountWithLines(countId),
        stockCountService.getStockCountAdjustments(countId)
      ])
      setStockCount(countData)
      setAdjustments(adjustmentsData)
    } catch (error) {
      console.error('Error loading stock count:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    if (!stockCount || !profile?.id) return

    try {
      setPosting(true)
      await stockCountService.postStockCount(countId, writeOffThreshold, profile.id)
      onPosted()
    } catch (error) {
      console.error('Error posting stock count:', error)
    } finally {
      setPosting(false)
    }
  }

  const getVarianceItems = () => {
    if (!stockCount) return []
    return stockCount.lines.filter(line => line.discrepancy && line.discrepancy !== 0)
  }

  const getWriteOffItems = () => {
    if (!stockCount) return []
    return stockCount.lines.filter(line =>
      line.discrepancy &&
      Math.abs(line.discrepancy) <= writeOffThreshold &&
      line.discrepancy !== 0
    )
  }

  const getLargeVarianceItems = () => {
    if (!stockCount) return []
    return stockCount.lines.filter(line =>
      line.discrepancy &&
      Math.abs(line.discrepancy) > writeOffThreshold
    )
  }

  const calculateTotalVarianceValue = () => {
    if (!stockCount) return 0
    return stockCount.lines.reduce((sum, line) => {
      if (!line.discrepancy || !line.item) return sum
      return sum + Math.abs(line.discrepancy * line.item.unit_cost)
    }, 0)
  }

  const calculateWriteOffValue = () => {
    if (!stockCount) return 0
    return getWriteOffItems().reduce((sum, line) => {
      if (!line.discrepancy || !line.item) return sum
      return sum + Math.abs(line.discrepancy * line.item.unit_cost)
    }, 0)
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

  const writeOffItems = getWriteOffItems()
  const largeVarianceItems = getLargeVarianceItems()
  const totalVarianceValue = calculateTotalVarianceValue()
  const writeOffValue = calculateWriteOffValue()

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
            <h1 className="text-2xl font-bold text-gray-900">Review & Post Stock Count</h1>
            <p className="text-gray-600">
              {stockCount.count_type} - {stockCount.period_month || new Date(stockCount.count_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          onClick={handlePost}
          loading={posting}
          disabled={stockCount.status !== 'COMPLETED'}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Post Stock Count
        </Button>
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
              <AlertTriangle className="w-6 h-6 text-red-600" />
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
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Variance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVarianceValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Post Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <Settings className="w-5 h-5 inline mr-2" />
          Posting Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write-off Threshold
            </label>
            <Input
              type="number"
              min="0"
              step="0.001"
              value={writeOffThreshold}
              onChange={(e) => setWriteOffThreshold(parseFloat(e.target.value) || 0)}
              helperText="Variances at or below this value will be automatically written off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes about this posting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Variance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Write-offs */}
        {writeOffItems.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Automatic Write-offs ({writeOffItems.length} items)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Items with variance ≤ {writeOffThreshold} will be automatically adjusted
            </p>
            <div className="space-y-2">
              {writeOffItems.slice(0, 5).map(line => (
                <div key={line.line_id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{line.item?.item_code}</span>
                  <span className="text-gray-600">
                    {line.discrepancy! > 0 ? '+' : ''}{line.discrepancy}
                    {' '}({formatCurrency(Math.abs((line.discrepancy || 0) * (line.item?.unit_cost || 0)))})
                  </span>
                </div>
              ))}
              {writeOffItems.length > 5 && (
                <p className="text-sm text-gray-500">... and {writeOffItems.length - 5} more</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Write-off Value:</span>
                <span className="font-semibold">{formatCurrency(writeOffValue)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Large Variances */}
        {largeVarianceItems.length > 0 && (
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Large Variances ({largeVarianceItems.length} items)
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              Items with variance &gt; {writeOffThreshold} require manual review
            </p>
            <div className="space-y-2">
              {largeVarianceItems.slice(0, 5).map(line => (
                <div key={line.line_id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-yellow-900">{line.item?.item_code}</span>
                  <span className="text-yellow-800">
                    {line.discrepancy! > 0 ? '+' : ''}{line.discrepancy}
                    {' '}(฿{Math.abs((line.discrepancy || 0) * (line.item?.unit_cost || 0)).toFixed(2)})
                  </span>
                </div>
              ))}
              {largeVarianceItems.length > 5 && (
                <p className="text-sm text-yellow-700">... and {largeVarianceItems.length - 5} more</p>
              )}
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Recommendation:</strong> Review these items before posting.
                Create separate adjustment transactions for investigation.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* All Variances Table */}
      {getVarianceItems().length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Variances</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">System Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Counted Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getVarianceItems().map(line => {
                  const varianceValue = Math.abs((line.discrepancy || 0) * (line.item?.unit_cost || 0))
                  const isWriteOff = Math.abs(line.discrepancy || 0) <= writeOffThreshold

                  return (
                    <tr key={line.line_id} className={isWriteOff ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-sm font-medium">{line.item?.item_code}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{line.item?.description}</td>
                      <td className="px-4 py-2 text-sm text-right">{line.system_quantity}</td>
                      <td className="px-4 py-2 text-sm text-right">{line.counted_quantity || 0}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <span className={line.discrepancy! > 0 ? 'text-red-600' : 'text-green-600'}>
                          {line.discrepancy! > 0 ? '+' : ''}{line.discrepancy}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(varianceValue)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Status Warning */}
      {stockCount.status !== 'COMPLETED' && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            This stock count must be completed before it can be posted.
            Please ensure all items have been counted.
          </p>
        </Card>
      )}
    </div>
  )
}