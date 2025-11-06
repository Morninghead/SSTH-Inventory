import { useState, useEffect } from 'react'
import { Bell, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface AlertRule {
  rule_id: string
  rule_name: string
  rule_type: string
  conditions: {
    field: string
    operator: string
    value: string | number
  }
  notification_channels: string[]
  recipients: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AlertRuleFormData {
  rule_name: string
  rule_type: string
  condition_field: string
  condition_operator: string
  condition_value: string
  notification_channels: string[]
  recipients: string
  is_active: boolean
}

const RULE_TYPES = [
  { value: 'low_stock', label: 'Low Stock Alert' },
  { value: 'out_of_stock', label: 'Out of Stock Alert' },
  { value: 'po_approval', label: 'PO Approval Required' },
  { value: 'po_received', label: 'PO Items Received' },
  { value: 'transaction_created', label: 'Transaction Created' }
]

const CONDITION_OPERATORS = [
  { value: '<=', label: 'Less than or equal to' },
  { value: '<', label: 'Less than' },
  { value: '=', label: 'Equal to' },
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or equal to' }
]

const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'system', label: 'System Notification' },
  { value: 'sms', label: 'SMS' }
]

export default function AlertRules() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<AlertRule[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editRuleId, setEditRuleId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<AlertRuleFormData>({
    rule_name: '',
    rule_type: 'low_stock',
    condition_field: 'quantity',
    condition_operator: '<=',
    condition_value: '10',
    notification_channels: ['email'],
    recipients: '',
    is_active: true
  })

  const canManageRules = profile?.role === 'developer' || profile?.role === 'admin' || profile?.role === 'manager'

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .rpc('get_alert_rules' as any)

      if (error) throw error

      // Parse JSONB fields
      const parsedRules = (data || []).map((rule: any) => ({
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
        notification_channels: typeof rule.notification_channels === 'string'
          ? JSON.parse(rule.notification_channels)
          : rule.notification_channels || [],
        recipients: typeof rule.recipients === 'string'
          ? JSON.parse(rule.recipients)
          : rule.recipients || [],
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at
      }))

      setRules(parsedRules)
    } catch (err: any) {
      console.error('Load rules error:', err)
      setError(err.message || 'Failed to load alert rules')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditRuleId(null)
    setFormData({
      rule_name: '',
      rule_type: 'low_stock',
      condition_field: 'quantity',
      condition_operator: '<=',
      condition_value: '10',
      notification_channels: ['email'],
      recipients: '',
      is_active: true
    })
    setShowModal(true)
  }

  const handleEdit = (rule: AlertRule) => {
    setEditRuleId(rule.rule_id)
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      condition_field: rule.conditions?.field || 'quantity',
      condition_operator: rule.conditions?.operator || '<=',
      condition_value: String(rule.conditions?.value || '10'),
      notification_channels: rule.notification_channels || ['email'],
      recipients: rule.recipients.join(', '),
      is_active: rule.is_active
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.rule_name.trim()) {
        setError('Rule name is required')
        return
      }

      if (!formData.recipients.trim()) {
        setError('Recipients are required')
        return
      }

      // Parse recipients (comma-separated emails)
      const recipientsArray = formData.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      if (recipientsArray.length === 0) {
        setError('At least one recipient email is required')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const email of recipientsArray) {
        if (!emailRegex.test(email)) {
          setError(`Invalid email format: ${email}`)
          return
        }
      }

      // Validate notification channels
      if (formData.notification_channels.length === 0) {
        setError('At least one notification channel is required')
        return
      }

      setError('')

      // Build JSONB structures
      const conditions = {
        field: formData.condition_field,
        operator: formData.condition_operator,
        value: isNaN(Number(formData.condition_value))
          ? formData.condition_value
          : Number(formData.condition_value)
      }

      if (editRuleId) {
        // Update existing rule
        const { data, error } = await supabase
          .rpc('update_alert_rule' as any, {
            p_rule_id: editRuleId,
            p_rule_name: formData.rule_name,
            p_rule_type: formData.rule_type,
            p_conditions: conditions,
            p_notification_channels: formData.notification_channels,
            p_recipients: recipientsArray,
            p_is_active: formData.is_active
          })

        if (error) throw error
        if (data && !data.success) {
          throw new Error(data.message || 'Failed to update rule')
        }
      } else {
        // Create new rule
        const { data, error } = await supabase
          .rpc('create_alert_rule' as any, {
            p_rule_name: formData.rule_name,
            p_rule_type: formData.rule_type,
            p_conditions: conditions,
            p_notification_channels: formData.notification_channels,
            p_recipients: recipientsArray
          })

        if (error) throw error
        if (data && !data.success) {
          throw new Error(data.message || 'Failed to create rule')
        }
      }

      setShowModal(false)
      loadRules()
    } catch (err: any) {
      console.error('Save rule error:', err)
      setError(err.message || 'Failed to save rule')
    }
  }

  const handleDelete = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Are you sure you want to delete the alert rule "${ruleName}"?`)) {
      return
    }

    try {
      const { data, error } = await supabase
        .rpc('delete_alert_rule' as any, {
          p_rule_id: ruleId
        })

      if (error) throw error
      if (data && !data.success) {
        throw new Error(data.message || 'Failed to delete rule')
      }

      loadRules()
    } catch (err: any) {
      console.error('Delete rule error:', err)
      setError(err.message || 'Failed to delete rule')
    }
  }

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      notification_channels: prev.notification_channels.includes(channel)
        ? prev.notification_channels.filter(c => c !== channel)
        : [...prev.notification_channels, channel]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading alert rules...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Alert Rules</h2>
        </div>
        {canManageRules && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Alert Rules List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No alert rules configured</p>
            {canManageRules && (
              <Button onClick={handleCreate} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  {canManageRules && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.rule_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.rule_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {RULE_TYPES.find(t => t.value === rule.rule_type)?.label || rule.rule_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {rule.conditions?.field} {rule.conditions?.operator} {rule.conditions?.value}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {rule.notification_channels.map(ch => ch.charAt(0).toUpperCase() + ch.slice(1)).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {rule.recipients.join(', ')}
                      </div>
                    </td>
                    {canManageRules && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit Rule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.rule_id, rule.rule_name)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editRuleId ? 'Edit Alert Rule' : 'Create Alert Rule'}
        >
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <Input
              label="Rule Name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              placeholder="Enter rule name"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Type
              </label>
              <select
                value={formData.rule_type}
                onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {RULE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Field"
                value={formData.condition_field}
                onChange={(e) => setFormData({ ...formData, condition_field: e.target.value })}
                placeholder="quantity"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator
                </label>
                <select
                  value={formData.condition_operator}
                  onChange={(e) => setFormData({ ...formData, condition_operator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CONDITION_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.value}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Value"
                value={formData.condition_value}
                onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Channels
              </label>
              <div className="space-y-2">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <label key={channel.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.notification_channels.includes(channel.value)}
                      onChange={() => toggleChannel(channel.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{channel.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients (comma-separated emails)
              </label>
              <textarea
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="user1@example.com, user2@example.com"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {editRuleId && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editRuleId ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
