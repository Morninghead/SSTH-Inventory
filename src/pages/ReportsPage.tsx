import { useState } from 'react'
import { BarChart3, Package, TrendingUp } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import InventoryReport from '../components/reports/InventoryReport'
import TransactionReport from '../components/reports/TransactionReport'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory')

  const tabs = [
    {
      id: 'inventory',
      label: 'Inventory Report',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'transactions',
      label: 'Transaction Report',
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-gray-600">View inventory reports and analytics</p>
          </div>
          <BarChart3 className="w-10 h-10 text-blue-500" />
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'inventory' && <InventoryReport />}
            {activeTab === 'transactions' && <TransactionReport />}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
