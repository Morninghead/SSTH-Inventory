import { useState, useEffect } from 'react';
import { X, Save, Plus, Search, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';

interface PlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PlanFormModal({ isOpen, onClose, onSuccess }: PlanFormModalProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Form State
    const [selectedDept, setSelectedDept] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [planItems, setPlanItems] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadDepartments();
            loadItems();
            // Reset form
            setSelectedDept('');
            setMonth(new Date().getMonth() + 1);
            setYear(new Date().getFullYear());
            setPlanItems([]);
            setSearchTerm('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchTerm.trim()) {
            const results = items.filter(item =>
                item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(results.slice(0, 5)); // Limit to 5 results
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, items]);

    const loadDepartments = async () => {
        const { data } = await supabase
            .from('departments')
            .select('*')
            .order('dept_name');
        setDepartments(data || []);
    };

    const loadItems = async () => {
        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('is_active', true)
            .order('item_code');
        setItems(data || []);
    };

    const addItem = (item: any) => {
        if (planItems.some(i => i.item_id === item.item_id)) {
            return; // Already added
        }
        setPlanItems([...planItems, {
            item_id: item.item_id,
            item_code: item.item_code,
            description: item.description,
            planned_quantity: 1,
            notes: ''
        }]);
        setSearchTerm('');
    };

    const removeItem = (index: number) => {
        setPlanItems(planItems.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index: number, quantity: number) => {
        const newItems = [...planItems];
        newItems[index].planned_quantity = quantity;
        setPlanItems(newItems);
    };

    const updateItemNotes = (index: number, notes: string) => {
        const newItems = [...planItems];
        newItems[index].notes = notes;
        setPlanItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept) {
            setError(t('planning.selectDepartment')); // Assuming this key exists or use common
            return;
        }
        if (planItems.length === 0) {
            setError(t('planning.addItemsToPlan'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Create Plan
            const { data: planData, error: planError } = await supabase
                .from('department_plans')
                .insert([{
                    department_id: selectedDept,
                    month,
                    year,
                    status: 'ACTIVE',
                    created_by: user?.id
                }])
                .select()
                .single();

            if (planError) throw planError;

            // 2. Create Plan Items
            const itemsToInsert = planItems.map(item => ({
                plan_id: planData.plan_id,
                item_id: item.item_id,
                planned_quantity: item.planned_quantity,
                notes: item.notes
            }));

            const { error: itemsError } = await supabase
                .from('department_plan_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            onSuccess();
        } catch (err: any) {
            console.error('Error creating plan:', err);
            setError(err.message || t('planning.saveError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('planning.createMonthlyPlan')}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                        {t('planning.forecastDescription')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('planning.department')}
                        </label>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">{t('department.selectDepartment')}</option>
                            {departments.map(dept => (
                                <option key={dept.dept_id} value={dept.dept_id}>
                                    {dept.dept_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('planning.month')}
                        </label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>
                                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('planning.year')}
                        </label>
                        <Input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            min={2024}
                            max={2030}
                        />
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('planning.addItemsToPlan')}</h3>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('planning.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map(item => (
                                    <button
                                        key={item.item_id}
                                        type="button"
                                        onClick={() => addItem(item)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                                    >
                                        <div>
                                            <span className="font-medium text-gray-900">{item.item_code}</span>
                                            <span className="text-gray-500 text-sm ml-2">{item.description}</span>
                                        </div>
                                        <Plus className="w-4 h-4 text-blue-600" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {planItems.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">{t('planning.selectedItems')} ({planItems.length})</h4>
                            {planItems.map((item, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-start gap-4">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{item.item_code}</div>
                                        <div className="text-sm text-gray-500">{item.description}</div>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('planning.plannedQuantity')}</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.planned_quantity}
                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="w-48">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('planning.notesOptional')}</label>
                                        <Input
                                            value={item.notes}
                                            onChange={(e) => updateItemNotes(index, e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder={t('planning.addNotes')}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="mt-6 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            {t('planning.noItemsAdded')}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose} type="button">
                        <X className="w-4 h-4 mr-2" />
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? t('planning.creatingPlan') : t('planning.createPlan')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
