import { useState, useEffect } from 'react'
import { Package, Plus, Trash2, Save, X, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import {
  getAllUOMs,
  getItemUOMConversions,
  upsertUOMConversion,
  deleteUOMConversion,
  formatQuantityWithUOM,
  validateUOMChain
} from '../../utils/uomHelpers'
import type { Database } from '../../types/database.types'

type UOM = Database['public']['Tables']['uom']['Row']
type UOMConversion = Database['public']['Tables']['uom_conversions']['Row']
type Item = Database['public']['Tables']['items']['Row']

interface UOMManagementModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item | null
}

interface ConversionFormData {
  from_uom: string
  to_uom: string
  conversion_factor: string
}

export default function UOMManagementModal({ isOpen, onClose, item }: UOMManagementModalProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uoms, setUoms] = useState<UOM[]>([])
  const [conversions, setConversions] = useState<UOMConversion[]>([])
  const [conversionForm, setConversionForm] = useState<ConversionFormData>({
    from_uom: '',
    to_uom: '',
    conversion_factor: ''
  })
  const [editingConversion, setEditingConversion] = useState<UOMConversion | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Check if user can manage UOMs
  const canManageUOMs = profile?.role === 'admin' || profile?.role === 'developer'

  useEffect(() => {
    if (isOpen && item) {
      loadData()
    }
  }, [isOpen, item])

  const loadData = async () => {
    if (!item) return

    try {
      setLoading(true)
      const [uomsData, conversionsData] = await Promise.all([
        getAllUOMs(),
        getItemUOMConversions(item.item_id)
      ])

      setUoms(uomsData)
      setConversions(conversionsData)
    } catch (error) {
      console.error('Error loading UOM data:', error)
      setError('Failed to load UOM data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConversion = async () => {
    if (!item) return

    // Validation
    if (!conversionForm.from_uom || !conversionForm.to_uom || !conversionForm.conversion_factor) {
      setError('Please fill all fields')
      return
    }

    if (conversionForm.from_uom === conversionForm.to_uom) {
      setError('From UOM and To UOM cannot be the same')
      return
    }

    const factor = parseFloat(conversionForm.conversion_factor)
    if (isNaN(factor) || factor <= 0) {
      setError('Conversion factor must be a positive number')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (editingConversion) {
        // Update existing conversion
        await supabase
          .from('uom_conversions')
          .update({
            from_uom: conversionForm.from_uom,
            to_uom: conversionForm.to_uom,
            conversion_factor: factor
          })
          .eq('conversion_id', editingConversion.conversion_id)
      } else {
        // Create new conversion
        await upsertUOMConversion(
          item.item_id,
          conversionForm.from_uom,
          conversionForm.to_uom,
          factor
        )
      }

      // Reset form
      setConversionForm({ from_uom: '', to_uom: '', conversion_factor: '' })
      setEditingConversion(null)

      // Reload data
      await loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to save conversion')
    } finally {
      setSaving(false)
    }
  }

  const handleEditConversion = (conversion: UOMConversion) => {
    setEditingConversion(conversion)
    setConversionForm({
      from_uom: conversion.from_uom,
      to_uom: conversion.to_uom,
      conversion_factor: conversion.conversion_factor.toString()
    })
  }

  const handleDeleteConversion = async (conversion: UOMConversion) => {
    if (!item || !confirm('Are you sure you want to delete this conversion?')) return

    try {
      await supabase
        .from('uom_conversions')
        .delete()
        .eq('conversion_id', conversion.conversion_id)

      await loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to delete conversion')
    }
  }

  const handleCancelEdit = () => {
    setEditingConversion(null)
    setConversionForm({ from_uom: '', to_uom: '', conversion_factor: '' })
  }

  const getUOMDescription = (uomCode: string) => {
    const uom = uoms.find(u => u.uom_code === uomCode)
    return uom ? uom.description : uomCode
  }

  const getConversionDescription = (conversion: UOMConversion) => {
    const fromDesc = getUOMDescription(conversion.from_uom)
    const toDesc = getUOMDescription(conversion.to_uom)
    return `1 ${fromDesc} = ${conversion.conversion_factor} ${toDesc}`
  }

  // Group conversions by type (global vs item-specific)
  const globalConversions = conversions.filter(c => c.item_id === null)
  const itemConversions = conversions.filter(c => c.item_id === item?.item_id)

  if (!canManageUOMs) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied">
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600">You don't have permission to manage UOM settings.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`UOM Management - ${item?.item_code}`}>
      <div className="p-6">
        {/* Item Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{item?.description}</h3>
          <p className="text-sm text-gray-600">
            Current Base UOM: <span className="font-medium">{item?.base_uom}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Add/Edit Conversion Form */}
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <h4 className="font-medium text-gray-900 mb-3">
            {editingConversion ? 'Edit Conversion' : 'Add New Conversion'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From UOM
              </label>
              <select
                value={conversionForm.from_uom}
                onChange={(e) => setConversionForm(prev => ({ ...prev, from_uom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={!canManageUOMs}
              >
                <option value="">Select UOM</option>
                {uoms.map(uom => (
                  <option key={uom.uom_code} value={uom.uom_code}>
                    {uom.uom_code} - {uom.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To UOM
              </label>
              <select
                value={conversionForm.to_uom}
                onChange={(e) => setConversionForm(prev => ({ ...prev, to_uom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={!canManageUOMs}
              >
                <option value="">Select UOM</option>
                {uoms.map(uom => (
                  <option key={uom.uom_code} value={uom.uom_code}>
                    {uom.uom_code} - {uom.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conversion Factor
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="e.g., 12"
                value={conversionForm.conversion_factor}
                onChange={(e) => setConversionForm(prev => ({ ...prev, conversion_factor: e.target.value }))}
                disabled={!canManageUOMs}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleSaveConversion}
                disabled={saving || !canManageUOMs}
                loading={saving}
                size="sm"
              >
                <Save className="w-4 h-4 mr-1" />
                {editingConversion ? 'Update' : 'Add'}
              </Button>
              {editingConversion && (
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
          {conversionForm.from_uom && conversionForm.to_uom && conversionForm.conversion_factor && (
            <p className="mt-2 text-sm text-gray-600">
              1 {getUOMDescription(conversionForm.from_uom)} = {conversionForm.conversion_factor} {getUOMDescription(conversionForm.to_uom)}
            </p>
          )}
        </div>

        {/* Item-Specific Conversions */}
        {itemConversions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Item-Specific Conversions
            </h4>
            <div className="space-y-2">
              {itemConversions.map(conversion => (
                <div
                  key={conversion.conversion_id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded"
                >
                  <span className="text-sm">
                    {getConversionDescription(conversion)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditConversion(conversion)}
                      variant="outline"
                      size="sm"
                      disabled={!canManageUOMs}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteConversion(conversion)}
                      variant="danger"
                      size="sm"
                      disabled={!canManageUOMs}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Conversions */}
        {globalConversions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Global Conversions (Available to all items)</h4>
            <div className="space-y-2">
              {globalConversions.map(conversion => (
                <div
                  key={conversion.conversion_id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                >
                  <span className="text-sm text-gray-700">
                    {getConversionDescription(conversion)}
                  </span>
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                    Global
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading UOM data...</p>
          </div>
        )}

        {!loading && conversions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="mx-auto h-12 w-12 mb-3 text-gray-300" />
            <p>No conversions defined for this item</p>
            <p className="text-sm">Add a conversion above to enable multi-level UOM support</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}