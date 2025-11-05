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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="mt-1 text-gray-600">Create and manage purchase orders</p>
          </div>
          {activeTab === 'list' && !showForm && (
            <Button onClick={() => { setActiveTab('create'); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          )}
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          <div className="mt-6">
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
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Create Purchase Order
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create a new purchase order to order items from suppliers
                    </p>
                    <Button onClick={() => setShowForm(true)}>
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
