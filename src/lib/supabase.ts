import { createClient } from '@supabase/supabase-js'
// TODO: Re-enable strict database types after regenerating database.types.ts properly
// import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Temporarily using 'any' types to allow build to pass
// TODO: Re-add <Database> generic after fixing database.types.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
