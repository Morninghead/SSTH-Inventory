import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ItemFormModal from '../components/inventory/ItemFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import Input from '../components/ui/Input'

type Item = Database['public']['Tables']['items']['Row']
type InventoryStatus = Database['public']['Tables']['inventory_status']['Row']

interface ItemWithStock extends Item {
  inventory_status: InventoryStatus[]
  categories: { category_name: string } | null
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const itemsPerPage = 15

  useEffect(() => {
    loadItems()
  }, [currentPage, searchTerm])

  const loadItems = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('items')
        .select(
          `*, inventory_status(quantity), categories(category_name)`,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .order('item_code', { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        query = query.or(`item_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      setItems((data as ItemWithStock[]) || [])
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
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-okabe-ito-vermillion text-white' }
    if (quantity <= reorderLevel && reorderLevel > 0) return { label: 'Low Stock', color: 'bg-okabe-ito-orange text-white' }
    return { label: 'In Stock', color: 'bg-okabe-ito-bluishGreen text-white' }
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
    setSuccessMessage(selectedItem ? 'Item updated successfully!' : 'Item created successfully!')
    loadItems()
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from('items').update({ is_active: false }).eq('item_id', selectedItem.item_id)
      if (error) throw error
      setSuccessMessage('Item deleted successfully!')
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventory</h1>
            <p className="mt-1 text-gray-600">Manage your items and stock levels.</p>
          </div>
          <Button onClick={handleCreateClick} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by item code or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10"
              />
            </div>
            <Button variant="secondary" className="w-full sm:w-auto">
              Filters
            </Button>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-okabe-ito-blue"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">No items found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try a different search term.' : 'Start by adding your first item.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Item Code</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Quantity</th>
                    <th className="px-4 py-3 text-left font-medium">Unit Cost</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const status = getStockStatus(item)
                    const quantity = item.inventory_status?.[0]?.quantity || 0
                    return (
                      <tr key={item.item_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.item_code}</td>
                        <td className="px-4 py-3 text-gray-700">{item.description}</td>
                        <td className="px-4 py-3 text-gray-600">{item.categories?.category_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{quantity} {item.base_uom}</td>
                        <td className="px-4 py-3 text-gray-700">${item.unit_cost?.toFixed(2) || '0.00'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => handleEditClick(item)} className="p-2 text-gray-500 hover:text-okabe-ito-blue hover:bg-gray-100 rounded-md">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="p-2 text-gray-500 hover:text-okabe-ito-vermillion hover:bg-gray-100 rounded-md">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>-
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> items
              </div>
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>
                <div className="flex items-center px-3 text-sm font-medium">
                  {currentPage} / {totalPages}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-okabe-ito-bluishGreen text-white px-5 py-3 rounded-lg shadow-lg animate-fade-in">
            {successMessage}
          </div>
        )}
      </div>

      <ItemFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSuccess={handleFormSuccess} item={selectedItem} />
      <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handleDeleteConfirm} title="Delete Item" message={`Are you sure you want to delete "${selectedItem?.item_code}"? This action is permanent.`} confirmText="Delete" variant="danger" loading={deleteLoading} />
    </MainLayout>
  )
}
