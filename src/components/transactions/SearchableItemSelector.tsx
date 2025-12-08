import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'

type Item = Database['public']['Tables']['items']['Row']

interface ItemWithInventory extends Item {
  inventory_status?: Array<{
    quantity: number
  }> | null
}

interface SearchableItemSelectorProps {
  items: ItemWithInventory[]
  value: string
  onChange: (itemId: string) => void
  placeholder?: string
  disabled?: boolean
  showStock?: boolean
  className?: string
}

export default function SearchableItemSelector({
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
  showStock = false,
  className = ""
}: SearchableItemSelectorProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<ItemWithInventory | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find selected item when value changes
  useEffect(() => {
    if (value) {
      const item = items.find(i => i.item_id === value)
      setSelectedItem(item || null)
      if (item) {
        setSearchTerm(`${item.item_code} - ${item.description}`)
      }
    } else {
      setSelectedItem(null)
      setSearchTerm('')
    }
  }, [value, items])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter items based on search term with flexible word matching
  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase().trim()

    if (!searchLower) return true

    // Split search term into individual words
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0)

    // Combine item code and description for searching
    const searchableText = `${item.item_code || ''} ${item.description || ''}`.toLowerCase()

    // Check if all search words are found in the item text (in any order)
    return searchWords.every(word => searchableText.includes(word))
  })

  const handleSelect = (item: ItemWithInventory) => {
    setSelectedItem(item)
    onChange(item.item_id)
    setIsOpen(false)
    setSearchTerm(`${item.item_code} - ${item.description}`)
  }

  const handleClear = () => {
    setSelectedItem(null)
    onChange('')
    setSearchTerm('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)

    // If input is cleared, clear selection
    if (!value.trim()) {
      handleClear()
    }
  }

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder || t('transactions.selector.searchPlaceholder')}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
        {selectedItem && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {t('transactions.selector.noItemsFound', { searchTerm })}
            </div>
          ) : (
            <ul className="py-1">
              {filteredItems.map((item) => (
                <li key={item.item_id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {item.item_code}
                        </div>
                        <div className="text-gray-600 truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {t('transactions.selector.uom')}: {item.base_uom || '-'} • {t('transactions.selector.cost')}: ฿{(item.unit_cost || 0).toFixed(2)}
                        </div>
                      </div>
                      {showStock && (
                        <div className="ml-2 text-right">
                          <div className="text-xs text-gray-500">{t('transactions.selector.stock')}</div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.inventory_status?.[0]?.quantity || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}