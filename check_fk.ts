import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read env variables manually
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data, error } = await supabase.rpc('duplicate_fk_check', {}).catch(e => ({ data: null, error: e }));
    console.log("Looking for transactions endpoint error...");

    // reproduce the frontend error:
    const res = await supabase
        .from('transactions')
        .select(`
    *,
    departments (dept_name),
    suppliers (supplier_name),
    user_profiles:created_by (full_name),
    transaction_lines (
      *,
      items (*)
    )
  `)
        .limit(1);

    if (res.error) console.log(JSON.stringify(res.error, null, 2));
    else console.log(res.data);
}

run()
