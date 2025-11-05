import { useState, useEffect } from 'react'
import { User, Save, Bell, Eye } from 'lucide-react'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface UserPreferencesData {
  theme: string
  language: string
  items_per_page: string
  date_format: string
  time_format: string
  enable_email_notifications: string
  enable_desktop_notifications: string
  show_completed_transactions: string
}

export default function UserPreferences() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    theme: 'light',
    language: 'en',
    items_per_page: '20',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    enable_email_notifications: 'true',
    enable_desktop_notifications: 'false',
    show_completed_transactions: 'true'
  })

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .rpc('get_user_preferences' as any, {
          p_user_id: user?.id
        })

      if (error) throw error

      // Parse preferences into structured format
      const prefsMap: any = {}
      data.forEach((pref: any) => {
        prefsMap[pref.preference_key] = pref.preference_value
      })

      // Update state with loaded preferences or keep defaults
      setPreferences({
        theme: prefsMap.theme || 'light',
        language: prefsMap.language || 'en',
        items_per_page: prefsMap.items_per_page || '20',
        date_format: prefsMap.date_format || 'DD/MM/YYYY',
        time_format: prefsMap.time_format || '24h',
        enable_email_notifications: prefsMap.enable_email_notifications || 'true',
        enable_desktop_notifications: prefsMap.enable_desktop_notifications || 'false',
        show_completed_transactions: prefsMap.show_completed_transactions || 'true'
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences')
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
      const itemsPerPage = parseInt(preferences.items_per_page)
      if (isNaN(itemsPerPage) || itemsPerPage < 5 || itemsPerPage > 100) {
        throw new Error('Items per page must be between 5 and 100')
      }

      // Save each preference individually
      for (const [key, value] of Object.entries(preferences)) {
        const { error } = await supabase
          .rpc('update_user_preference' as any, {
            p_preference_key: key,
            p_preference_value: String(value),
            p_user_id: user?.id
          })

        if (error) throw error
      }

      setSuccess('Preferences saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading preferences...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">User Preferences</h2>
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

      {/* Appearance Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Appearance</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={preferences.theme}
            onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="th">ภาษาไทย (Thai)</option>
          </select>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items Per Page
          </label>
          <select
            value={preferences.items_per_page}
            onChange={(e) => setPreferences({ ...preferences, items_per_page: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10 items</option>
            <option value="20">20 items</option>
            <option value="50">50 items</option>
            <option value="100">100 items</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={preferences.date_format}
              onChange={(e) => setPreferences({ ...preferences, date_format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              value={preferences.time_format}
              onChange={(e) => setPreferences({ ...preferences, time_format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.show_completed_transactions === 'true'}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  show_completed_transactions: e.target.checked ? 'true' : 'false'
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Show Completed Transactions</div>
              <div className="text-sm text-gray-500">
                Display completed transactions in transaction lists by default
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.enable_email_notifications === 'true'}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  enable_email_notifications: e.target.checked ? 'true' : 'false'
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-500">
                Receive email notifications for important events
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.enable_desktop_notifications === 'true'}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  enable_desktop_notifications: e.target.checked ? 'true' : 'false'
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Desktop Notifications</div>
              <div className="text-sm text-gray-500">
                Show desktop notifications in your browser
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
