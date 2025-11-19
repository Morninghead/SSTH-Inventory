// Quick script to create test user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://viabjxdggrdarcveaxam.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYWJqeGRnZ3JkYXJjdmVheGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg3Njc3NjQsImV4cCI6MjAxNDM0Mzc2NH0.YMI-7-RHdY-sP8M2KxQlGHHpNZIuUb4J2aI7qUpVdZY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
