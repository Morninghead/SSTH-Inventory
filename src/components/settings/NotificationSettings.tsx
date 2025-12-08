import { useState, useEffect } from 'react'
import { Bell, Send, Check, X, Loader2, Bot, MessageSquare } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useI18n } from '../../i18n'
import { useAuth } from '../../contexts/AuthContext'
import notificationService from '../../services/notificationService'

export default function NotificationSettings() {
  const {} = useI18n()
  const { profile } = useAuth()
  const [settings, setSettings] = useState({
    low_stock_alerts: false,
    transaction_notifications: false,
    daily_summary: false,
    bot_token: '',
    chat_id: '',
    enabled: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Can manage notifications
  const canManageNotifications = profile?.role === 'developer' || profile?.role === 'admin'

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentSettings = notificationService.getSettings()
      if (currentSettings) {
        setSettings({
          low_stock_alerts: currentSettings.low_stock_alerts,
          transaction_notifications: currentSettings.transaction_notifications,
          daily_summary: currentSettings.daily_summary,
          bot_token: currentSettings.bot_token || '',
          chat_id: currentSettings.chat_id || '',
          enabled: currentSettings.enabled
        })
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!canManageNotifications) return

    setSaving(true)
    setTestResult(null)

    try {
      const success = await notificationService.saveSettings(settings)
      if (success) {
        setTestResult({
          success: true,
          message: '✅ Settings saved successfully!'
        })
        // Refresh the local settings to match what was saved
        await loadSettings()
      } else {
        setTestResult({
          success: false,
          message: '❌ Failed to save settings. Please check database connection.'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ Error saving settings. Please ensure notification_settings table exists.'
      })
    } finally {
      setSaving(false)
      setTimeout(() => setTestResult(null), 5000)
    }
  }

  const handleTestConnection = async () => {
    if (!canManageNotifications || !settings.bot_token || !settings.chat_id) {
      setTestResult({
        success: false,
        message: 'Please enter both bot token and chat ID before testing.'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Temporarily save settings to test
      await notificationService.saveSettings(settings)

      const success = await notificationService.testConnection()

      if (success) {
        setTestResult({
          success: true,
          message: '✅ Test message sent successfully! Check your Telegram.'
        })
      } else {
        setTestResult({
          success: false,
          message: '❌ Failed to send test message. Please check your bot token and chat ID.'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ Connection test failed. Please verify your configuration.'
      })
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 5000)
    }
  }

  if (!canManageNotifications) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Only administrators can manage notification settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <Bell className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
            <p className="text-sm text-gray-600">
              Configure Telegram bot notifications for real-time inventory alerts
            </p>
          </div>
        </div>
      </div>

      {/* Telegram Configuration */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Bot className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Telegram Bot Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bot Token
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={settings.bot_token}
              onChange={(e) => setSettings({ ...settings, bot_token: e.target.value })}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              helperText="Get token from @BotFather on Telegram"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat ID
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={settings.chat_id}
              onChange={(e) => setSettings({ ...settings, chat_id: e.target.value })}
              placeholder="123456789"
              helperText="Your Telegram chat ID or group chat ID"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
              Enable Telegram notifications
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={testing || !settings.bot_token || !settings.chat_id}
              variant="secondary"
              className="flex items-center"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg flex items-center ${
              testResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult.success ? (
                <Check className="w-5 h-5 mr-2" />
              ) : (
                <X className="w-5 h-5 mr-2" />
              )}
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Types</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Low Stock Alerts</div>
              <div className="text-sm text-gray-600">
                Get notified when items fall below reorder level
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.low_stock_alerts}
              onChange={(e) => setSettings({ ...settings, low_stock_alerts: e.target.checked })}
              disabled={!settings.enabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Transaction Notifications</div>
              <div className="text-sm text-gray-600">
                Receive alerts for all inventory transactions (Issue/Receive/Adjustment)
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.transaction_notifications}
              onChange={(e) => setSettings({ ...settings, transaction_notifications: e.target.checked })}
              disabled={!settings.enabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Daily Summary</div>
              <div className="text-sm text-gray-600">
                Get daily inventory activity reports
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.daily_summary}
              onChange={(e) => setSettings({ ...settings, daily_summary: e.target.checked })}
              disabled={!settings.enabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>1. Create Telegram Bot:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Search for @BotFather on Telegram</li>
              <li>• Send /newbot command</li>
              <li>• Follow instructions to create your bot</li>
              <li>• Copy the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)</li>
            </ul>
          </div>
          <div>
            <strong>2. Get Chat ID:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Start a chat with your bot</li>
              <li>• Send any message to the bot</li>
              <li>• Visit: https://api.telegram.org/bot&lt;BOT_TOKEN&gt;/getUpdates</li>
              <li>• Find your chat ID in the response</li>
            </ul>
          </div>
          <div>
            <strong>3. Configure Settings:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Enter bot token and chat ID above</li>
              <li>• Click "Test Connection" to verify</li>
              <li>• Enable desired notification types</li>
              <li>• Save settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}