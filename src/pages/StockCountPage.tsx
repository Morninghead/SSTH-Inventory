import { useState, useEffect } from 'react'
import { Plus, Search, FileText, Calendar, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import { stockCountService } from '../services/stockCountService'
import { useAuth } from '../contexts/AuthContext'
import type { StockCountWithDetails, StockCountFilters } from '../types/stockCount.types'
import CreateStockCountModal from '../components/stockcount/CreateStockCountModal'
import StockCountEntry from '../components/stockcount/StockCountEntry'
import StockCountReview from '../components/stockcount/StockCountReview'

export default function StockCountPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('active')
  const [stockCounts, setStockCounts] = useState<StockCountWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCount, setSelectedCount] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'entry' | 'review'>('list')
  const itemsPerPage = 20

  // Filters
  const [filters, setFilters] = useState<StockCountFilters>({
    search: '',
    countType: '',
    status: '',
    periodMonth: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    loadStockCounts()
  }, [activeTab, currentPage, filters])

  const loadStockCounts = async () => {
    try {
      setLoading(true)
      const countFilters = activeTab === 'active'
        ? { ...filters, status: filters.status || 'DRAFT,IN_PROGRESS,COMPLETED' }
        : filters

      const { data, count } = await stockCountService.getStockCounts(
        countFilters,
        currentPage,
        itemsPerPage
      )

      setStockCounts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading stock counts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCount = () => {
    setIsCreateModalOpen(true)
  }

  const handleCountCreated = () => {
    setIsCreateModalOpen(false)
    loadStockCounts()
  }

  const handleEditCount = (countId: string) => {
    setSelectedCount(countId)
    const count = stockCounts.find(c => c.count_id === countId)
    if (count?.status === 'DRAFT' || count?.status === 'IN_PROGRESS') {
      setViewMode('entry')
    } else if (count?.status === 'COMPLETED') {
      setViewMode('review')
    }
  }

  const handleBackToList = () => {
    setSelectedCount(null)
    setViewMode('list')
    loadStockCounts()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4 text-gray-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'COMPLETED':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'POSTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-yellow-100 text-yellow-800',
      POSTED: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (viewMode === 'entry' && selectedCount) {
    return (
      <MainLayout>
        <StockCountEntry
          countId={selectedCount}
          onBack={handleBackToList}
          onSave={loadStockCounts}
        />
      </MainLayout>
    )
  }

  if (viewMode === 'review' && selectedCount) {
    return (
      <MainLayout>
        <StockCountReview
          countId={selectedCount}
          onBack={handleBackToList}
          onPosted={handleBackToList}
        />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Counting</h1>
            <p className="text-gray-600">Manage physical inventory counts and adjustments</p>
          </div>
          {(profile?.role === 'admin' || (profile?.role as string) === 'manager') && (
            <Button onClick={handleCreateCount}>
              <Plus className="w-4 h-4 mr-2" />
              New Stock Count
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'active', label: 'Active Counts' },
            { id: 'history', label: 'History' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <Input
                type="text"
                placeholder="Search by notes or reference..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.countType}
                onChange={(e) => setFilters(prev => ({ ...prev, countType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="EOM">End of Month</option>
                <option value="CYCLE">Cycle Count</option>
                <option value="ADHOC">Ad-hoc Count</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="POSTED">Posted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <Input
                type="month"
                value={filters.periodMonth}
                onChange={(e) => setFilters(prev => ({ ...prev, periodMonth: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Stock Counts List */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stockCounts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No stock counts found</p>
              <Button onClick={handleCreateCount} className="mt-4">
                Create your first stock count
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variances
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockCounts.map((count) => (
                    <tr key={count.count_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(count.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(count.count_date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {count.count_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{count.period_month}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(count.status)}`}>
                          {count.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {count.total_items} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {count.total_discrepancies || 0}
                        {count.total_variance_value && (
                          <span className="text-xs block">
                            ฿{count.total_variance_value.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {count.created_by_profile?.full_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCount(count.count_id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {count.status === 'POSTED' ? 'View' : 'Edit'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalCount > itemsPerPage && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
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
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * itemsPerPage >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Stock Count Modal */}
      {isCreateModalOpen && (
        <CreateStockCountModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCountCreated}
        />
      )}
    </MainLayout>
  )
}