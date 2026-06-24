import { useState } from 'react'
import { Calendar, AlertCircle, TrendingUp, Package, ShoppingCart } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import PlanningList from '../components/planning/PlanningList'
import BackorderList from '../components/planning/BackorderList'
import ProcurementInsights from '../components/planning/ProcurementInsights'
import PlanFormModal from '../components/planning/PlanFormModal'
import { useI18n } from '../i18n'

export default function PlanningPage() {
    const { t } = useI18n()
    const [activeTab, setActiveTab] = useState<'plans' | 'backorders' | 'procurement'>('backorders')
    const [isPlanFormOpen, setIsPlanFormOpen] = useState(false)

    const tabs = [
        {
            id: 'plans',
            label: t('planning.monthlyPlans'),
            icon: <Calendar className="w-5 h-5" />,
        },
        {
            id: 'backorders',
            label: t('planning.backorders'),
            icon: <AlertCircle className="w-5 h-5" />,
        },
        {
            id: 'procurement',
            label: 'Procurement Insights',
            icon: <ShoppingCart className="w-5 h-5" />,
        },
    ]

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as 'plans' | 'backorders' | 'procurement')
    }

    const handleCreatePlan = () => {
        setIsPlanFormOpen(true)
    }

    const handlePlanFormClose = () => {
        setIsPlanFormOpen(false)
    }

    const handlePlanFormSuccess = () => {
        setIsPlanFormOpen(false)
        // Optionally refresh the plans list or show success message
        if (activeTab === 'plans') {
            // Trigger a refresh of the plans list
            window.location.reload()
        }
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-blue-600" />
                            {t('planning.title')}
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">
                            {t('planning.subtitle')}
                        </p>
                    </div>
                    {activeTab === 'plans' && (
                        <Button
                            variant="gradient"
                            size="lg"
                            className="shadow-lg hover:shadow-xl"
                            onClick={handleCreatePlan}
                        >
                            <Package className="w-5 h-5 mr-2" />
                            <span className="font-semibold">{t('planning.createPlan')}</span>
                        </Button>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 rounded-lg">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900">{t('planning.monthlyPlans')}</h3>
                                <p className="text-sm text-blue-700">{t('planning.manageMonthlyPlans')}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-600 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-amber-900">{t('planning.backorders')}</h3>
                                <p className="text-sm text-amber-700">{t('planning.trackBackorders')}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-600 rounded-lg">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-900">Procurement Insights</h3>
                                <p className="text-sm text-green-700">AI-powered procurement recommendations</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="min-h-[500px]">
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

                    <div className="mt-6">
                        {activeTab === 'plans' ? (
                            <PlanningList />
                        ) : activeTab === 'backorders' ? (
                            <BackorderList />
                        ) : (
                            <ProcurementInsights />
                        )}
                    </div>
                </Card>

                {/* Plan Form Modal */}
                <PlanFormModal
                    isOpen={isPlanFormOpen}
                    onClose={handlePlanFormClose}
                    onSuccess={handlePlanFormSuccess}
                />
            </div>
        </MainLayout>
    )
}
