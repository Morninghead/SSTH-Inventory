import { ShoppingCart, Construction } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'

export default function PurchasingPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-gray-600">Manage purchase orders and suppliers</p>
        </div>

        <Card>
          <div className="text-center py-12">
            <Construction className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              Purchase order management features are under development
            </p>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
              <ShoppingCart className="w-4 h-4" />
              <span>PO creation, supplier management & receiving</span>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
