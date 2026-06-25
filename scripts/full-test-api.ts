import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { categories, currentPeriod, departments, items, planMonth, planYear, previousPeriod, suppliers, testTag, vendorCategories, vendors } from './full-test-db.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export { categories, currentPeriod, departments, items, planMonth, planYear, previousPeriod, suppliers, testTag, vendorCategories, vendors }

export function createApi() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  return createClient(url, key)
}

export async function signInTestUser(supabase: ReturnType<typeof createApi>) {
  const email = 'test_seed_user_2@example.com'
  const password = 'Password123!'
  let { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const signed = await supabase.auth.signUp({ email, password })
    data = signed.data
    error = signed.error
  }

  if (error) throw error
  if (!data.user) throw new Error('No test auth user returned')

  await supabase.from('user_profiles').upsert({
    id: data.user.id,
    full_name: 'Test Seed User',
    role: 'developer',
    is_active: true,
  })

  return data.user.id
}

export async function must<T>(label: string, request: PromiseLike<{ data: T; error: any }>) {
  const { data, error } = await request
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

export async function idsByCode(
  supabase: ReturnType<typeof createApi>,
  table: string,
  codeColumn: string,
  idColumn: string,
  codes: readonly string[],
) {
  const data = await must<any[]>(`load ${table}`, supabase.from(table).select(`${idColumn}, ${codeColumn}`).in(codeColumn, codes))
  return Object.fromEntries((data || []).map((row) => [row[codeColumn], row[idColumn]])) as Record<string, string>
}

export async function tableExists(supabase: ReturnType<typeof createApi>, table: string) {
  const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1)
  return !error
}

export async function countRows(supabase: ReturnType<typeof createApi>, label: string, build: any) {
  const { count, error } = await build
  if (error) throw new Error(`${label}: ${error.message}`)
  return count || 0
}
