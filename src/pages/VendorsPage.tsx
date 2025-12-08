import { useState, useEffect } from 'react'
import { Building2, TrendingUp, DollarSign, Users, Star } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import VendorList from '../components/vendors/VendorList'
import VendorDetailModal from '../components/vendors/VendorDetailModal'
import VendorFormModal from '../components/vendors/VendorFormModal'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import { useI18n } from '../i18n'

type Vendor = Database['public']['Tables']['vendors']['Row'] & {
  vendor_categories?: { category_name: string } | null
}

type VendorSummary = {
  total_vendors: number
  active_vendors: number
  vat_registered: number
  avg_rating: number
  top_categories: Array<{
    category_name: string
    vendor_count: number
  }>
}

export default function VendorsPage() {
  const { t } = useI18n()
  const [vendorSummary, setVendorSummary] = useState<VendorSummary>({
    total_vendors: 0,
    active_vendors: 0,
    vat_registered: 0,
    avg_rating: 0,
    top_categories: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    loadVendorSummary()
  }, [])

  const loadVendorSummary = async () => {
    try {
      setLoading(true)

      // Get vendor statistics
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_categories(category_name)
        `)
        .eq('is_active', true)

      if (vendorsError) throw vendorsError

      const activeCount = vendors?.length || 0
      const vatRegisteredCount = vendors?.filter(v => v.is_vat_registered).length || 0
      const avgRating = vendors && vendors.length > 0
        ? vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length
        : 0

      // Get category counts
      const categoryCounts: Record<string, number> = {}
      vendors?.forEach(vendor => {
        const category = vendor.vendor_categories?.category_name || 'Uncategorized'
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })

      const topCategories = Object.entries(categoryCounts)
        .map(([category_name, vendor_count]) => ({ category_name, vendor_count }))
        .sort((a, b) => b.vendor_count - a.vendor_count)
        .slice(0, 5)

      setVendorSummary({
        total_vendors: vendors?.length || 0,
        active_vendors: activeCount,
        vat_registered: vatRegisteredCount,
        avg_rating: Math.round(avgRating * 10) / 10,
        top_categories: topCategories
      })
    } catch (error) {
      console.error('Error loading vendor summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDetailModalOpen(true)
  }

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    loadVendorSummary()
    // Refresh the list is handled by VendorList component's internal state or we could lift state up
    // For now, we just refresh summary stats
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('vendors.title')}</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              {t('vendors.manageSuppliers')}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('vendors.totalVendors')}</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorSummary.total_vendors}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('vendors.activeVendors')}</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorSummary.active_vendors}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('vendors.vatRegistered')}</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorSummary.vat_registered}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('vendors.avgRating')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{vendorSummary.avg_rating}</p>
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Top Categories */}
        {!loading && vendorSummary.top_categories.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('vendors.topCategories')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {vendorSummary.top_categories.map((category, index) => (
                <div key={category.category_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{category.category_name}</p>
                      <p className="text-xs text-gray-500">{category.vendor_count} {t('common.vendors')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Vendors List */}
        <VendorList onVendorSelect={handleVendorSelect} />

        {/* Modals */}
        <VendorDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          vendor={selectedVendor}
          onEdit={handleEditVendor}
        />

        <VendorFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          vendor={selectedVendor}
        />
      </div>
    </MainLayout>
  )
}