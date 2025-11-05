import { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'

interface CompanySettingsData {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  company_website: string
}

export default function CompanySettings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState<CompanySettingsData>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .rpc('get_system_settings' as any)

      if (error) throw error

      // Parse settings into structured format
      const settingsMap: any = {}
      data.forEach((setting: any) => {
        settingsMap[setting.setting_key] = setting.setting_value
      })

      setSettings({
        company_name: settingsMap.company_name || '',
        company_address: settingsMap.company_address || '',
        company_phone: settingsMap.company_phone || '',
        company_email: settingsMap.company_email || '',
        company_website: settingsMap.company_website || ''
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Prepare settings array for bulk update
      const settingsArray = [
        { key: 'company_name', value: settings.company_name },
        { key: 'company_address', value: settings.company_address },
        { key: 'company_phone', value: settings.company_phone },
        { key: 'company_email', value: settings.company_email },
        { key: 'company_website', value: settings.company_website }
      ]

      const { data, error } = await supabase
        .rpc('bulk_update_settings' as any, {
          p_settings: settingsArray
        })

      if (error) throw error

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to update settings')
      }

      setSuccess('Company settings saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Input
          label="Company Name"
          value={settings.company_name}
          onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
          placeholder="Enter company name"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Address
          </label>
          <textarea
            value={settings.company_address}
            onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
            placeholder="Enter company address"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <Input
          label="Phone Number"
          type="tel"
          value={settings.company_phone}
          onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
          placeholder="Enter phone number"
        />

        <Input
          label="Email"
          type="email"
          value={settings.company_email}
          onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
          placeholder="Enter company email"
        />

        <Input
          label="Website"
          type="url"
          value={settings.company_website}
          onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
          placeholder="https://example.com"
        />

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
