@"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Constants
export const DEPARTMENTS = [
  'Admin', 'Coating', 'Maintenance', 'Marketing', 'Mold',
  'Production', 'Purchasing', 'QA', 'R&D', 'SCM', 'PI'
]

export const UNITS = ['EA', 'Dozen', 'Pair', 'Box', 'Pack', 'Set', 'Kg', 'L']

export const UNIT_CONVERSIONS = {
  'Dozen': 12,
  'Pair': 2,
  'Box': 1,
  'Pack': 1,
  'Set': 1,
  'EA': 1,
  'Kg': 1,
  'L': 1
}
"@ | Out-File -FilePath "src/services/supabase.js" -Encoding UTF8
