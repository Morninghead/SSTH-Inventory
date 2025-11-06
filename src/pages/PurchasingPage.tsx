import { useState } from 'react'
import { ShoppingCart, Plus, List, FileText } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import POForm from '../components/purchasing/POForm'
import POList from '../components/purchasing/POList'
import PODetailModal from '../components/purchasing/PODetailModal'

export default function PurchasingPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null)
  const [editPOId, setEditPOId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setShowForm(false)
    setEditPOId(null)
  }

  const handleViewPO = (poId: string) => {
    setSelectedPOId(poId)
  }

  const handleEditPO = (poId: string) => {
    setEditPOId(poId)
    setShowForm(true)
    setActiveTab('create')
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditPOId(null)
    setActiveTab('list')
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditPOId(null)
  }

  const tabs = [
    {
      id: 'list',
      label: 'Purchase Orders',
      icon: <List className="w-5 h-5" />,
    },
    {
      id: 'create',
      label: 'Create PO',
      icon: <FileText className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Create and manage purchase orders</p>
          </div>
          {activeTab === 'list' && !showForm && (
            <Button onClick={() => { setActiveTab('create'); setShowForm(true) }} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Purchase Order</span>
              <span className="sm:hidden">New PO</span>
            </Button>
          )}
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          <div className="mt-4 sm:mt-6">
            {activeTab === 'list' && (
              <POList
                onViewPO={handleViewPO}
                onEditPO={handleEditPO}
                refreshTrigger={refreshTrigger}
              />
            )}

            {activeTab === 'create' && (
              <div>
                {showForm ? (
                  <POForm
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    poId={editPOId || undefined}
                  />
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Create Purchase Order
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                      Create a new purchase order to order items from suppliers
                    </p>
                    <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New PO
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* PO Detail Modal */}
      {selectedPOId && (
        <PODetailModal
          poId={selectedPOId}
          onClose={() => setSelectedPOId(null)}
          onStatusChange={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}
    </MainLayout>
  )
}
