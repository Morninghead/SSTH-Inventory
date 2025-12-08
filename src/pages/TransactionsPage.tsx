import { useState } from 'react'
import { ArrowUpCircle, ArrowDownCircle, Settings, Plus, Search } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import IssueTransactionForm from '../components/transactions/IssueTransactionForm'
import ReceiveTransactionForm from '../components/transactions/ReceiveTransactionForm'
import StockAdjustmentForm from '../components/transactions/StockAdjustmentForm'
import TransactionList from '../components/transactions/TransactionList'
import { useI18n } from '../i18n'

export default function TransactionsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('issue')
  const [showForm, setShowForm] = useState(false)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setShowForm(false) // Reset form when switching tabs
  }

  const tabs = [
    {
      id: 'issue',
      label: t('transactions.issueItems'),
      icon: <ArrowUpCircle className="w-5 h-5" />,
    },
    {
      id: 'receive',
      label: t('transactions.receiveItems'),
      icon: <ArrowDownCircle className="w-5 h-5" />,
    },
    {
      id: 'adjustment',
      label: t('transactions.stockAdjustment'),
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: t('transactions.transactionHistory'),
      icon: <Search className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title')}</h1>
            <p className="mt-1 text-gray-600">{t('transactions.subtitle')}</p>
          </div>
          {activeTab !== 'history' && (
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="gradient"
              size="lg"
              className="shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">
                {activeTab === 'issue' ? t('transactions.newIssue') :
                 activeTab === 'receive' ? t('transactions.newReceipt') : t('transactions.newAdjustment')}
              </span>
            </Button>
          )}
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          <div className="mt-6">
            {activeTab === 'issue' && (
              <div>
                {showForm ? (
                  <IssueTransactionForm
                    onSuccess={() => {
                      setShowForm(false)
                      setActiveTab('history')
                    }}
                    onCancel={() => setShowForm(false)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <ArrowUpCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('transactions.issueItemsTo')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('transactions.recordItemsTaken')}
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      <span className="font-semibold">{t('transactions.createIssueTransaction')}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'receive' && (
              <div>
                {showForm ? (
                  <ReceiveTransactionForm
                    onSuccess={() => {
                      setShowForm(false)
                      setActiveTab('history')
                    }}
                    onCancel={() => setShowForm(false)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <ArrowDownCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('transactions.receiveItemsFrom')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('transactions.recordItemsAdded')}
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="success"
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      <span className="font-semibold">{t('transactions.createReceiptTransaction')}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'adjustment' && (
              <div>
                {showForm ? (
                  <StockAdjustmentForm
                    onSuccess={() => {
                      setShowForm(false)
                      setActiveTab('history')
                    }}
                    onCancel={() => setShowForm(false)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('transactions.stockAdjustments')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('transactions.manuallyAdjust')}
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="secondary"
                      size="lg"
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl text-white"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      <span className="font-semibold">{t('transactions.createStockAdjustment')}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && <TransactionList />}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
