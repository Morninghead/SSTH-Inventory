import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'admin' | 'manager' | 'user' | 'viewer' | 'developer'
  department_id: string | null
  is_active: boolean
  departments?: {
    dept_name: string
  }
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, departmentId?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  hasPermission: (requiredRole: string) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          departments (dept_name)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data as UserProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    // Works in both dev and production
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string, departmentId?: string) => {
    // Production only - dev mode uses auto-login
    if (import.meta.env.DEV) {
      throw new Error('User registration not available in development mode')
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: 'user', // Default role for new registrations
        department_id: departmentId || null,
        is_active: true,
      })

    if (profileError) {
      // If profile creation fails, we should delete the auth user
      // However, Supabase doesn't allow deleting users from client side
      // So we'll throw an error and let admin handle it
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const hasPermission = (requiredRole: string): boolean => {
    if (!profile) return false

    // Developer has universal access
    if (profile.role === 'developer') return true

    const roleHierarchy = {
      viewer: 0,
      user: 1,
      manager: 2,
      admin: 3,
      developer: 4,
    }

    const userLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy]
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy]

    if (userLevel === undefined || requiredLevel === undefined) {
      return false
    }

    return userLevel >= requiredLevel
  }

  const isAdmin = (): boolean => profile?.role === 'admin' || profile?.role === 'developer'
  const isManager = (): boolean => profile?.role === 'manager' || isAdmin()

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
    isAdmin,
    isManager,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
