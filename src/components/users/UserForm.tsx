import { useState, useEffect } from 'react'
import { Save, X, User, Mail, Lock, Shield, Building } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface UserFormProps {
  userId?: string // If editing existing user
  userEmail?: string // Email for display in edit mode
  onSuccess: () => void
  onCancel: () => void
}

interface UserFormData {
  email: string
  password: string
  full_name: string
  role: string
  department_id: string
  is_active: boolean
}

const ROLES = [
  { value: 'developer', label: 'Developer', description: 'Full system access' },
  { value: 'admin', label: 'Admin', description: 'User management, all features' },
  { value: 'manager', label: 'Manager', description: 'Purchasing, auditing' },
  { value: 'user', label: 'User', description: 'Inventory operations' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

export default function UserForm({ userId, userEmail, onSuccess, onCancel }: UserFormProps) {
  const {} = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<any[]>([])
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    department_id: '',
    is_active: true
  })
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    loadDepartments()
    if (userId) {
      loadUser()
    }
  }, [userId])

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('dept_name')
    setDepartments(data || [])
  }

  const loadUser = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setIsEditMode(true)
        // Note: Email is not stored in user_profiles, it's in auth.users
        // We get email from userEmail prop passed from parent
        setFormData({
          email: userEmail || '', // Email for display only (cannot be edited)
          password: '', // Never load password
          full_name: data.full_name || '',
          role: data.role || 'user',
          department_id: data.department_id || '',
          is_active: data.is_active ?? true
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error on change
  }

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }

    if (!formData.email.includes('@')) {
      setError('Invalid email format')
      return false
    }

    if (!isEditMode && !formData.password) {
      setError('Password is required for new users')
      return false
    }

    if (!isEditMode && formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return false
    }

    if (!formData.role) {
      setError('Role is required')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      if (isEditMode && userId) {
        // Update existing user profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            department_id: formData.department_id || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError

        onSuccess()
      } else {
        // For user creation, we need to use admin access which requires a service role key
        // For now, we'll show a message indicating this requires backend implementation
        throw new Error(
          'User creation requires admin privileges. Please create users through the Supabase Dashboard ' +
          'or implement a server-side API endpoint for user creation.'
        )

        // TODO: Implement server-side user creation or use service role key
        /*
        // Create new user in Supabase Auth first
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        })

        if (authError) {
          throw new Error(`Failed to create auth user: ${authError.message}`)
        }

        // Then create user profile
        if (authData.user?.id) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              full_name: formData.full_name,
              role: formData.role,
              department_id: formData.department_id || null,
              is_active: true,
              created_at: new Date().toISOString()
            })

          if (profileError) {
            // Rollback auth user creation if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id)
            throw new Error(`Failed to create user profile: ${profileError.message}`)
          }
        }

        onSuccess()
        */
      }
    } catch (err: any) {
      console.error('User form error:', err)
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <User className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">
            {isEditMode ? 'Edit User' : 'Create New User'}
          </h3>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {isEditMode
            ? 'Update user information and permissions'
            : 'Create a new user account with email and password'}
        </p>
      </div>

      {!isEditMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">User Creation Limitation</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  User creation requires admin privileges. For now, please create users through the{' '}
                  <a
                    href="https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/auth/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    Supabase Dashboard
                  </a>{' '}
                  and then edit their profile here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="user@example.com"
            disabled={isEditMode}
            className={isEditMode ? 'bg-gray-100' : ''}
          />
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          )}
        </div>

        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Min. 6 characters"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
        )}

        <div className={!isEditMode ? 'md:col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="John Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Shield className="w-4 h-4 inline mr-1" />
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Department (Optional)
          </label>
          <select
            value={formData.department_id}
            onChange={(e) => handleChange('department_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No Department</option>
            {departments.map(dept => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
            Active User
          </label>
          <p className="ml-2 text-xs text-gray-500">(Inactive users cannot login)</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </div>
  )
}
