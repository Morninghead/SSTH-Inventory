import { useState, useEffect } from 'react'
import { X, Edit2, Save, Plus, Trash2, History } from 'lucide-react'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n'

interface PlanDetailModalProps {
    isOpen: boolean
    onClose: () => void
    plan: any | null
    onUpdate: () => void
}

export default function PlanDetailModal({ isOpen, onClose, plan, onUpdate }: PlanDetailModalProps) {
    const { user } = useAuth()
    const { t } = useI18n()
    const [planItems, setPlanItems] = useState<any[]>([])
    const [editMode, setEditMode] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [editHistory, setEditHistory] = useState<any[]>([])

    useEffect(() => {
        if (plan && isOpen) {
            loadPlanItems()
            loadEditHistory()
        }
    }, [plan, isOpen])

    const loadPlanItems = async () => {
        if (!plan) return

        try {
            const { data, error } = await supabase
                .from('department_plan_items')
                .select(`
          *,
          items(item_code, description, base_uom)
        `)
                .eq('plan_id', plan.plan_id)
                .order('created_at', { ascending: true })

            if (error) throw error
            setPlanItems(data || [])
        } catch (error) {
            console.error('Error loading plan items:', error)
        }
    }

    const loadEditHistory = async () => {
        if (!plan) return

        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
          *,
          user_profiles(first_name, last_name)
        `)
                .eq('table_name', 'department_plans')
                .eq('record_id', plan.plan_id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error
            setEditHistory(data || [])
        } catch (error) {
            console.error('Error loading edit history:', error)
        }
    }

    const updateQuantity = (itemId: string, newQuantity: number) => {
        setPlanItems(planItems.map(item =>
            item.plan_item_id === itemId ? { ...item, planned_quantity: newQuantity } : item
        ))
    }

    const updateNotes = (itemId: string, newNotes: string) => {
        setPlanItems(planItems.map(item =>
            item.plan_item_id === itemId ? { ...item, notes: newNotes } : item
        ))
    }

    const removeItem = (itemId: string) => {
        setPlanItems(planItems.filter(item => item.plan_item_id !== itemId))
    }

    const saveChanges = async () => {
        if (!plan) return

        try {
            setLoading(true)

            for (const item of planItems) {
                const { error } = await supabase
                    .from('department_plan_items')
                    .update({
                        planned_quantity: item.planned_quantity,
                        notes: item.notes
                    })
                    .eq('plan_item_id', item.plan_item_id)

                if (error) throw error
            }

            await supabase.from('audit_logs').insert({
                table_name: 'department_plans',
                record_id: plan.plan_id,
                action: 'UPDATE',
                user_id: user?.id,
                changes: { items_updated: planItems.length }
            })

            alert(t('planning.updateSuccess'))
            setEditMode(false)
            onUpdate()
            loadEditHistory()
        } catch (error: any) {
            console.error('Error saving changes:', error)
            alert(t('planning.saveError') + error.message)
        } finally {
            setLoading(false)
        }
    }

    const deletePlan = async () => {
        if (!plan) return

        const getMonthName = (month: number) => {
            const date = new Date(2000, month - 1);
            const monthKey = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
            return t(`months.${monthKey}`);
        }

        const confirmDelete = window.confirm(
            t('planning.confirmDelete', {
                department: plan.departments?.dept_name || t('common.unknown'),
                month: getMonthName(plan.month),
                year: plan.year
            })
        )

        if (!confirmDelete) return

        try {
            setLoading(true)

            // Delete plan items first (foreign key constraint)
            const { error: itemsError } = await supabase
                .from('department_plan_items')
                .delete()
                .eq('plan_id', plan.plan_id)

            if (itemsError) throw itemsError

            // Delete the plan
            const { error: planError } = await supabase
                .from('department_plans')
                .delete()
                .eq('plan_id', plan.plan_id)

            if (planError) throw planError

            // Log the deletion
            await supabase.from('audit_logs').insert({
                table_name: 'department_plans',
                record_id: plan.plan_id,
                action: 'DELETE',
                user_id: user?.id,
                changes: {
                    department: plan.departments?.dept_name,
                    month: plan.month,
                    year: plan.year
                }
            })

            alert(t('planning.deleteSuccess'))
            onUpdate()
            onClose()
        } catch (error: any) {
            console.error('Error deleting plan:', error)
            alert(t('planning.deleteError') + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Check if current user can delete (creator or admin)
    const canDelete = () => {
        if (!user || !plan) return false

        // Check if user is the creator
        if (plan.created_by === user.id) return true

        // Check if user is admin
        return user.user_metadata?.role === 'admin' || user.role === 'admin'
    }

    if (!isOpen || !plan) return null

    const getMonthName = (month: number) => {
        const date = new Date(2000, month - 1);
        const monthKey = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        return t(`months.${monthKey}`);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Enhanced Header - Department Name First */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-bold text-white">
                                    {plan.departments?.dept_name || t('common.unknown')}
                                </h2>
                                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-sm font-medium">
                                    {t('planning.monthlyPlan')}
                                </span>
                            </div>
                            <p className="text-xl text-blue-100 mb-1">
                                {getMonthName(plan.month)} {plan.year}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-blue-200">
                                <span>{t('common.created')}: {new Date(plan.created_at).toLocaleDateString()}</span>
                                {plan.updated_at && plan.updated_at !== plan.created_at && (
                                    <span>• {t('common.updated')}: {new Date(plan.updated_at).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                                {planItems.length} {t('planning.itemsInPlan')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {canDelete() && !editMode && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deletePlan}
                                    disabled={loading}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t('planning.deletePlan')}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <History className="w-4 h-4 mr-2" />
                                {showHistory ? t('planning.hideHistory') : t('planning.showHistory')}
                            </Button>
                            {!editMode ? (
                                <Button
                                    size="sm"
                                    onClick={() => setEditMode(true)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    {t('planning.editPlan')}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditMode(false)
                                            loadPlanItems()
                                        }}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={saveChanges}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-green-600 to-green-700"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? t('purchasing.poForm.saving') : t('planning.saveChanges')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {showHistory ? (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('planning.editHistory')}</h3>
                            {editHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {t('planning.noEditHistory')}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {editHistory.map((log) => (
                                        <div key={log.log_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {log.action} {t('planning.by')} {log.user_profiles?.first_name} {log.user_profiles?.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {log.changes && (
                                                    <div className="text-sm text-gray-600">
                                                        {JSON.stringify(log.changes)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : planItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-lg">{t('planning.noItems')}</p>
                                    {editMode && (
                                        <Button size="sm" className="mt-4">
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t('common.add')}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    {t('planning.itemCode')}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    {t('common.description')}
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    {t('planning.plannedQuantity')}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    {t('common.notes')}
                                                </th>
                                                {editMode && (
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        {t('common.actions')}
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {planItems.map((item, index) => (
                                                <tr
                                                    key={item.plan_item_id}
                                                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                >
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                        {item.items?.item_code}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-700">
                                                        {item.items?.description}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-right">
                                                        {editMode ? (
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.planned_quantity}
                                                                onChange={(e) => updateQuantity(item.plan_item_id, parseFloat(e.target.value) || 0)}
                                                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-gray-900">
                                                                {item.planned_quantity}
                                                            </span>
                                                        )}
                                                        <span className="ml-2 text-gray-600">{item.items?.base_uom}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={item.notes || ''}
                                                                onChange={(e) => updateNotes(item.plan_item_id, e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                                placeholder={t('planning.addNotes')}
                                                            />
                                                        ) : (
                                                            item.notes || '-'
                                                        )}
                                                    </td>
                                                    {editMode && (
                                                        <td className="px-4 py-4 text-center">
                                                            <button
                                                                onClick={() => removeItem(item.plan_item_id)}
                                                                className="text-red-600 hover:bg-red-50 rounded p-2 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
