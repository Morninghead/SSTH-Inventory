import { useState, useEffect } from 'react'
import { Settings, Save, Mail } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'

interface SystemConfigData {
  // System Settings
  default_currency: string
  default_timezone: string
  low_stock_threshold: string
  reorder_level: string
  transaction_prefix: string
  po_prefix: string

  // Email Settings
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_from_name: string
  smtp_from_email: string

  // Notification Settings
  enable_low_stock_alerts: string
  enable_po_alerts: string
  enable_transaction_alerts: string
}

export default function SystemConfiguration() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState<'system' | 'email' | 'notifications'>('system')
  const [config, setConfig] = useState<SystemConfigData>({
    default_currency: 'THB',
    default_timezone: 'Asia/Bangkok',
    low_stock_threshold: '10',
    reorder_level: '20',
    transaction_prefix: 'TXN',
    po_prefix: 'PO',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_from_name: 'SSTH Inventory',
    smtp_from_email: 'noreply@ssth.com',
    enable_low_stock_alerts: 'true',
    enable_po_alerts: 'true',
    enable_transaction_alerts: 'false'
  })

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
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

      setConfig({
        default_currency: settingsMap.default_currency || 'THB',
        default_timezone: settingsMap.default_timezone || 'Asia/Bangkok',
        low_stock_threshold: settingsMap.low_stock_threshold || '10',
        reorder_level: settingsMap.reorder_level || '20',
        transaction_prefix: settingsMap.transaction_prefix || 'TXN',
        po_prefix: settingsMap.po_prefix || 'PO',
        smtp_host: settingsMap.smtp_host || '',
        smtp_port: settingsMap.smtp_port || '587',
        smtp_user: settingsMap.smtp_user || '',
        smtp_from_name: settingsMap.smtp_from_name || 'SSTH Inventory',
        smtp_from_email: settingsMap.smtp_from_email || 'noreply@ssth.com',
        enable_low_stock_alerts: settingsMap.enable_low_stock_alerts || 'true',
        enable_po_alerts: settingsMap.enable_po_alerts || 'true',
        enable_transaction_alerts: settingsMap.enable_transaction_alerts || 'false'
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Validate numeric fields
      const threshold = parseInt(config.low_stock_threshold)
      const reorder = parseInt(config.reorder_level)
      const port = parseInt(config.smtp_port)

      if (isNaN(threshold) || threshold < 0) {
        throw new Error('Low stock threshold must be a positive number')
      }
      if (isNaN(reorder) || reorder < 0) {
        throw new Error('Reorder level must be a positive number')
      }
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('SMTP port must be between 1 and 65535')
      }

      // Prepare settings array for bulk update
      const settingsArray = Object.entries(config).map(([key, value]) => ({
        key,
        value: String(value)
      }))

      const { data, error } = await supabase
        .rpc('bulk_update_settings' as any, {
          p_settings: settingsArray
        })

      if (error) throw error

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to update configuration')
      }

      setSuccess('System configuration saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
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

      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveSection('system')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'system'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          System Settings
        </button>
        <button
          onClick={() => setActiveSection('email')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'email'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Email Settings
        </button>
        <button
          onClick={() => setActiveSection('notifications')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'notifications'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Notifications
        </button>
      </div>

      {/* System Settings Section */}
      {activeSection === 'system' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Currency"
              value={config.default_currency}
              onChange={(e) => setConfig({ ...config, default_currency: e.target.value })}
              placeholder="THB"
            />

            <Input
              label="Default Timezone"
              value={config.default_timezone}
              onChange={(e) => setConfig({ ...config, default_timezone: e.target.value })}
              placeholder="Asia/Bangkok"
            />
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4 pt-4">Inventory Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Low Stock Threshold"
              type="number"
              value={config.low_stock_threshold}
              onChange={(e) => setConfig({ ...config, low_stock_threshold: e.target.value })}
              placeholder="10"
              min="0"
            />

            <Input
              label="Reorder Level"
              type="number"
              value={config.reorder_level}
              onChange={(e) => setConfig({ ...config, reorder_level: e.target.value })}
              placeholder="20"
              min="0"
            />
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4 pt-4">Number Prefixes</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction Prefix"
              value={config.transaction_prefix}
              onChange={(e) => setConfig({ ...config, transaction_prefix: e.target.value })}
              placeholder="TXN"
            />

            <Input
              label="Purchase Order Prefix"
              value={config.po_prefix}
              onChange={(e) => setConfig({ ...config, po_prefix: e.target.value })}
              placeholder="PO"
            />
          </div>
        </div>
      )}

      {/* Email Settings Section */}
      {activeSection === 'email' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Mail className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">SMTP Configuration</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SMTP Host"
              value={config.smtp_host}
              onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
              placeholder="smtp.gmail.com"
            />

            <Input
              label="SMTP Port"
              type="number"
              value={config.smtp_port}
              onChange={(e) => setConfig({ ...config, smtp_port: e.target.value })}
              placeholder="587"
              min="1"
              max="65535"
            />
          </div>

          <Input
            label="SMTP Username"
            value={config.smtp_user}
            onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
            placeholder="your-email@gmail.com"
          />

          <h3 className="text-lg font-medium text-gray-900 mb-4 pt-4">Email From Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Name"
              value={config.smtp_from_name}
              onChange={(e) => setConfig({ ...config, smtp_from_name: e.target.value })}
              placeholder="SSTH Inventory"
            />

            <Input
              label="From Email"
              type="email"
              value={config.smtp_from_email}
              onChange={(e) => setConfig({ ...config, smtp_from_email: e.target.value })}
              placeholder="noreply@ssth.com"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Email password should be set securely through environment variables or a secure credential store, not stored in database settings.
            </p>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Preferences</h3>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enable_low_stock_alerts === 'true'}
                onChange={(e) =>
                  setConfig({ ...config, enable_low_stock_alerts: e.target.checked ? 'true' : 'false' })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Low Stock Alerts</div>
                <div className="text-sm text-gray-500">
                  Receive notifications when items fall below the low stock threshold
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enable_po_alerts === 'true'}
                onChange={(e) =>
                  setConfig({ ...config, enable_po_alerts: e.target.checked ? 'true' : 'false' })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Purchase Order Alerts</div>
                <div className="text-sm text-gray-500">
                  Receive notifications for purchase order status changes
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enable_transaction_alerts === 'true'}
                onChange={(e) =>
                  setConfig({ ...config, enable_transaction_alerts: e.target.checked ? 'true' : 'false' })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Transaction Alerts</div>
                <div className="text-sm text-gray-500">
                  Receive notifications for all inventory transactions
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}
