import { useState } from 'react'
import { Upload, X, CheckCircle, XCircle, Loader, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'

interface ImportResult {
    total: number
    successful: number
    failed: number
    details: {
        successful: string[]
        failed: { po_number: string; error: string }[]
    }
}

interface ImportPOModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function ImportPOModal({ isOpen, onClose, onSuccess }: ImportPOModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            // Validate file type
            if (!selectedFile.name.endsWith('.xlsx')) {
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
            // Get auth token
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                throw new Error('Not authenticated')
            }

            // Read file as array buffer
            const fileBuffer = await file.arrayBuffer()
            const blob = new Blob([fileBuffer])

            // Create form data
            const formData = new FormData()
            formData.append('file', blob, file.name)

            // Call the import function
            const response = await fetch('/.netlify/functions/import-po-excel', {
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

            if (data.successful > 0) {
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
        // PO Number format: DEPT-YYMMXXX (e.g., ADMIN-2601001 = Admin dept, Jan 2026, PO #001)
        const templateData = [
            ['PO No.', 'Date Open PO', 'Vendor', 'Invoice No.', 'Invoice Issue', 'Item', 'Quantity', 'UOM', 'Price/Unit', 'Gross'],
            ['ADMIN-2601001', '15-Jan-26', 'ABC Supplies Co.', 'INV-001', '20-Jan-26', 'Office Paper A4', 100, 'REAM', 150, 15000],
            ['ADMIN-2601001', '15-Jan-26', 'ABC Supplies Co.', 'INV-001', '20-Jan-26', 'Ballpoint Pens', 50, 'BOX', 120, 6000],
            ['HR-2601001', '16-Jan-26', 'XYZ Trading Ltd.', 'INV-002', '22-Jan-26', 'Cleaning Solution', 20, 'BOTTLE', 85, 1700],
        ]

        const ws = XLSX.utils.aoa_to_sheet(templateData)

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 15 },  // PO No.
            { wch: 14 },  // Date Open PO
            { wch: 22 },  // Vendor
            { wch: 14 },  // Invoice No.
            { wch: 14 },  // Invoice Issue
            { wch: 25 },  // Item
            { wch: 10 },  // Quantity
            { wch: 10 },  // UOM
            { wch: 12 },  // Price/Unit
            { wch: 12 }   // Gross
        ]

        XLSX.utils.book_append_sheet(wb, ws, 'PO Import')

        // Generate and download the file
        XLSX.writeFile(wb, 'po_import_template.xlsx')
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Purchase Orders">
            <div className="space-y-4">
                {/* File Upload Section */}
                {!result && (
                    <>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                    Choose Excel file
                                </span>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            <p className="text-sm text-gray-500 mt-2">
                                or drag and drop your .xlsx file here
                            </p>
                        </div>

                        {file && (
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Upload className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
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

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 font-medium mb-2">📋 Import Instructions:</p>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>Upload .xlsx file with PO data</li>
                                <li>Items will be auto-created if they don't exist</li>
                                <li>Vendors will be auto-created if they don't exist</li>
                                <li>Multiple rows with same PO No. will be grouped as line items</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-800 font-medium mb-2">📊 Required Excel Columns:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">PO No.*</span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">Item*</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Date Open PO</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Vendor</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Invoice No.</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Invoice Issue</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Quantity</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">UOM</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Price/Unit</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-mono">Gross</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">* Required fields</p>
                        </div>

                        <Button variant="outline" onClick={downloadTemplate} className="w-full">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                    </>
                )}

                {/* Results Section */}
                {result && (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-semibold text-green-900">Import Completed</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                                    <p className="text-sm text-gray-600">Total POs</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                                    <p className="text-sm text-gray-600">Successful</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                                    <p className="text-sm text-gray-600">Failed</p>
                                </div>
                            </div>
                        </div>

                        {result.details.successful.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">✅ Successfully Imported:</h4>
                                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {result.details.successful.map((poNumber) => (
                                            <span
                                                key={poNumber}
                                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                            >
                                                {poNumber}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {result.details.failed.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">❌ Failed:</h4>
                                <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                    {result.details.failed.map((failure) => (
                                        <div key={failure.po_number} className="text-sm">
                                            <span className="font-medium text-red-900">{failure.po_number}:</span>{' '}
                                            <span className="text-red-700">{failure.error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Import
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>
                            Close
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    )
}
