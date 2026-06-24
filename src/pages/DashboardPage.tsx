import { useState } from 'react'
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, PieChart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n/I18nProvider'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import InventoryValueChart from '../components/charts/InventoryValueChart'
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart'
import TransactionTrendChart from '../components/charts/TransactionTrendChart'
import { useDashboardStats } from '../hooks/useDashboardStats'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { t, language } = useI18n()

  // Date filtering for Top 10 reports
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Use extracted hook for all data fetching
  const { stats, loading } = useDashboardStats(selectedMonth, selectedYear)

  // Get months array in the correct language
  const monthsArray = language === 'th'
    ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            {t('auth.welcomeBack')}, {profile?.full_name || t('auth.email')}
          </p>
        </div>

        {/* Main KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalItems')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalItems.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.activeInventory')}</p>
              </div>
              <div className="ml-4 p-3 bg-blue-100 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalValue')}</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  ฿{loading ? '...' : stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.inventoryWorth')}</p>
              </div>
              <div className="ml-4 p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.lowStock')}</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {loading ? '...' : stats.lowStockItems.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.needsReorder')}</p>
              </div>
              <div className="ml-4 p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.outOfStock')}</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {loading ? '...' : stats.outOfStock.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.criticalItems')}</p>
              </div>
              <div className="ml-4 p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Date Selector for Top 10 Reports */}
        <Card className="bg-white border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">{t('dashboard.selectMonth')}:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {monthsArray.map((monthName, index) => (
                  <option key={index} value={index}>{monthName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">{t('dashboard.selectYear')}:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {t('dashboard.showingDataFor')} {new Date(selectedYear, selectedMonth).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </Card>

        {/* 4 Column Grid for Top Items, Departments, and Savings */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Top 10 Items by Usage */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topItems')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.mostUsedByQuantity')}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topItems.length > 0 ? (
                stats.topItems.map((item, index) => (
                  <div
                    key={item.item_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index < 3
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                            ? 'bg-gray-400 text-gray-900'
                            : index === 2
                              ? 'bg-orange-400 text-orange-900'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {item.item_code} • {item.category_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-gray-900">
                        {item.total_quantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.units')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noUsageData')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top 10 Departments by Value */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topDepartments')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.mostUsedByValue')}</p>
              </div>
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topDepartments.length > 0 ? (
                stats.topDepartments.map((dept, index) => (
                  <div
                    key={dept.department_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                      : index === 1
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                        : index === 2
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-purple-500 text-white'
                          : index === 1
                            ? 'bg-blue-500 text-white'
                            : index === 2
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {dept.department_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-gray-900">
                        ฿{dept.total_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-600">{t('dashboard.transactionValue')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noDepartmentData')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top 10 Most Saving Items */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topSavingItems')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.decreasedUsageQuantity')}</p>
              </div>
              <TrendingDown className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topSavingItems.length > 0 ? (
                stats.topSavingItems.map((item, index) => (
                  <div
                    key={item.item_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index < 3
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-green-500 text-white'
                          : index === 1
                            ? 'bg-teal-500 text-white'
                            : index === 2
                              ? 'bg-lime-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {item.previous_quantity} → {item.current_quantity} units
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-green-600">
                        ↓ {item.savings_quantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.saved')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noSavingsData')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top 10 Departments Helping Save Cost */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topSavingDepartments')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.reducedSpending')}</p>
              </div>
              <TrendingDown className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topSavingDepartments.length > 0 ? (
                stats.topSavingDepartments.map((dept, index) => (
                  <div
                    key={dept.department_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : index === 1
                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
                        : index === 2
                          ? 'bg-gradient-to-r from-lime-50 to-green-50 border-lime-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-green-500 text-white'
                          : index === 1
                            ? 'bg-teal-500 text-white'
                            : index === 2
                              ? 'bg-lime-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {dept.department_name}
                        </div>
                        <div className="text-xs text-gray-600">
                          ฿{dept.previous_value.toLocaleString()} → ฿{dept.current_value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-green-600">
                        ↓ ฿{dept.savings_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.saved')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noSavingsData')}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Inventory Value Trend
              </h3>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <InventoryValueChart data={stats.inventoryValueTrend} />
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                Category Distribution
              </h3>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <CategoryDistributionChart data={stats.categoryDistribution} />
              )}
            </div>
          </Card>
        </div>

        {/* Transaction Trends Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Transaction Trends
            </h3>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <TransactionTrendChart data={stats.transactionTrends} />
            )}
          </div>
        </Card>

        {/* Alerts Section */}
        {(stats.outOfStock > 0 || stats.lowStockItems > 0) && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 border-red-200">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">{t('dashboard.inventoryAlerts')}</h3>
                <div className="mt-2 text-sm text-red-700">
                  {stats.outOfStock > 0 && (
                    <p>• {stats.outOfStock} {t('dashboard.itemsOutOfStock')}</p>
                  )}
                  {stats.lowStockItems > 0 && (
                    <p>• {stats.lowStockItems} {t('dashboard.itemsBelowReorder')}</p>
                  )}
                </div>
                <div className="mt-3">
                  <a
                    href="/inventory"
                    className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    {t('dashboard.viewInventoryDetails')} →
                  </a>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
