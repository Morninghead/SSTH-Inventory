import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Package } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useI18n } from '../../i18n/I18nProvider'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Category = Database['public']['Tables']['categories']['Row']

// Temporary type for UOM until database is updated
type UOM = {
  uom_code: string
  description: string
  is_base_uom: boolean
  category: string
}

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  item?: Item | null
}

import UOMManagementModal from './UOMManagementModal'

export default function ItemFormModal({ isOpen, onClose, onSuccess, item }: ItemFormModalProps) {
  const { t } = useI18n()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [uoms, setUoms] = useState<UOM[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showUOMManagement, setShowUOMManagement] = useState(false)

  const [formData, setFormData] = useState({
    item_code: '',
    description: '',
    description_th: '',
    category_id: '',
    base_uom: 'PCS',
    ordering_uom: '',
    outermost_uom: '',
    unit_cost: '',
    reorder_level: '',
    image_url: '',
    image_path: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      loadUOMs()
      if (item) {
        // Edit mode - populate form
        setFormData({
          item_code: item.item_code || '',
          description: item.description || '',
          description_th: item.description_th || '',
          category_id: item.category_id || '',
          base_uom: item.base_uom || 'PCS',
          ordering_uom: (item as any).ordering_uom || '',
          outermost_uom: (item as any).outermost_uom || '',
          unit_cost: item.unit_cost?.toString() || '',
          reorder_level: item.reorder_level?.toString() || '',
          image_url: item.image_url || '',
          image_path: item.image_path || '',
        })
        setImagePreview(item.image_url || null)
        setImageFile(null)
      } else {
        // Create mode - reset form
        setFormData({
          item_code: '',
          description: '',
          description_th: '',
          category_id: '',
          base_uom: 'PCS',
          ordering_uom: '',
          outermost_uom: '',
          unit_cost: '',
          reorder_level: '',
          image_url: '',
          image_path: '',
        })
        setImagePreview(null)
        setImageFile(null)
      }
      setError('')
    }
  }, [isOpen, item])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadUOMs = async () => {
    try {
      // Comprehensive real-world UOMs for hotel/hospitality inventory
      const hardcodedUOMs: UOM[] = [
        // === GENERAL / COUNT ===
        { uom_code: 'EA', description: 'Each', is_base_uom: true, category: 'GENERAL' },
        { uom_code: 'PCS', description: 'Pieces', is_base_uom: true, category: 'GENERAL' },
        { uom_code: 'UNIT', description: 'Unit', is_base_uom: true, category: 'GENERAL' },
        { uom_code: 'PR', description: 'Pair', is_base_uom: false, category: 'GENERAL' },
        { uom_code: 'SET', description: 'Set', is_base_uom: false, category: 'GENERAL' },
        { uom_code: 'KIT', description: 'Kit', is_base_uom: false, category: 'GENERAL' },
        { uom_code: 'DOZ', description: 'Dozen', is_base_uom: false, category: 'GENERAL' },
        // === PACKAGING ===
        { uom_code: 'BOX', description: 'Box', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'PACK', description: 'Pack', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'CASE', description: 'Case', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'CTN', description: 'Carton', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'PALLET', description: 'Pallet', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'BAG', description: 'Bag', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'SACK', description: 'Sack', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'BUNDLE', description: 'Bundle', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'TRAY', description: 'Tray', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'DRUM', description: 'Drum', is_base_uom: false, category: 'PACKAGING' },
        { uom_code: 'PAIL', description: 'Pail', is_base_uom: false, category: 'PACKAGING' },
        // === CONTAINERS ===
        { uom_code: 'BOTTLE', description: 'Bottle', is_base_uom: false, category: 'CONTAINER' },
        { uom_code: 'CAN', description: 'Can', is_base_uom: false, category: 'CONTAINER' },
        { uom_code: 'JAR', description: 'Jar', is_base_uom: false, category: 'CONTAINER' },
        { uom_code: 'TUB', description: 'Tub', is_base_uom: false, category: 'CONTAINER' },
        { uom_code: 'TUBE', description: 'Tube', is_base_uom: false, category: 'CONTAINER' },
        { uom_code: 'TANK', description: 'Tank', is_base_uom: false, category: 'CONTAINER' },
        { uom_code: 'SACHET', description: 'Sachet', is_base_uom: false, category: 'CONTAINER' },
        // === ROLL / SHEET / PAPER ===
        { uom_code: 'ROLL', description: 'Roll', is_base_uom: false, category: 'PAPER' },
        { uom_code: 'REAM', description: 'Ream (500 sheets)', is_base_uom: false, category: 'PAPER' },
        { uom_code: 'SHEET', description: 'Sheet', is_base_uom: true, category: 'PAPER' },
        { uom_code: 'PAD', description: 'Pad', is_base_uom: false, category: 'PAPER' },
        // === WEIGHT ===
        { uom_code: 'G', description: 'Gram', is_base_uom: true, category: 'WEIGHT' },
        { uom_code: 'KG', description: 'Kilogram', is_base_uom: false, category: 'WEIGHT' },
        { uom_code: 'LB', description: 'Pound', is_base_uom: false, category: 'WEIGHT' },
        { uom_code: 'OZ', description: 'Ounce', is_base_uom: false, category: 'WEIGHT' },
        { uom_code: 'TON', description: 'Metric Ton', is_base_uom: false, category: 'WEIGHT' },
        // === VOLUME / LIQUID ===
        { uom_code: 'ML', description: 'Milliliter', is_base_uom: true, category: 'VOLUME' },
        { uom_code: 'L', description: 'Liter', is_base_uom: false, category: 'VOLUME' },
        { uom_code: 'GAL', description: 'Gallon', is_base_uom: false, category: 'VOLUME' },
        { uom_code: 'FL_OZ', description: 'Fluid Ounce', is_base_uom: false, category: 'VOLUME' },
        { uom_code: 'CC', description: 'Cubic Centimeter', is_base_uom: false, category: 'VOLUME' },
        // === LENGTH ===
        { uom_code: 'M', description: 'Meter', is_base_uom: false, category: 'LENGTH' },
        { uom_code: 'CM', description: 'Centimeter', is_base_uom: true, category: 'LENGTH' },
        { uom_code: 'MM', description: 'Millimeter', is_base_uom: true, category: 'LENGTH' },
        { uom_code: 'FT', description: 'Feet', is_base_uom: false, category: 'LENGTH' },
        { uom_code: 'IN', description: 'Inch', is_base_uom: false, category: 'LENGTH' },
        { uom_code: 'YD', description: 'Yard', is_base_uom: false, category: 'LENGTH' },
        // === AREA ===
        { uom_code: 'SQM', description: 'Square Meter', is_base_uom: false, category: 'AREA' },
        { uom_code: 'SQFT', description: 'Square Feet', is_base_uom: false, category: 'AREA' },
        // === TIME ===
        { uom_code: 'HR', description: 'Hour', is_base_uom: false, category: 'TIME' },
        { uom_code: 'DAY', description: 'Day', is_base_uom: false, category: 'TIME' },
        { uom_code: 'MTH', description: 'Month', is_base_uom: false, category: 'TIME' },
        // === F&B / HOTEL ===
        { uom_code: 'PORTION', description: 'Portion', is_base_uom: false, category: 'FNB' },
        { uom_code: 'SERVING', description: 'Serving', is_base_uom: false, category: 'FNB' },
        { uom_code: 'SLICE', description: 'Slice', is_base_uom: false, category: 'FNB' },
        { uom_code: 'LOAF', description: 'Loaf', is_base_uom: false, category: 'FNB' },
        { uom_code: 'BLOCK', description: 'Block', is_base_uom: false, category: 'FNB' },
      ]
      setUoms(hardcodedUOMs)
    } catch (err) {
      console.error('Error loading UOMs:', err)
    }
  }

  const uploadImage = async (): Promise<{ url: string; path: string } | null> => {
    if (!imageFile) return null

    try {
      setUploadingImage(true)

      // Create unique filename
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${formData.item_code}-${Date.now()}.${fileExt}`
      const filePath = `items/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('inventory-items')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('inventory-items')
        .getPublicUrl(filePath)

      return {
        url: data.publicUrl,
        path: filePath
      }
    } catch (err: any) {
      console.error('Error uploading image:', err)

      // Provide user-friendly error messages
      if (err.message?.includes('Bucket not found')) {
        throw new Error(t('inventory.errors.storageBucketNotFound'))
      } else if (err.message?.includes('Invalid key')) {
        throw new Error(t('inventory.errors.invalidImageFile'))
      } else if (err.message?.includes('too large')) {
        throw new Error(t('inventory.errors.imageTooLarge'))
      } else {
        throw new Error(`${t('inventory.errors.imageUploadFailed')}: ${err.message || t('common.unknownError')}`)
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Upload image if new file selected
      let imageData = {
        image_url: formData.image_url,
        image_path: formData.image_path
      }

      if (imageFile) {
        // Delete old image if exists (only on edit)
        if (item?.image_path) {
          await supabase.storage
            .from('inventory-items')
            .remove([item.image_path])
        }

        const uploadResult = await uploadImage()
        if (uploadResult) {
          imageData = {
            image_url: uploadResult.url,
            image_path: uploadResult.path
          }
        }
      }

      const itemData = {
        item_code: formData.item_code.trim(),
        description: formData.description.trim(),
        description_th: formData.description_th?.trim() || null,
        category_id: formData.category_id, // Required field
        base_uom: formData.base_uom,
        ordering_uom: formData.ordering_uom || null,
        outermost_uom: formData.outermost_uom || null,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
        image_url: imageData.image_url || null,
        image_path: imageData.image_path || null,
        is_active: true,
        created_by: user?.id || 'system'
      }

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('item_id', item.item_id)

        if (error) throw error
      } else {
        // Create new item
        // Note: inventory_status record is auto-created by database trigger
        const { error: insertError } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single()

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || t('common.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('inventory.errors.selectImageFile'))
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('inventory.errors.imageSizeLimit'))
        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({
      ...formData,
      image_url: '',
      image_path: ''
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t('inventory.editItem') : t('inventory.addItem')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* === ROW 1: Item Code + Category === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('inventory.itemCode')}
            name="item_code"
            value={formData.item_code}
            onChange={handleChange}
            required
            placeholder={t('inventory.placeholders.itemCode')}
            disabled={!!item}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('inventory.category')}
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('inventory.placeholders.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* === ROW 2: Description === */}
        <Input
          label={t('inventory.description')} // English Description
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder={t('inventory.placeholders.description')}
        />

        {/* Thai Description */}
        <Input
          label={`${t('inventory.description')} (TH)`} // Thai Description Label
          name="description_th"
          value={formData.description_th}
          onChange={handleChange}
          placeholder="คำอธิบายสินค้า (ไทย)"
        />

        {/* === ROW 3: UOM Section === */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">📦 {t('inventory.uomSection')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Base UOM */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('inventory.baseUom')} <span className="text-red-500">*</span>
              </label>
              <select
                name="base_uom"
                value={formData.base_uom}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">{t('inventory.selectUom')}</option>
                {uoms.map((uom) => (
                  <option key={uom.uom_code} value={uom.uom_code}>
                    {uom.uom_code} - {uom.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-0.5">{t('inventory.uomHintBase')}</p>
            </div>

            {/* Ordering UOM */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('inventory.orderingUom')}
              </label>
              <select
                name="ordering_uom"
                value={formData.ordering_uom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">{t('inventory.sameAsBase')}</option>
                {uoms.map((uom) => (
                  <option key={uom.uom_code} value={uom.uom_code}>
                    {uom.uom_code} - {uom.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-0.5">{t('inventory.uomHintOrdering')}</p>
            </div>

            {/* Outermost UOM */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('inventory.outermostUom')}
              </label>
              <select
                name="outermost_uom"
                value={formData.outermost_uom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">{t('inventory.noneUom')}</option>
                {uoms.map((uom) => (
                  <option key={uom.uom_code} value={uom.uom_code}>
                    {uom.uom_code} - {uom.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-0.5">{t('inventory.uomHintOutermost')}</p>
            </div>
          </div>

          {item && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUOMManagement(true)}
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Package className="w-4 h-4 mr-2" />
                จัดการอัตราส่วนหน่วยนับ (UOM Conversions)
              </Button>
            </div>
          )}
        </div>

        {/* === ROW 4: Unit Cost + Reorder Level === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('inventory.unitCost')}
            name="unit_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost}
            onChange={handleChange}
            placeholder={t('inventory.placeholders.unitCost')}
          />

          <Input
            label={t('inventory.reorderLevel')}
            name="reorder_level"
            type="number"
            step="1"
            min="0"
            value={formData.reorder_level}
            onChange={handleChange}
            placeholder={t('inventory.placeholders.reorderLevel')}
          />
        </div>

        {/* === ROW 5: Image Upload (Compact) === */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('inventory.itemImage')}
          </label>

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt={t('inventory.placeholders.itemPreview')}
                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title={t('inventory.actions.removeImage')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <ImageIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">{t('inventory.actions.clickToUpload')}</span> {t('common.or')} {t('inventory.actions.dragAndDrop')}
                </p>
                <p className="text-xs text-gray-400">{t('inventory.imageUploadInfo')}</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading || uploadingImage}
              />
            </label>
          )}

          {uploadingImage && (
            <p className="text-sm text-blue-600 flex items-center gap-2 mt-1">
              <Upload className="w-4 h-4 animate-pulse" />
              {t('inventory.actions.uploadingImage')}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading || uploadingImage}>
            {loading ? t('common.saving') : uploadingImage ? t('inventory.actions.uploadingImage') : item ? t('inventory.actions.updateItem') : t('inventory.actions.createItem')}
          </Button>
        </div>
      </form>

      {item && (
        <UOMManagementModal
          isOpen={showUOMManagement}
          onClose={() => {
            setShowUOMManagement(false)
            loadUOMs() // Reload UOMs in case new ones were added
          }}
          item={item}
        />
      )}
    </Modal>
  )
}
