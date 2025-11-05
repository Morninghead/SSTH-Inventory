/**
 * Password Reset Script for SSTH Inventory System
 *
 * This script resets a user's password in Supabase
 * Requires: Supabase Service Role Key (admin access)
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = 'https://viabjxdggrdarcveaxam.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'

// User to update
const USER_EMAIL = 'nopanat.aplus@gmail.com'
const NEW_PASSWORD = '1234567890'

async function resetPassword() {
  console.log('🔐 SSTH Inventory - Password Reset Tool\n')
  console.log('=' .repeat(50))

  // Validate service role key
  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ ERROR: Service Role Key not provided!')
    console.log('\n📝 How to get your Service Role Key:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project: viabjxdggrdarcveaxam')
    console.log('3. Settings → API → Project API keys')
    console.log('4. Copy the "service_role" key (NOT the anon key)')
    console.log('\n💡 Usage:')
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-key node reset-password.js')
    console.log('   OR edit this file and replace YOUR_SERVICE_ROLE_KEY_HERE\n')
    process.exit(1)
  }

  try {
    // Create admin client with service role key
    console.log('🔧 Creating Supabase admin client...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Connected to Supabase\n')
    console.log('👤 Target User:', USER_EMAIL)
    console.log('🔑 New Password:', '*'.repeat(NEW_PASSWORD.length))
    console.log('')

    // First, get the user by email
    console.log('🔍 Looking up user...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const user = users.users.find(u => u.email === USER_EMAIL)

    if (!user) {
      console.error(`❌ User not found: ${USER_EMAIL}`)
      console.log('\n💡 Available users:')
      users.users.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`)
      })
      process.exit(1)
    }

    console.log(`✅ User found: ${user.email} (ID: ${user.id})`)

    // Update the user's password
    console.log('\n🔄 Updating password...')
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: NEW_PASSWORD }
    )

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`)
    }

    console.log('✅ Password updated successfully!\n')
    console.log('=' .repeat(50))
    console.log('✨ Password Reset Complete!')
    console.log('=' .repeat(50))
    console.log('\n📋 Login Credentials:')
    console.log(`   Email:    ${USER_EMAIL}`)
    console.log(`   Password: ${NEW_PASSWORD}`)
    console.log('\n🌐 Login at: http://localhost:5173/login')
    console.log('   (or your deployed URL)')
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.log('\n🔍 Troubleshooting:')
    console.log('1. Verify Service Role Key is correct')
    console.log('2. Check Supabase project is active')
    console.log('3. Ensure user exists in Authentication → Users')
    console.log('4. Check network connection\n')
    process.exit(1)
  }
}

// Run the script
resetPassword()
