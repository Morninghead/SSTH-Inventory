import { X, Building2, Phone, MapPin, CreditCard, Star, FileText, Globe, Mail } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'

type Vendor = Database['public']['Tables']['vendors']['Row'] & {
    vendor_categories?: { category_name: string } | null
}

interface VendorDetailModalProps {
    isOpen: boolean
    onClose: () => void
    vendor: Vendor | null
    onEdit: (vendor: Vendor) => void
}

export default function VendorDetailModal({ isOpen, onClose, vendor, onEdit }: VendorDetailModalProps) {
    const { t } = useI18n()
    if (!vendor) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('vendors.details')}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{vendor.vendor_name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">{vendor.vendor_code}</span>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">{vendor.vendor_categories?.category_name || t('common.unknown')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => onEdit(vendor)}>
                            {t('vendors.editVendor')}
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status & Rating */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('common.status')}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {vendor.is_active ? t('vendors.active') : t('vendors.inactive')}
                            </span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('vendors.vatStatus')}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_vat_registered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {vendor.is_vat_registered ? t('vendors.vatRegistered') : t('vendors.notRegistered')}
                            </span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('vendors.rating')}</p>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= (vendor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <Phone className="w-5 h-5 text-gray-500" />
                                {t('vendors.contactInfo')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('vendors.contactPerson')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{vendor.contact_person || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('vendors.email')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                                        {vendor.contact_email ? (
                                            <>
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <a href={`mailto:${vendor.contact_email}`} className="text-blue-600 hover:underline">
                                                    {vendor.contact_email}
                                                </a>
                                            </>
                                        ) : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('vendors.phone')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{vendor.contact_phone || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('vendors.website')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                                        {vendor.website ? (
                                            <>
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {vendor.website}
                                                </a>
                                            </>
                                        ) : '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                {t('vendors.address')}
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed">
                                {vendor.address_line1 && <p>{vendor.address_line1}</p>}
                                {vendor.address_line2 && <p>{vendor.address_line2}</p>}
                                <p>
                                    {[vendor.city, vendor.province, vendor.postal_code].filter(Boolean).join(', ')}
                                </p>
                                <p>{vendor.country}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Business Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <FileText className="w-5 h-5 text-gray-500" />
                                {t('vendors.businessDetails')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('vendors.registrationNo')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{vendor.business_registration_no || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('vendors.taxId')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{vendor.tax_id || '-'}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Financial Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <CreditCard className="w-5 h-5 text-gray-500" />
                                {t('vendors.financialInfo')}
                            </h3>
                            <dl className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('vendors.paymentTerms')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{vendor.payment_terms || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('vendors.defaultVatRate')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{vendor.default_vat_rate}%</dd>
                                    </div>
                                </div>
                                {vendor.bank_account_number && (
                                    <div className="bg-gray-50 p-3 rounded-lg mt-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('vendors.bankDetails')}</p>
                                        <p className="text-sm font-medium text-gray-900">{vendor.bank_name}</p>
                                        <p className="text-sm text-gray-700">{vendor.bank_account_number}</p>
                                        <p className="text-sm text-gray-600">{vendor.bank_account_name}</p>
                                        {vendor.bank_branch && <p className="text-xs text-gray-500 mt-1">{t('vendors.branch')}: {vendor.bank_branch}</p>}
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Notes */}
                    {vendor.notes && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{t('common.notes')}</h3>
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-800">
                                {vendor.notes}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
