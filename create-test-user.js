// Quick script to create test user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://viabjxdggrdarcveaxam.supabase.co'
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE' // You need to add this from Supabase dashboard

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123',
      email_confirm: true,
    })

    if (authError) throw authError

    console.log('✅ Test user created!')
    console.log('Email: admin@test.com')
    console.log('Password: admin123')
    console.log('User ID:', authData.user.id)

    // Create user profile
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authData.user.id,
      full_name: 'Admin User',
      role: 'admin',
      is_active: true,
    })

    if (profileError) throw profileError

    console.log('✅ User profile created with admin role!')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

createTestUser()
