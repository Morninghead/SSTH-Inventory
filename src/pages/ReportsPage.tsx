import { useState } from 'react'
import { BarChart3, Package, TrendingUp, Users } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import InventoryReport from '../components/reports/InventoryReport'
import TransactionReport from '../components/reports/TransactionReport'
import DepartmentWithdrawalReport from '../components/reports/DepartmentWithdrawalReport'
import { useI18n } from '../i18n'

export default function ReportsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('inventory')

  const tabs = [
    {
      id: 'inventory',
      label: t('reports.inventoryReport'),
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'transactions',
      label: t('reports.transactionReport'),
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'department-analytics',
      label: t('reports.departmentAnalyticsLabel'),
      icon: <Users className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
            <p className="mt-1 text-gray-600">{t('reports.subtitle')}</p>
          </div>
          <BarChart3 className="w-10 h-10 text-blue-500" />
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'inventory' && <InventoryReport />}
            {activeTab === 'transactions' && <TransactionReport />}
            {activeTab === 'department-analytics' && <DepartmentWithdrawalReport />}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
