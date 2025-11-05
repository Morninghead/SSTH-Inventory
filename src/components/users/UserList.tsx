import { useState, useEffect } from 'react'
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

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [filterRole, filterStatus, filterDepartment, refreshTrigger])

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('dept_name')
    setDepartments(data || [])
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_users_list' as any, {
          p_role: filterRole || null,
          p_department_id: filterDepartment || null,
          p_is_active: filterStatus === 'ALL' ? null : filterStatus === 'ACTIVE',
          p_search: searchTerm || null
        })

      if (error) throw error
      setUsers((data as any) || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const { data, error } = await supabase
        .rpc('toggle_user_status' as any, {
          p_user_id: userId,
          p_is_active: !currentStatus
        })

      if (error) throw error

      const result = data as any
      if (result?.[0] && !result[0].success) {
        alert(result[0].message || `Failed to ${action} user`)
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
      const { data, error } = await supabase
        .rpc('delete_user' as any, {
          p_user_id: userId
        })

      if (error) throw error

      const result = data as any
      if (result?.[0] && !result[0].success) {
        alert(result[0].message || 'Failed to delete user')
        return
      }

      alert('User deleted successfully')
      loadUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = prompt(`Reset password for "${userName}"?\n\nEnter new password (min. 6 characters):`)
    if (!newPassword) return

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      const { data, error } = await supabase
        .rpc('admin_reset_password' as any, {
          p_user_id: userId,
          p_new_password: newPassword
        })

      if (error) throw error

      const result = data as any
      if (result?.[0] && !result[0].success) {
        alert(result[0].message || 'Failed to reset password')
        return
      }

      alert('Password reset successfully')
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

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      user.email.toLowerCase().includes(search) ||
      user.full_name.toLowerCase().includes(search)
    )
  })

  const canManageUsers = profile?.role === 'developer' || profile?.role === 'admin'

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
                        onClick={() => onViewActivity(user.user_id)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        title="View Activity"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canManageUsers && (
                        <>
                          <button
                            onClick={() => onEditUser(user.user_id, user.email)}
                            className="inline-flex items-center text-green-600 hover:text-green-700"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                            className="inline-flex items-center text-yellow-600 hover:text-yellow-700"
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.user_id, user.full_name)}
                            className="inline-flex items-center text-purple-600 hover:text-purple-700"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                            className="inline-flex items-center text-red-600 hover:text-red-700"
                            title="Delete User"
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
