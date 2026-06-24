import { useState } from 'react'
import { Upload, X, CheckCircle, XCircle, Loader, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n/I18nProvider'

interface ImportResult {
    created: number
    updated: number
    skipped: number
    details: {
        created: string[]
        updated: string[]
        skipped: { item_code: string; reason: string }[]
    }
}

interface ImportItemsModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function ImportItemsModal({ isOpen, onClose, onSuccess }: ImportItemsModalProps) {
    const { t } = useI18n()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
                setError('Please select an Excel file (.xlsx only)')
                return
            }
            setFile(selectedFile)
            setError(null)
            setResult(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first')
            return
        }

        setUploading(true)
        setError(null)
        setResult(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                throw new Error('Not authenticated')
            }

            const fileBuffer = await file.arrayBuffer()
            // Send raw binary instead of FormData, as the function expects raw body for XLSX.read
            // const blob = new Blob([fileBuffer]) 
            // const formData = new FormData()
            // formData.append('file', blob, file.name)

            const response = await fetch('/.netlify/functions/import-items-excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/octet-stream'
                },
                body: fileBuffer // Send raw buffer directly
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Import failed')
            }

            const data = await response.json()
            setResult(data)

            if (data.created > 0 || data.updated > 0) {
                onSuccess()
            }
        } catch (err: any) {
            console.error('Import error:', err)
            setError(err.message || 'Failed to import file')
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setError(null)
        setResult(null)
        onClose()
    }

    const downloadTemplate = () => {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()

        // Template data with headers and sample rows
        // UOM: Base unit for stock tracking (e.g., PCS, EA)
        // Ordering UOM: Default unit for purchase orders (e.g., BOX, CASE)
        // Outermost UOM: Largest packaging unit (e.g., PALLET, CASE)
        const templateData = [
            ['Item Code', 'Description', 'Description (TH)', 'Category', 'UOM', 'Ordering UOM', 'Outermost UOM', 'Unit Cost', 'Reorder Level', 'Quantity'],
            ['OF-001', 'Office Paper A4', 'กระดาษ A4', 'Office Supplies', 'REAM', 'BOX', 'CASE', 150, 50, 100],
            ['CL-001', 'Cleaning Solution 1L', 'น้ำยาทำความสะอาด 1 ลิตร', 'Cleaning', 'BOTTLE', 'CASE', 'PALLET', 85, 20, 50],
            ['OF-002', 'Ballpoint Pens', 'ปากกาลูกลื่น', 'Office Supplies', 'PCS', 'BOX', 'CASE', 15, 100, 200],
            ['GN-001', 'Simple Item', 'สินค้าทั่วไป', 'General', 'EA', '', '', 50, 10, 0]
        ]

        const ws = XLSX.utils.aoa_to_sheet(templateData)

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 15 },  // Item Code
            { wch: 25 },  // Description
            { wch: 30 },  // Description (TH)
            { wch: 18 },  // Category
            { wch: 10 },  // UOM (Base)
            { wch: 14 },  // Ordering UOM
            { wch: 14 },  // Outermost UOM
            { wch: 12 },  // Unit Cost
            { wch: 14 },  // Reorder Level
            { wch: 12 }   // Quantity
        ]

        XLSX.utils.book_append_sheet(wb, ws, 'Items')

        // Generate and download the file
        XLSX.writeFile(wb, 'inventory_import_template.xlsx')
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('inventory.import.title')} size="lg">
            <div className="space-y-4">
                {!result && (
                    <>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <label htmlFor="item-file-upload" className="cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                    {t('inventory.import.chooseExcelFile')}
                                </span>
                                <input
                                    id="item-file-upload"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-sm text-gray-500 mt-2">
                                {t('inventory.import.excelFileOnly')}
                            </p>
                        </div>

                        {file && (
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <FileSpreadsheet className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800 font-medium mb-2">📋 {t('inventory.import.instructions')}:</p>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>{t('inventory.import.instructionUpload')}</li>
                                <li>{t('inventory.import.instructionAutoCreate')}</li>
                                <li>{t('inventory.import.instructionUpdate')}</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-800 font-medium mb-2">📊 {t('inventory.import.excelColumns')}:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">{t('inventory.itemCode')}*</span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">{t('inventory.description')}*</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">{t('inventory.category')}</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">{t('inventory.baseUom')}</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono">{t('inventory.orderingUom')}</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono">{t('inventory.outermostUom')}</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">{t('inventory.unitCost')}</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">{t('inventory.reorderLevel')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">* {t('inventory.import.required')} &nbsp;|&nbsp; <span className="text-blue-600">{t('inventory.import.uomSettings')}</span></p>
                        </div>

                        <Button variant="outline" onClick={downloadTemplate} className="w-full">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            {t('inventory.import.downloadTemplate')}
                        </Button>
                    </>
                )}

                {result && (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-semibold text-green-900">{t('inventory.import.importCompleted')}</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{result.created}</p>
                                    <p className="text-sm text-gray-600">{t('inventory.import.created')}</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                                    <p className="text-sm text-gray-600">{t('inventory.import.updated')}</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                                    <p className="text-sm text-gray-600">{t('inventory.import.skipped')}</p>
                                </div>
                            </div>
                        </div>

                        {result.details.created.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">✅ {t('inventory.import.createdItems')}</h4>
                                <div className="bg-gray-50 rounded-lg p-3 max-h-24 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {result.details.created.slice(0, 20).map((code) => (
                                            <span key={code} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                {code}
                                            </span>
                                        ))}
                                        {result.details.created.length > 20 && (
                                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                                +{result.details.created.length - 20} {t('inventory.import.more')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {result.details.skipped.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">⚠️ {t('inventory.import.skippedItems')}</h4>
                                <div className="bg-amber-50 rounded-lg p-3 max-h-24 overflow-y-auto space-y-1">
                                    {result.details.skipped.slice(0, 10).map((item) => (
                                        <div key={item.item_code} className="text-sm">
                                            <span className="font-medium text-amber-900">{item.item_code}:</span>{' '}
                                            <span className="text-amber-700">{item.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>{t('inventory.import.cancel')}</Button>
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading ? (
                                    <><Loader className="w-4 h-4 mr-2 animate-spin" />{t('inventory.import.importing')}</>
                                ) : (
                                    <><Upload className="w-4 h-4 mr-2" />{t('inventory.import.import')}</>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>{t('inventory.import.close')}</Button>
                    )}
                </div>
            </div>
        </Modal>
    )
}
