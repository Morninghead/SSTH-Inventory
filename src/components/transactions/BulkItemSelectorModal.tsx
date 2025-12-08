import { useState, useMemo } from 'react'
import { Search, CheckSquare, Square, Package } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'

type Item = Database['public']['Tables']['items']['Row']

interface ItemWithInventory extends Item {
    inventory_status?: Array<{
        quantity: number
    }> | null
}

interface BulkItemSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (selectedItems: ItemWithInventory[]) => void
    items: ItemWithInventory[]
}

export default function BulkItemSelectorModal({
    isOpen,
    onClose,
    onSelect,
    items
}: BulkItemSelectorModalProps) {
    const { t } = useI18n()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items
        const lowerSearch = searchTerm.toLowerCase()
        return items.filter(item =>
            item.item_code.toLowerCase().includes(lowerSearch) ||
            item.description?.toLowerCase().includes(lowerSearch)
        )
    }, [items, searchTerm])

    const handleToggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItemIds)
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId)
        } else {
            newSelected.add(itemId)
        }
        setSelectedItemIds(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedItemIds.size === filteredItems.length) {
            setSelectedItemIds(new Set())
        } else {
            setSelectedItemIds(new Set(filteredItems.map(i => i.item_id)))
        }
    }

    const handleConfirm = () => {
        const selectedItems = items.filter(item => selectedItemIds.has(item.item_id))
        onSelect(selectedItems)
        onClose()
        setSelectedItemIds(new Set())
        setSearchTerm('')
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('transactions.bulkSelector.title')}>
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl flex flex-col max-h-[80vh]">
                {/* Header & Search */}
                <div className="p-4 border-b border-gray-200 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('transactions.bulkSelector.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                            <span className="font-medium text-gray-900">{selectedItemIds.size}</span> {t('transactions.bulkSelector.itemsSelected', { count: selectedItemIds.size })}
                        </div>
                        <button
                            onClick={handleSelectAll}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {selectedItemIds.size === filteredItems.length ? t('transactions.bulkSelector.deselectAll') : t('transactions.bulkSelector.selectAll')}
                        </button>
                    </div>
                </div>

                {/* Item List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>{t('transactions.bulkSelector.noItemsFound', { searchTerm })}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredItems.map((item) => {
                                const isSelected = selectedItemIds.has(item.item_id)
                                const stock = item.inventory_status?.[0]?.quantity || 0
                                const isOutOfStock = stock <= 0

                                return (
                                    <div
                                        key={item.item_id}
                                        onClick={() => !isOutOfStock && handleToggleItem(item.item_id)}
                                        className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'}
                      ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
                    `}
                                    >
                                        <div className="flex-shrink-0 mr-4">
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate">{item.item_code}</p>
                                                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {stock} {item.base_uom}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{t('transactions.bulkSelector.available')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        {t('transactions.bulkSelector.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedItemIds.size === 0}
                    >
                        {t('transactions.bulkSelector.addItems', { count: selectedItemIds.size })}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
