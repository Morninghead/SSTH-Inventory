import { useState } from 'react'
import { Building2, Settings, User, Bell } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import CompanySettings from '../components/settings/CompanySettings'
import SystemConfiguration from '../components/settings/SystemConfiguration'
import UserPreferences from '../components/settings/UserPreferences'
import AlertRules from '../components/settings/AlertRules'
import NotificationSettings from '../components/settings/NotificationSettings'
import { useI18n } from '../i18n'

export default function SettingsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('company')

  const tabs = [
    {
      id: 'company',
      label: t('settings.company'),
      icon: <Building2 className="w-5 h-5" />
    },
        {
      id: 'system',
      label: t('settings.system'),
      icon: <Settings className="w-5 h-5" />
    },
    {
      id: 'preferences',
      label: t('settings.preferences'),
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />
    },
    {
      id: 'alerts',
      label: t('settings.alerts'),
      icon: <User className="w-5 h-5" />
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="mt-1 text-gray-600">{t('settings.subtitle')}</p>
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'company' && <CompanySettings />}
                        {activeTab === 'system' && <SystemConfiguration />}
            {activeTab === 'preferences' && <UserPreferences />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'alerts' && <AlertRules />}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
