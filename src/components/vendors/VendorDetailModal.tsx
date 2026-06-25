import { X, Building2, Phone, MapPin, CreditCard, Star, FileText, Globe, Mail } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'
import VendorItemsManager from './VendorItemsManager'

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
        <Modal isOpen={isOpen} onClose={onClose} title={t('vendors.details')} size="xl">
            <div className="flex flex-col gap-6 -mx-4 sm:-mx-6 -mt-3 sm:-mt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{vendor.vendor_name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-800 dark:text-gray-300">{vendor.vendor_code}</span>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{vendor.vendor_categories?.category_name || t('common.unknown')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        <Button variant="secondary" onClick={() => onEdit(vendor)}>
                            {t('vendors.editVendor')}
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status & Rating */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('common.status')}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                }`}>
                                {vendor.is_active ? t('vendors.active') : t('vendors.inactive')}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('vendors.vatStatus')}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_vat_registered ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                }`}>
                                {vendor.is_vat_registered ? t('vendors.vatRegistered') : t('vendors.notRegistered')}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('vendors.rating')}</p>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= (vendor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                {t('vendors.contactInfo')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.contactPerson')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{vendor.contact_person || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.email')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        {vendor.contact_email ? (
                                            <>
                                                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                <a href={`mailto:${vendor.contact_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    {vendor.contact_email}
                                                </a>
                                            </>
                                        ) : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.phone')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{vendor.contact_phone || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.website')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        {vendor.website ? (
                                            <>
                                                <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                {t('vendors.address')}
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                {t('vendors.businessDetails')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.registrationNo')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{vendor.business_registration_no || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.taxId')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{vendor.tax_id || '-'}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Financial Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                {t('vendors.financialInfo')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.paymentTerms')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{vendor.payment_terms || '-'}</dd>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('vendors.defaultVatRate')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{vendor.default_vat_rate}%</dd>
                                    </div>
                                </div>

                            </dl>
                        </div>
                    </div>

                    {/* Notes */}
                    {vendor.notes && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">{t('common.notes')}</h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/50 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                                {vendor.notes}
                            </div>
                        </div>
                    )}

                    {/* Vendor Items Manager */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <VendorItemsManager supplierId={vendor.vendor_id} />
                    </div>
                </div>
            </div>
        </Modal>
    )
}
