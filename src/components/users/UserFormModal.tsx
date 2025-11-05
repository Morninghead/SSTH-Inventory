import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  email?: string | null
  phone?: string | null
}
type Department = Database['public']['Tables']['departments']['Row']

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: UserProfile | null
}

const USER_ROLES = [
  { value: 'developer', label: 'Developer', level: 4, description: 'Full system access including development tools' },
  { value: 'admin', label: 'Administrator', level: 3, description: 'User management and all features' },
  { value: 'manager', label: 'Manager', level: 2, description: 'Purchasing, auditing, and reporting' },
  { value: 'user', label: 'User', level: 1, description: 'Can issue/receive inventory items' },
  { value: 'viewer', label: 'Viewer', level: 0, description: 'Read-only access to dashboard and reports' },
]

export default function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'viewer',
    department_id: '',
    phone: '',
    is_active: true,
    password: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadDepartments()
      if (user) {
        // Edit mode
        setFormData({
          email: user.email || '',
          full_name: user.full_name || '',
          role: user.role || 'viewer',
          department_id: user.department_id || '',
          phone: user.phone || '',
          is_active: user.is_active ?? true,
          password: '', // Don't populate password on edit
        })
      } else {
        // Create mode
        setFormData({
          email: '',
          full_name: '',
          role: 'viewer',
          department_id: '',
          phone: '',
          is_active: true,
          password: '',
        })
      }
      setError('')
    }
  }, [isOpen, user])

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('dept_name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err) {
      console.error('Error loading departments:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (user) {
        // Update existing user profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name.trim(),
            role: formData.role,
            department_id: formData.department_id || null,
            phone: formData.phone || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) throw updateError

      } else {
        // Create new user
        // First, create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password || 'ChangeMe123!', // Default password if not provided
          options: {
            data: {
              full_name: formData.full_name.trim(),
            },
          },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Failed to create user')

        // Then create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email.trim(),
            full_name: formData.full_name.trim(),
            role: formData.role,
            department_id: formData.department_id || null,
            phone: formData.phone || null,
            is_active: formData.is_active,
          })

        if (profileError) throw profileError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving user:', err)
      setError(err.message || 'An error occurred while saving the user')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value

    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const selectedRole = USER_ROLES.find(r => r.value === formData.role)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit User' : 'Create New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={!!user} // Can't change email when editing
          placeholder="user@example.com"
        />

        {/* Password (only on create) */}
        {!user && (
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave empty for default password"
            helperText="Default: ChangeMe123! (user will be asked to change on first login)"
          />
        )}

        {/* Full Name */}
        <Input
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          placeholder="John Doe"
        />

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </select>

          {selectedRole && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedRole.label}</strong> (Level {selectedRole.level}): {selectedRole.description}
              </p>
            </div>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No Department</option>
            {departments.map((dept) => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <Input
          label="Phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+66 XX XXX XXXX"
        />

        {/* Active Status */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active (User can login)
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Info Messages */}
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> A new user will be created in Supabase Authentication.
              The user will receive an email to verify their account.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
