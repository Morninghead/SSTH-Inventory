import { useState } from 'react'
import { ShoppingCart, Plus, List, FileText } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import EnhancedPOForm from '../components/purchasing/EnhancedPOForm'
import POList from '../components/purchasing/POList'
import PODetailModal from '../components/purchasing/PODetailModal'
import { useI18n } from '../i18n'

export default function PurchasingPage() {
  const { t } = useI18n()
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
      label: t('purchasing.purchaseOrders'),
      icon: <List className="w-5 h-5" />,
    },
    {
      id: 'create',
      label: t('purchasing.createPO'),
      icon: <FileText className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('purchasing.title')}</h1>
            <p className="mt-1 text-gray-600">{t('purchasing.subtitle')}</p>
          </div>
          {activeTab === 'list' && !showForm && (
            <Button
              onClick={() => { setActiveTab('create'); setShowForm(true) }}
              variant="gradient"
              size="lg"
              className="shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">{t('purchasing.newPurchaseOrder')}</span>
            </Button>
          )}
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          <div className="mt-6">
            {activeTab === 'list' && (
              <POList
                onViewPO={handleViewPO}
                refreshTrigger={refreshTrigger}
              />
            )}

            {activeTab === 'create' && (
              <div>
                {showForm ? (
                  <EnhancedPOForm
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    poId={editPOId || undefined}
                  />
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('purchasing.createPurchaseOrder')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('purchasing.createPurchaseOrderWithVat')}
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="primary"
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      <span className="font-semibold">{t('purchasing.createNewPO')}</span>
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
