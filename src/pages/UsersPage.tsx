import { useState } from 'react'
import { Users, Plus, List, UserPlus } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import UserForm from '../components/users/UserForm'
import UserList from '../components/users/UserList'
import ActivityLog from '../components/users/ActivityLog'

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editUserEmail, setEditUserEmail] = useState<string>('')
  const [activityUserId, setActivityUserId] = useState<string | null>(null)
  const [activityUserName, setActivityUserName] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setShowForm(false)
    setEditUserId(null)
    setEditUserEmail('')
  }

  const handleEditUser = (userId: string, userEmail: string) => {
    setEditUserId(userId)
    setEditUserEmail(userEmail)
    setShowForm(true)
    setActiveTab('create')
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditUserId(null)
    setEditUserEmail('')
    setActiveTab('list')
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditUserId(null)
    setEditUserEmail('')
  }

  const tabs = [
    {
      id: 'list',
      label: 'Users',
      icon: <List className="w-5 h-5" />,
    },
    {
      id: 'create',
      label: 'Add User',
      icon: <UserPlus className="w-5 h-5" />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-gray-600">Manage users, roles, and permissions</p>
          </div>
          <Users className="w-10 h-10 text-blue-500" />
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          <div className="mt-6">
            {activeTab === 'list' && (
              <UserList
                onEditUser={handleEditUser}
                onViewActivity={(userId) => {
                  setActivityUserId(userId)
                  setActivityUserName('User Activity')
                }}
                refreshTrigger={refreshTrigger}
              />
            )}

            {activeTab === 'create' && (
              <div>
                {showForm ? (
                  <UserForm
                    userId={editUserId || undefined}
                    userEmail={editUserEmail || undefined}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Create New User
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add a new user to the system with email, password, and role assignment
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New User
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Log Modal */}
      {activityUserId && (
        <ActivityLog
          userId={activityUserId}
          userName={activityUserName}
          onClose={() => setActivityUserId(null)}
        />
      )}
    </MainLayout>
  )
}
