import { useState } from 'react'
import { Building2, Settings, User, Bell } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import CompanySettings from '../components/settings/CompanySettings'
import SystemConfiguration from '../components/settings/SystemConfiguration'
import UserPreferences from '../components/settings/UserPreferences'
import AlertRules from '../components/settings/AlertRules'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company')

  const tabs = [
    {
      id: 'company',
      label: 'Company',
      icon: <Building2 className="w-5 h-5" />
    },
    {
      id: 'system',
      label: 'System',
      icon: <Settings className="w-5 h-5" />
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'alerts',
      label: 'Alert Rules',
      icon: <Bell className="w-5 h-5" />
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-gray-600">Configure system settings, preferences, and notifications</p>
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'company' && <CompanySettings />}
            {activeTab === 'system' && <SystemConfiguration />}
            {activeTab === 'preferences' && <UserPreferences />}
            {activeTab === 'alerts' && <AlertRules />}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
