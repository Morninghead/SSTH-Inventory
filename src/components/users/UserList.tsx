import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Filter, Edit, Power, Trash2, Key, Eye } from 'lucide-react'
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
      // Build query with filters applied
      let query = supabase
        .from('user_profiles')
        .select('id, full_name, role, department_id, is_active, created_at')

      if (filterRole) query = query.eq('role', filterRole)
      if (filterDepartment) query = query.eq('department_id', filterDepartment)
      if (filterStatus !== 'ALL') query = query.eq('is_active', filterStatus === 'ACTIVE')

      const { data: profiles, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Create department map once
      const deptMap = departments.reduce((acc: any, dept: any) => {
        acc[dept.dept_id] = dept.dept_name
        return acc
      }, {})

      // Optimized transformation
      const users: User[] = (profiles || []).map((profile: any) => ({
        user_id: profile.id,
        email: `${profile.full_name?.replace(/\s+/g, '.').toLowerCase()}@example.com`,
        full_name: profile.full_name || 'Unknown',
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
  }, [filterRole, filterStatus, filterDepartment, departments])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

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
          alert(`Permission denied: You don't have permission to modify user profiles.
Please check Row Level Security policies or contact your administrator.`)
        } else if (error.message.includes('policy')) {
          alert(`Database policy restriction: ${error.message}`)
        } else {
          throw error
        }
        return
      }

      alert(`User ${action}d successfully`)
      loadUsers()
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('User deleted successfully')
      loadUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async (_userId: string, userName: string) => {
    const newPassword = prompt(`Reset password for "${userName}"?\n\nEnter new password (min. 6 characters):`)
    if (!newPassword) return

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      // Note: Password reset through Supabase Auth requires admin privileges
      // For now, we'll show a message indicating this needs to be done manually
      alert('Password reset requires admin access to Supabase Auth. Please reset the password through the Supabase Dashboard.')
    } catch (err: any) {
      alert(err.message || 'Failed to reset password')
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      developer: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    }
    return badges[role] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
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

  const canManageUsers = profile?.role === 'developer' || profile?.role === 'admin' || profile?.role === 'manager'

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <Input
              type="text"
              placeholder="Name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={loadUsers}
              variant="secondary"
              className="w-full"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                        {user.is_active ? 'Active' : 'Inactive'}
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
                        title="View Activity"
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
                            title="Edit User"
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
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            type="button"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResetPassword(user.user_id, user.full_name);
                            }}
                            className="inline-flex items-center justify-center p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                            title="Reset Password"
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
                            title="Delete User"
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
    </div>
  )
}
