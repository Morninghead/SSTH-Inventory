import { useState } from 'react'
import { Upload, X, CheckCircle, XCircle, Loader, FileSpreadsheet } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'

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
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && !selectedFile.name.toLowerCase().endsWith('.xls')) {
                setError('Please select an Excel file (.xlsx)')
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
            const blob = new Blob([fileBuffer])

            const formData = new FormData()
            formData.append('file', blob, file.name)

            const response = await fetch('/.netlify/functions/import-items-excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
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
        const templateContent = `Item Code\tDescription\tCategory\tUOM\tUnit Cost\tReorder Level
ITEM-001\tSample Item 1\tGeneral\tPCS\t100\t10
ITEM-002\tSample Item 2\tCleaning\tBOX\t250\t5
ITEM-003\tSample Item 3\tOffice Supplies\tEA\t50\t20`

        const blob = new Blob([templateContent], { type: 'text/tab-separated-values' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'inventory_import_template.tsv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Inventory Items" size="lg">
            <div className="space-y-4">
                {!result && (
                    <>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <label htmlFor="item-file-upload" className="cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                    Choose Excel file
                                </span>
                                <input
                                    id="item-file-upload"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-sm text-gray-500 mt-2">
                                Excel file (.xlsx) only
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
                            <p className="text-sm text-blue-800 font-medium mb-2">📋 Import Instructions:</p>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>Upload .xlsx file with item data</li>
                                <li>Categories will be auto-created if they don't exist</li>
                                <li>Existing items (same Item Code) will be updated</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-800 font-medium mb-2">📊 Required Excel Columns:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">Item Code*</span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">Description*</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Category</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">UOM</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Unit Cost</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Reorder Level</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">* Required fields</p>
                        </div>

                        <Button variant="outline" onClick={downloadTemplate} className="w-full">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                    </>
                )}

                {result && (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-semibold text-green-900">Import Completed</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{result.created}</p>
                                    <p className="text-sm text-gray-600">Created</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                                    <p className="text-sm text-gray-600">Updated</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                                    <p className="text-sm text-gray-600">Skipped</p>
                                </div>
                            </div>
                        </div>

                        {result.details.created.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">✅ Created:</h4>
                                <div className="bg-gray-50 rounded-lg p-3 max-h-24 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {result.details.created.slice(0, 20).map((code) => (
                                            <span key={code} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                {code}
                                            </span>
                                        ))}
                                        {result.details.created.length > 20 && (
                                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                                +{result.details.created.length - 20} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {result.details.skipped.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">⚠️ Skipped:</h4>
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
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading ? (
                                    <><Loader className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                                ) : (
                                    <><Upload className="w-4 h-4 mr-2" />Import</>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Close</Button>
                    )}
                </div>
            </div>
        </Modal>
    )
}
