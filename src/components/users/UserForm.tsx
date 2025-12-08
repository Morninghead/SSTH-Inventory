import { useState, useEffect } from 'react'
import { Save, X, User, Mail, Lock, Shield, Building } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
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

export default function UserForm({ userId, userEmail, onSuccess, onCancel }: UserFormProps) {
  const { t } = useI18n()
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

  const ROLES = [
    { value: 'developer', label: t('users.roles.developer'), description: t('users.roles.developerDescription') },
    { value: 'admin', label: t('users.roles.admin'), description: t('users.roles.adminDescription') },
    { value: 'manager', label: t('users.roles.manager'), description: t('users.roles.managerDescription') },
    { value: 'user', label: t('users.roles.user'), description: t('users.roles.userDescription') },
    { value: 'viewer', label: t('users.roles.viewer'), description: t('users.roles.viewerDescription') },
  ]

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
      setError(err.message || t('users.form.userCreationError'))
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
      setError(t('users.form.emailRequired'))
      return false
    }

    if (!formData.email.includes('@')) {
      setError(t('users.form.invalidEmailFormat'))
      return false
    }

    if (!isEditMode && !formData.password) {
      setError(t('users.form.passwordRequired'))
      return false
    }

    if (!isEditMode && formData.password.length < 6) {
      setError(t('users.form.passwordMinLength'))
      return false
    }

    if (!formData.full_name.trim()) {
      setError(t('users.form.fullNameRequired'))
      return false
    }

    if (!formData.role) {
      setError(t('users.form.roleRequired'))
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
        // User creation requires backend implementation
        throw new Error(t('users.form.userCreationError'))
      }
    } catch (err: any) {
      console.error('User form error:', err)
      setError(err.message || t(`users.form.${isEditMode ? 'updateUser' : 'createUser'}`))
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
            {isEditMode ? t('users.form.editUser') : t('users.form.createNewUser')}
          </h3>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {isEditMode
            ? t('users.form.updateUserInfo')
            : t('users.form.createNewUserAccount')}
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
              <h3 className="text-sm font-medium text-yellow-800">{t('users.form.userCreationLimitation')}</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {t('users.form.userCreationMessage')}{' '}
                  <a
                    href="https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/auth/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    {t('users.form.supabaseDashboard')}
                  </a>{' '}
                  {t('users.andThenEditTheirProfileHere')}
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
            {t('users.form.email')} <span className="text-red-500">*</span>
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
            <p className="text-xs text-gray-500 mt-1">{t('users.form.emailCannotBeChanged')}</p>
          )}
        </div>

        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              {t('users.form.password')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={t('users.form.min6Characters')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('users.form.minimumCharacters')}</p>
          </div>
        )}

        <div className={!isEditMode ? 'md:col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            {t('users.form.fullName')} <span className="text-red-500">*</span>
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
            {t('users.form.role')} <span className="text-red-500">*</span>
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
            {t('users.form.departmentOptional')}
          </label>
          <select
            value={formData.department_id}
            onChange={(e) => handleChange('department_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('users.form.noDepartment')}</option>
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
            {t('users.form.activeUser')}
          </label>
          <p className="ml-2 text-xs text-gray-500">{t('users.form.inactiveUsersCannotLogin')}</p>
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
          {t('users.form.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? t('users.form.saving') : (isEditMode ? t('users.form.updateUser') : t('users.form.createUser'))}
        </Button>
      </div>
    </div>
  )
}
