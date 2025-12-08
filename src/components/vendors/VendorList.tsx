import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Building2, Star, MapPin, Phone, Mail } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import VendorFormModal from './VendorFormModal'
import ConfirmDialog from '../ui/ConfirmDialog'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'

type Vendor = Database['public']['Tables']['vendors']['Row'] & {
  vendor_categories?: { category_name: string } | null
}

interface VendorListProps {
  onVendorSelect?: (vendor: Vendor) => void
  showActions?: boolean
}

export default function VendorList({ onVendorSelect, showActions = true }: VendorListProps) {
  const { t } = useI18n()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const itemsPerPage = 20

  useEffect(() => {
    loadVendors()
  }, [currentPage, searchTerm])

  const loadVendors = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('vendors')
        .select('*, vendor_categories(category_name)', { count: 'exact' })
        .eq('is_active', true)

      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`vendor_code.ilike.%${searchTerm}%,vendor_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
      }

      query = query
        .order('vendor_name', { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      const { data, error, count } = await query

      if (error) throw error

      setVendors(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleCreateClick = () => {
    setSelectedVendor(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsFormModalOpen(true)
  }

  const handleDeleteClick = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDeleteDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setSuccessMessage(selectedVendor ? t('vendors.vendorList.vendorUpdated') : t('vendors.vendorList.vendorCreated'))
    loadVendors()
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedVendor) return

    setDeleteLoading(true)
    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: false })
        .eq('vendor_id', selectedVendor.vendor_id)

      if (error) throw error

      setSuccessMessage(t('vendors.vendorList.vendorDeleted'))
      setIsDeleteDialogOpen(false)
      setSelectedVendor(null)
      loadVendors()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting vendor:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('vendors.vendorList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset to first page when searching
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="secondary" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            {t('vendors.vendorList.filter')}
          </Button>
        </div>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Vendors List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-base sm:text-lg">{t('vendors.vendorList.noVendorsFound')}</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              {searchTerm ? t('vendors.vendorList.tryDifferentSearch') : t('vendors.vendorList.addFirstVendor')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vendors.vendorList.vendorInfo')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vendors.vendorList.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vendors.vendorList.category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vendors.vendorList.vat')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vendors.vendorList.rating')}
                  </th>
                  {showActions && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('vendors.vendorList.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.vendor_id}
                    className={`hover:bg-gray-50 ${onVendorSelect ? 'cursor-pointer' : ''}`}
                    onClick={() => onVendorSelect?.(vendor)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.vendor_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.vendor_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {vendor.contact_email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-3 h-3 mr-1" />
                            {vendor.contact_email}
                          </div>
                        )}
                        {vendor.contact_phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {vendor.contact_phone}
                          </div>
                        )}
                        {(vendor.city || vendor.province) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            {[vendor.city, vendor.province].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {vendor.vendor_categories?.category_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            vendor.is_vat_registered
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vendor.is_vat_registered ? t('vendors.vendorList.vatRegistered') : t('vendors.vendorList.nonVat')}
                          </span>
                          {vendor.is_vat_registered && (
                            <span className="ml-2 text-sm text-gray-600">
                              {vendor.default_vat_rate}%
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {vendor.payment_terms}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRatingStars(vendor.rating || 0)}
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(vendor)
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title={t('vendors.vendorList.editVendor')}
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(vendor)
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title={t('vendors.vendorList.deleteVendor')}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              {t('vendors.vendorList.showingVendors', {
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, totalCount),
                total: totalCount
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                {t('vendors.vendorList.previous')}
              </Button>
              <div className="flex items-center px-2 sm:px-3 text-xs sm:text-sm">
                {t('vendors.vendorList.pageOf', { current: currentPage, total: totalPages })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                {t('vendors.vendorList.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Vendor Button */}
      {showActions && (
        <div className="flex justify-end">
          <Button onClick={handleCreateClick} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('vendors.vendorList.addVendorButton')}
          </Button>
        </div>
      )}

      {/* Modals */}
      <VendorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        vendor={selectedVendor}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('vendors.vendorList.deleteDialogTitle')}
        message={t('vendors.vendorList.deleteDialogMessage', { vendorName: selectedVendor?.vendor_name || 'Unknown' })}
        confirmText={t('vendors.vendorList.deleteDialogConfirm')}
        cancelText={t('vendors.vendorList.deleteDialogCancel')}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}