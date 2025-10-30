import { useState, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle, Plus, Search } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import IssueTransactionForm from '../components/transactions/IssueTransactionForm'
import ReceiveTransactionForm from '../components/transactions/ReceiveTransactionForm'
import TransactionList from '../components/transactions/TransactionList'

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState('issue')
  const [showForm, setShowForm] = useState(false)

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
      id: 'history',
      label: 'Transaction History',
      icon: <Search className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="mt-1 text-gray-600">Issue and receive inventory items</p>
          </div>
          {activeTab !== 'history' && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'issue' ? 'New Issue' : 'New Receipt'}
            </Button>
          )}
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

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
                      Issue Items to Departments
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Record items being taken out of inventory for use by departments
                    </p>
                    <Button onClick={() => setShowForm(true)}>
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
                  <div className="text-center py-12">
                    <ArrowDownCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Receive Items from Suppliers
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Record items being added to inventory from suppliers or returns
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Receipt Transaction
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
