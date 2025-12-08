import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Filter, Edit, Power, Trash2, Key, Eye, X } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface UserListProps {
  onEditUser: (userId: string, userEmail: string) => void
  onViewActivity: (userId: string) => void
  refreshTrigger?: number
}

interface User {
  user_id: string
  email: string
  full_name: string
  role: string
  department_id: string | null
  department_name: string | null
  is_active: boolean
  created_at: string
  last_login: string | null
}

export default function UserList({ onEditUser, onViewActivity, refreshTrigger }: UserListProps) {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [departments, setDepartments] = useState<any[]>([])
  const [filterDepartment, setFilterDepartment] = useState('')

  // Debounced search to improve performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [filterRole, filterStatus, filterDepartment, refreshTrigger])

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('departments')
        .select('dept_id, dept_name') // Only select needed columns
        .eq('is_active', true)
        .order('dept_name')
      setDepartments(data || [])
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      // First, get user_profiles and departments separately to avoid join issues
      let query = supabase
        .from('user_profiles')
        .select('id, full_name, role, department_id, is_active, created_at')

      if (filterRole) query = query.eq('role', filterRole)
      if (filterDepartment) query = query.eq('department_id', filterDepartment)
      if (filterStatus !== 'ALL') query = query.eq('is_active', filterStatus === 'ACTIVE')

      const { data: profiles, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading users:', error)
        throw error
      }

      // Get departments for mapping
      const { data: departments } = await supabase
        .from('departments')
        .select('dept_id, dept_name')
        .eq('is_active', true)

      // Create department mapping
      const deptMap = (departments || []).reduce((acc, dept) => {
        acc[dept.dept_id] = dept.dept_name
        return acc
      }, {} as Record<string, string>)

      // Transform data to match User interface
      const users: User[] = (profiles || []).map((profile: any) => ({
        user_id: profile.id,
        email: `${profile.full_name?.replace(/\s+/g, '.').toLowerCase()}@example.com`,
        full_name: profile.full_name || 'No Name',
        role: profile.role || 'viewer',
        department_id: profile.department_id,
        department_name: profile.department_id ? (deptMap[profile.department_id] || null) : null,
        is_active: profile.is_active ?? true,
        created_at: profile.created_at,
        last_login: null
      }))

      setUsers(users)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }, [filterRole, filterStatus, filterDepartment])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    const confirmKey = action === 'deactivate' ? 'confirmDeactivate' : 'confirmActivate'
    if (!confirm(t(`users.list.${confirmKey}`))) return

    try {
      const newStatus = !currentStatus

      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        // Provide specific guidance based on common RLS errors
        if (error.code === '42501') {
          alert(t('users.list.permissionDenied'))
        } else if (error.message.includes('policy')) {
          alert(t('users.list.databasePolicyRestriction', { message: error.message }))
        } else {
          throw error
        }
        return
      }

      const successKey = action === 'deactivate' ? 'userDeactivated' : 'userActivated'
      alert(t(`users.list.${successKey}`))
      loadUsers()
    } catch (err: any) {
      const failedKey = action === 'deactivate' ? 'failedToDeactivate' : 'failedToActivate'
      alert(err.message || t(`users.list.${failedKey}`))
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(t('users.list.confirmDelete', { userName }))) return

    try {
      // First try to delete from user_profiles
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        // If deletion fails, try to deactivate as fallback
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          throw new Error(`Failed to delete user: ${updateError.message}`)
        }

        alert(`${t('users.list.userDeactivated')}\n\n${t('users.list.completeDeletionRequiresAdminAccess')}`)
      } else {
        alert(t('users.list.userDeleted'))
      }

      // Refresh the user list
      await loadUsers()
    } catch (err: any) {
      console.error('Delete operation failed:', err)
      alert(`${t('users.list.failedToDelete')}: ${err.message}`)
    }
  }

  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [resetUserEmail, setResetUserEmail] = useState('')
  const [resetUserName, setResetUserName] = useState('')

  const handleResetPassword = (userEmail: string, userName: string) => {
    setResetUserEmail(userEmail)
    setResetUserName(userName)
    setShowPasswordResetModal(true)
  }

  const executePasswordReset = async () => {
    if (!resetUserEmail) return

    try {
      // Always use email-based password reset for now
      const { error: emailError } = await supabase.auth.resetPasswordForEmail(resetUserEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (emailError) {
        throw emailError
      }

      alert(t('users.list.passwordResetEmailSent', { email: resetUserEmail }))
      setShowPasswordResetModal(false)
    } catch (err: any) {
      console.error('Password reset error:', err)
      alert(`${t('users.list.passwordResetError')}: ${err.message}`)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      developer: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    }
    return badges[role] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('users.list.never')
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = useMemo(() => {
    if (!debouncedSearchTerm) return users
    const search = debouncedSearchTerm.toLowerCase()
    return users.filter(user =>
      user.email.toLowerCase().includes(search) ||
      user.full_name.toLowerCase().includes(search)
    )
  }, [users, debouncedSearchTerm])

  const canManageUsers = profile?.role === 'developer' || profile?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              {t('users.list.search')}
            </label>
            <Input
              type="text"
              placeholder={t('users.list.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              {t('users.list.role')}
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('users.list.allRoles')}</option>
              <option value="developer">{t('users.roles.developer')}</option>
              <option value="admin">{t('users.roles.admin')}</option>
              <option value="user">{t('users.roles.user')}</option>
              <option value="viewer">{t('users.roles.viewer')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('users.list.department')}</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('users.list.allDepartments')}</option>
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('users.list.status')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">{t('users.list.allStatus')}</option>
              <option value="ACTIVE">{t('users.list.active')}</option>
              <option value="INACTIVE">{t('users.list.inactive')}</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={loadUsers}
              variant="secondary"
              className="w-full"
            >
              {t('users.list.refresh')}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {t('users.list.showingUsers', { filtered: filteredUsers.length, total: users.length })}
          </p>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t('users.list.loadingUsers')}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-600">{t('users.list.noUsersFound')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.email')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.department')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.lastLogin')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('users.list.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.department_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? t('users.list.active') : t('users.list.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onViewActivity(user.user_id);
                        }}
                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title={t('users.list.viewActivity')}
                        type="button"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canManageUsers && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditUser(user.user_id, user.email);
                            }}
                            className="inline-flex items-center justify-center p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            title={t('users.list.editUser')}
                            type="button"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleStatus(user.user_id, user.is_active);
                            }}
                            className="inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors"
                            title={user.is_active ? t('users.list.deactivate') : t('users.list.activate')}
                            type="button"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResetPassword(user.email, user.full_name);
                            }}
                            className="inline-flex items-center justify-center p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                            title={t('users.list.resetPassword')}
                            type="button"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteUser(user.user_id, user.full_name);
                            }}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title={t('users.list.deleteUser')}
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('users.list.resetPassword')}</h2>
                    <p className="text-sm text-gray-600">{resetUserName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.list.targetEmail')}
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{resetUserEmail}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Email Password Reset</h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>This will send a password reset email to the user. They can click the link to set a new password.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowPasswordResetModal(false)}
              >
                {t('users.form.cancel')}
              </Button>
              <Button
                onClick={executePasswordReset}
              >
                <Key className="w-4 h-4 mr-2" />
                {t('users.list.resetPassword')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
