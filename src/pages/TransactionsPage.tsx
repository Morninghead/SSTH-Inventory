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

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState('issue')
  const [showForm, setShowForm] = useState(false)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setShowForm(false) // Reset form when switching tabs
  }

  const tabs = [
    {
      id: 'issue',
      label: 'Issue Items',
      icon: <ArrowUpCircle className="w-5 h-5" />,
    },
    {
      id: 'receive',
      label: 'Receive Items',
      icon: <ArrowDownCircle className="w-5 h-5" />,
    },
    {
      id: 'adjustment',
      label: 'Stock Adjustment',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: 'Transaction History',
      icon: <Search className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Issue and receive inventory items</p>
          </div>
          {activeTab !== 'history' && (
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {activeTab === 'issue' ? 'New Issue' :
                 activeTab === 'receive' ? 'New Receipt' : 'New Adjustment'}
              </span>
              <span className="sm:hidden">
                {activeTab === 'issue' ? 'Issue' :
                 activeTab === 'receive' ? 'Receive' : 'Adjust'}
              </span>
            </Button>
          )}
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          <div className="mt-4 sm:mt-6">
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
                  <div className="text-center py-8 sm:py-12">
                    <ArrowUpCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Issue Items to Departments
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                      Record items being taken out of inventory for use by departments
                    </p>
                    <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Issue Transaction
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
                  <div className="text-center py-8 sm:py-12">
                    <ArrowDownCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Receive Items from Suppliers
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                      Record items being added to inventory from suppliers or returns
                    </p>
                    <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Receipt Transaction
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
                  <div className="text-center py-8 sm:py-12">
                    <Settings className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Stock Quantity Adjustments
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                      Manually adjust inventory quantities for corrections, physical counts, or data fixes
                    </p>
                    <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Stock Adjustment
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
