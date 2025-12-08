import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PlanFormModal from './PlanFormModal';
import PlanDetailModal from './PlanDetailModal';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';

export default function PlanningList() {
    const { t } = useI18n();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('department_plans')
                .select(`
          *,
          departments (
            dept_name
          )
        `)
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (error) throw error;
            setPlans(data || []);
        } catch (err) {
            console.error('Error loading plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (month: number) => {
        const date = new Date(2000, month - 1);
        // Get English month name for key generation
        const monthKey = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        return t(`months.${monthKey}`);
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            ACTIVE: 'bg-green-100 text-green-800',
            SUBMITTED: 'bg-blue-100 text-blue-800',
            APPROVED: 'bg-purple-100 text-purple-800',
            ARCHIVED: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
                {t(`planning.status.${status}`) || status}
            </span>
        );
    };

    const handlePlanClick = (plan: any) => {
        setSelectedPlan(plan);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">{t('planning.title')}</h2>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('planning.createPlan')}
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : plans.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">{t('planning.noPlans')}</p>
                    <p className="text-gray-500 text-sm mt-2 mb-4">
                        {t('planning.readyMessage')}
                    </p>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                        <Plus className="w-4 h-2 mr-2" />
                        {t('planning.createFirstPlan')}
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.plan_id}
                            className="group hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden border-2 border-gray-100 hover:border-blue-300"
                            onClick={() => handlePlanClick(plan)}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-2 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                                        <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">{t('planning.plan')}</span>
                                    </div>
                                    {getStatusBadge(plan.status)}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-3">
                                <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                                    {plan.departments?.dept_name || t('common.unknown')}
                                </h3>
                                <div className="flex items-center gap-1.5 mb-2.5">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {getMonthName(plan.month)} {plan.year}
                                    </span>
                                </div>
                                <div className="space-y-1 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">{t('common.created')}</span>
                                        <span className="font-medium text-gray-700">
                                            {new Date(plan.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {plan.updated_at && plan.updated_at !== plan.created_at && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">{t('common.updated')}</span>
                                            <span className="font-medium text-gray-700">
                                                {new Date(plan.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-blue-600 font-medium">{t('common.viewDetails')}</span>
                                    <svg className="w-3.5 h-3.5 text-blue-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modals */}
            <PlanFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadPlans();
                    setIsModalOpen(false);
                }}
            />

            {selectedPlan && (
                <PlanDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    plan={selectedPlan}
                    onUpdate={loadPlans}
                />
            )}
        </div>
    );
}
