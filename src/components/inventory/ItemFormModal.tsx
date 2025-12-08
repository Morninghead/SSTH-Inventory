import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useI18n } from '../../i18n/I18nProvider'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  item?: Item | null
}

export default function ItemFormModal({ isOpen, onClose, onSuccess, item }: ItemFormModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    item_code: '',
    description: '',
    category_id: '',
    base_uom: 'PCS',
    unit_cost: '',
    reorder_level: '',
    image_url: '',
    image_path: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      if (item) {
        // Edit mode - populate form
        setFormData({
          item_code: item.item_code || '',
          description: item.description || '',
          category_id: item.category_id || '',
          base_uom: item.base_uom || 'PCS',
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
          category_id: '',
          base_uom: 'PCS',
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
        category_id: formData.category_id || null,
        base_uom: formData.base_uom,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
        image_url: imageData.image_url || null,
        image_path: imageData.image_path || null,
        is_active: true,
        created_by: 'system', // Add required created_by field
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('inventory.itemCode')}
            name="item_code"
            value={formData.item_code}
            onChange={handleChange}
            required
            placeholder={t('inventory.placeholders.itemCode')}
            disabled={!!item} // Can't change item code when editing
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

        <Input
          label={t('inventory.description')}
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder={t('inventory.placeholders.description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('inventory.baseUom')}
            name="base_uom"
            value={formData.base_uom}
            onChange={handleChange}
            required
            placeholder={t('inventory.placeholders.baseUom')}
          />

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

        {/* Image Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('inventory.itemImage')}
          </label>

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt={t('inventory.placeholders.itemPreview')}
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title={t('inventory.actions.removeImage')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">{t('inventory.actions.clickToUpload')}</span> {t('common.or')} {t('inventory.actions.dragAndDrop')}
                  </p>
                  <p className="text-xs text-gray-500">{t('inventory.imageUploadInfo')}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading || uploadingImage}
                />
              </label>
            </div>
          )}

          {uploadingImage && (
            <p className="text-sm text-blue-600 flex items-center gap-2">
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
    </Modal>
  )
}
