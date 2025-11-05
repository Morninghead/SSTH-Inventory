import { useState, useEffect } from 'react'
import { X, Activity, Clock } from 'lucide-react'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'

interface ActivityLogProps {
  userId: string
  userName: string
  onClose: () => void
}

interface ActivityEntry {
  log_id: string
  user_id: string
  user_name: string
  action: string
  table_name: string
  record_id: string
  old_values: any
  new_values: any
  created_at: string
}

export default function ActivityLog({ userId, userName, onClose }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivity()
  }, [userId])

  const loadActivity = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_user_activity' as any, {
          p_user_id: userId,
          p_limit: 100
        })

      if (error) throw error
      setActivities((data as any) || [])
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      INSERT: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800'
    }
    return badges[action] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
                <p className="text-sm text-gray-600">{userName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activity found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.log_id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(activity.action)}`}>
                          {activity.action}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {activity.table_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {activity.record_id?.substring(0, 8)}...
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDateTime(activity.created_at)}
                      </div>

                      {activity.action === 'UPDATE' && activity.old_values && activity.new_values && (
                        <div className="mt-2 text-xs">
                          <p className="font-medium text-gray-700 mb-1">Changes:</p>
                          <div className="bg-white rounded p-2 space-y-1">
                            {Object.keys(activity.new_values).map((key) => {
                              const oldValue = activity.old_values?.[key]
                              const newValue = activity.new_values?.[key]
                              if (oldValue !== newValue) {
                                return (
                                  <div key={key} className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-600">{key}:</span>
                                    <span className="text-red-600 line-through">{JSON.stringify(oldValue)}</span>
                                    <span>→</span>
                                    <span className="text-green-600">{JSON.stringify(newValue)}</span>
                                  </div>
                                )
                              }
                              return null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
