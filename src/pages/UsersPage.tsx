import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Key } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import UserFormModal from '../components/users/UserFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../types/database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface UserWithDepartment extends UserProfile {
  departments: { dept_name: string } | null
}

export default function UsersPage() {
  const { user: currentUser, profile: currentProfile } = useAuth()
  const [users, setUsers] = useState<UserWithDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [searchTerm])

  const loadUsers = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          departments(dept_name)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(
          `email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      setUsers((data as unknown as UserWithDepartment[]) || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setSelectedUser(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user)
    setIsFormModalOpen(true)
  }

  const handleDeleteClick = (user: UserProfile) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setSuccessMessage(selectedUser ? 'User updated successfully!' : 'User created successfully!')
    loadUsers()
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    setDeleteLoading(true)
    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      setSuccessMessage('User deactivated successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      loadUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error deactivating user:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: !user.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccessMessage(
        !user.is_active ? 'User activated successfully!' : 'User deactivated successfully!'
      )
      loadUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const handleResetPassword = async (user: UserProfile) => {
    if (!user.email) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccessMessage('Password reset email sent successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      alert('Failed to send password reset email: ' + error.message)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      developer: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<string, string> = {
      developer: 'Developer',
      admin: 'Admin',
      manager: 'Manager',
      user: 'User',
      viewer: 'Viewer',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[role] || colors.viewer}`}>
        {labels[role] || role}
      </span>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-gray-600">Manage users, roles, and permissions</p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No users found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try a different search term' : 'Start by adding your first user'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const isCurrentUser = user.id === currentUser?.id

                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600">(You)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role || 'viewer')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.departments?.dept_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => !isCurrentUser && handleToggleActive(user)}
                            disabled={isCurrentUser}
                            className="flex items-center space-x-1"
                          >
                            {user.is_active ? (
                              <>
                                <UserCheck className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Active</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-600 font-medium">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="text-purple-600 hover:text-purple-900 transition-colors"
                            title="Reset password"
                          >
                            <Key className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            disabled={isCurrentUser}
                            className={`${
                              isCurrentUser
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            } transition-colors`}
                            title={isCurrentUser ? 'Cannot delete yourself' : 'Deactivate user'}
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Total Count */}
          {users.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Total users: <span className="font-medium">{users.length}</span>
                {searchTerm && ' (filtered)'}
              </p>
            </div>
          )}
        </Card>

        {/* Success Message */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
            {successMessage}
          </div>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        user={selectedUser}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${selectedUser?.full_name}"? They will no longer be able to login.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </MainLayout>
  )
}
