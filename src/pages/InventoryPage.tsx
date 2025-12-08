import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ItemFormModal from '../components/inventory/ItemFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ExportButton from '../components/ui/ExportButton'
import { useI18n } from '../i18n/I18nProvider'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type InventoryStatus = Database['public']['Tables']['inventory_status']['Row']

interface ItemWithStock extends Item {
  inventory_status: InventoryStatus[]
  categories: { category_name: string } | null
}

export default function InventoryPage() {
  const { t } = useI18n()
  const [filteredItems, setFilteredItems] = useState<ItemWithStock[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const itemsPerPage = 20

  useEffect(() => {
    loadItems()
  }, [currentPage, searchTerm])

  const loadItems = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('items')
        .select('*, categories(category_name)', { count: 'exact' })
        .eq('is_active', true)

      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`item_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      query = query
        .order('item_code', { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Fetch inventory status separately
      const itemIds = (data as Item[]).map(item => item.item_id)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_status')
        .select('item_id, quantity')
        .in('item_id', itemIds)

      if (inventoryError) {
        // Silently handle inventory status fetch error
      }

      // Merge items with inventory status
      const itemsWithStock = (data as Item[]).map(item => ({
        ...item,
        inventory_status: inventoryData?.filter(inv => inv.item_id === item.item_id) || []
      }))

      setFilteredItems(itemsWithStock as ItemWithStock[])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const getStockStatus = (item: ItemWithStock) => {
    const quantity = item.inventory_status?.[0]?.quantity || 0
    const reorderLevel = item.reorder_level || 0

    if (quantity === 0) return { label: t('inventory.outOfStock'), color: 'bg-red-100 text-red-800' }
    if (quantity <= reorderLevel) return { label: t('inventory.lowStock'), color: 'bg-yellow-100 text-yellow-800' }
    return { label: t('inventory.inStock'), color: 'bg-green-100 text-green-800' }
  }

  const handleCreateClick = () => {
    setSelectedItem(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (item: Item) => {
    setSelectedItem(item)
    setIsFormModalOpen(true)
  }

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setSuccessMessage(selectedItem ? t('inventory.messages.itemUpdated') : t('inventory.messages.itemCreated'))
    loadItems()
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return

    setDeleteLoading(true)
    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('item_id', selectedItem.item_id)

      if (error) throw error

      setSuccessMessage(t('inventory.messages.itemDeleted'))
      setIsDeleteDialogOpen(false)
      setSelectedItem(null)
      loadItems()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('inventory.title')}</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              {t('inventory.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <ExportButton
              filename="inventory-items"
              className="flex-1 sm:flex-initial"
            />
            <Button
              onClick={handleCreateClick}
              variant="gradient"
              size="lg"
              className="flex-1 sm:flex-initial shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">{t('inventory.addItem')}</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('inventory.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button variant="secondary" className="w-full sm:w-auto">
              {t('common.filter')}
            </Button>
          </div>
        </Card>

        {/* Items Table/Cards */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-base sm:text-lg">{t('inventory.noItemsFound')}</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">
                {searchTerm ? t('inventory.tryDifferentSearch') : t('inventory.addFirstItem')}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item)
                  const quantity = item.inventory_status?.[0]?.quantity || 0

                  return (
                    <div key={item.item_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.description}
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">{item.item_code}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${status.color}`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                            <div>
                              <span className="text-gray-500">{t('inventory.category')}:</span>
                              <span className="ml-1 text-gray-900">{item.categories?.category_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">{t('inventory.quantity')}:</span>
                              <span className="ml-1 text-gray-900">{quantity} {item.base_uom}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">{t('inventory.unitCost')}:</span>
                              <span className="ml-1 text-gray-900 font-medium">
                                ฿{item.unit_cost?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.image')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.itemCode')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.description')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.category')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.quantity')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.unitCost')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.status')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const status = getStockStatus(item)
                      const quantity = item.inventory_status?.[0]?.quantity || 0

                      return (
                        <tr key={item.item_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.description}
                                className="w-12 h-12 object-cover rounded border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.item_code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.categories?.category_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quantity} {item.base_uom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ฿{item.unit_cost?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title={t('inventory.editItem')}
                            >
                              <Edit className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title={t('inventory.deleteItem')}
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                {t('common.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('common.to')}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{' '}
                {t('common.of')} <span className="font-medium">{totalCount}</span> {t('inventory.items')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </Button>
                <div className="flex items-center px-2 sm:px-3 text-xs sm:text-sm">
                  {t('common.page')} {currentPage} {t('common.pageOf')} {totalPages}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Success Message */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
            {successMessage}
          </div>
        )}
      </div>

      {/* Modals */}
      <ItemFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        item={selectedItem}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('inventory.deleteItem')}
        message={`Are you sure you want to delete "${selectedItem?.item_code}"? This action cannot be undone.`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={deleteLoading}
      />
    </MainLayout>
  )
}
