import { useState, useEffect } from 'react'
import { X, Save, Building2, Phone, MapPin, CreditCard, Globe, AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'

interface VendorFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vendor?: any
}

export default function VendorFormModal({ isOpen, onClose, onSuccess, vendor }: VendorFormModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState({
    vendor_code: '',
    vendor_name: '',
    vendor_category_id: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Thailand',
    tax_id: '',
    payment_terms: '',
    website: '',
    notes: '',
    is_active: true,
    rating: 0,
    default_vat_rate: 7,
    is_vat_registered: true
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('vendor_categories')
        .select('vendor_category_id, category_name')
        .eq('is_active', true)
        .order('category_name')

      if (!error && data) {
        setCategories(data)
      }
    }

    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_code: vendor.vendor_code || '',
        vendor_name: vendor.vendor_name || '',
        vendor_category_id: vendor.vendor_category_id || '',
        contact_person: vendor.contact_person || '',
        contact_email: vendor.contact_email || '',
        contact_phone: vendor.contact_phone || '',
        address_line1: vendor.address_line1 || '',
        address_line2: vendor.address_line2 || '',
        city: vendor.city || '',
        province: vendor.province || '',
        postal_code: vendor.postal_code || '',
        country: vendor.country || 'Thailand',
        tax_id: vendor.tax_id || '',
        payment_terms: vendor.payment_terms || '',
        website: vendor.website || '',
        notes: vendor.notes || '',
        is_active: vendor.is_active ?? true,
        rating: vendor.rating || 0,
        default_vat_rate: vendor.default_vat_rate || 7,
        is_vat_registered: vendor.is_vat_registered ?? true
      })
    } else {
      setFormData({
        vendor_code: '',
        vendor_name: '',
        vendor_category_id: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        province: '',
        postal_code: '',
        country: 'Thailand',
        tax_id: '',
        payment_terms: '',
        website: '',
        notes: '',
        is_active: true,
        rating: 0,
        default_vat_rate: 7,
        is_vat_registered: true
      })
    }
  }, [vendor, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const dataToSave = {
        ...formData,
        vendor_category_id: formData.vendor_category_id || null
      }

      if (vendor) {
        const { error } = await supabase
          .from('vendors')
          .update(dataToSave)
          .eq('vendor_id', vendor.vendor_id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([dataToSave])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving vendor:', err)
      setError(err.message || 'Failed to save vendor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vendor ? t('vendors.editVendor') : t('vendors.addNewVendor')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            {t('vendors.basicInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('vendors.vendorCode')}
              name="vendor_code"
              value={formData.vendor_code}
              onChange={handleChange}
              required
              placeholder="e.g. SUP-001"
            />
            <Input
              label={t('vendors.vendorName')}
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              required
              placeholder="Company Name Co., Ltd."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vendors.vendorCategory')}
              </label>
              <select
                name="vendor_category_id"
                value={formData.vendor_category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('vendors.selectCategory')}</option>
                {categories.map(cat => (
                  <option key={cat.vendor_category_id} value={cat.vendor_category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t('vendors.taxId')}
              name="tax_id"
              value={formData.tax_id}
              onChange={handleChange}
              placeholder="13-digit Tax ID"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            {t('vendors.contactInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('vendors.contactPerson')}
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
            />
            <Input
              label={t('vendors.email')}
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
            />
            <Input
              label={t('vendors.phone')}
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            {t('vendors.addressInfo')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label={t('vendors.addressLine1')}
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
            />
            <Input
              label={t('vendors.addressLine2')}
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('vendors.city')}
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <Input
                label={t('vendors.province')}
                name="province"
                value={formData.province}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('vendors.postalCode')}
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
              />
              <Input
                label={t('vendors.country')}
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            {t('vendors.financialInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('vendors.paymentTerms')}
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
              placeholder="e.g. Net 30"
            />
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  label={t('vendors.defaultVatRatePercent')}
                  name="default_vat_rate"
                  type="number"
                  value={formData.default_vat_rate}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_vat_registered"
                    checked={formData.is_vat_registered}
                    onChange={handleChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('vendors.vatRegistered')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            {t('vendors.additionalInfo')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label={t('vendors.website')}
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.notes')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} type="button">
            <X className="w-4 h-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? t('purchasing.poForm.saving') : (vendor ? t('vendors.updateVendor') : t('vendors.saveVendor'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}