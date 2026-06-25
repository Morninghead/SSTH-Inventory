import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'node:path'
import net from 'node:net'
import dns from 'node:dns/promises'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const projectRef = process.env.VITE_SUPABASE_URL
  ? new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
  : 'viabjxdggrdarcveaxam'

export function createDb() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (dbUrl) {
    return postgres(dbUrl, {
      ssl: 'require',
      max: 1,
    })
  }

  const password = process.env.SUPABASE_DB_PASSWORD
  if (!password) {
    throw new Error('Missing SUPABASE_DB_URL, DATABASE_URL, or SUPABASE_DB_PASSWORD in .env')
  }

  const host = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`

  return postgres({
    host,
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password,
    ssl: 'require',
    max: 1,
    socket: process.env.SUPABASE_DB_RESOLVE6 === '1'
      ? async () => {
          const [address] = await dns.resolve6(host)
          return await new Promise<net.Socket>((resolve, reject) => {
            const socket = new net.Socket()
            socket.once('error', reject)
            socket.connect({ host: address, port: 5432, family: 6 }, () => {
              socket.off('error', reject)
              ;(socket as any).host = host
              ;(socket as any).port = 5432
              resolve(socket)
            })
          })
        }
      : undefined,
  } as any)
}

export const testTag = 'TEST-FULL'
export const current = new Date()
export const planMonth = current.getMonth() + 1
export const planYear = current.getFullYear()
export const currentPeriod = `${planYear}-${String(planMonth).padStart(2, '0')}`
export const previousDate = new Date(planYear, current.getMonth() - 1, 1)
export const previousPeriod = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`

export const departments = [
  ['TEST-DEP-HK', 'Test Housekeeping'],
  ['TEST-DEP-FB', 'Test Food & Beverage'],
  ['TEST-DEP-ENG', 'Test Engineering'],
  ['TEST-DEP-SPA', 'Test Spa'],
] as const

export const categories = [
  ['TEST-CAT-LINEN', 'Test Linen'],
  ['TEST-CAT-CHEM', 'Test Chemicals'],
  ['TEST-CAT-FOOD', 'Test Food'],
  ['TEST-CAT-MAINT', 'Test Maintenance'],
] as const

export const suppliers = [
  ['TEST-SUP-ACTIVE', 'Test Active Supplier', true],
  ['TEST-SUP-INACTIVE', 'Test Deleted Supplier', false],
] as const

export const vendorCategories = [
  ['TEST-VENCAT-GEN', 'Test General Vendors'],
  ['TEST-VENCAT-FNB', 'Test F&B Vendors'],
] as const

export const vendors = [
  ['TEST-VEN-ACTIVE', 'Test Active Vendor Co., Ltd.', 'TEST-VENCAT-GEN', true],
  ['TEST-VEN-INACTIVE', 'Test Deleted Vendor Co., Ltd.', 'TEST-VENCAT-FNB', false],
] as const

export const items = [
  ['TEST-ITEM-TOWEL', 'Test Bath Towel', 'TEST-CAT-LINEN', 'PCS', 120, 20, true],
  ['TEST-ITEM-SHEET', 'Test Bed Sheet', 'TEST-CAT-LINEN', 'PCS', 220, 15, true],
  ['TEST-ITEM-SOAP', 'Test Guest Soap', 'TEST-CAT-CHEM', 'PCS', 18, 50, true],
  ['TEST-ITEM-SHAMPOO', 'Test Shampoo Bottle', 'TEST-CAT-CHEM', 'PCS', 35, 40, true],
  ['TEST-ITEM-RICE', 'Test Jasmine Rice', 'KG', 'KG', 42, 30, true],
  ['TEST-ITEM-COFFEE', 'Test Coffee Beans', 'KG', 'KG', 310, 10, true],
  ['TEST-ITEM-BULB', 'Test LED Bulb', 'TEST-CAT-MAINT', 'PCS', 85, 25, true],
  ['TEST-ITEM-FILTER', 'Test AC Filter', 'TEST-CAT-MAINT', 'PCS', 190, 12, true],
  ['TEST-ITEM-GLOVE', 'Test Cleaning Gloves', 'PCS', 'PCS', 28, 35, true],
  ['TEST-ITEM-WATER', 'Test Bottled Water', 'PCS', 'PCS', 9, 100, true],
  ['TEST-ITEM-LOW', 'Test Low Stock Item', 'PCS', 'PCS', 55, 25, true],
  ['TEST-ITEM-OUT', 'Test Out Of Stock Item', 'PCS', 'PCS', 75, 10, true],
  ['TEST-ITEM-DELETED', 'Test Deleted Inventory Item', 'PCS', 'PCS', 99, 5, false],
] as const

export async function tableExists(sql: postgres.Sql, tableName: string) {
  const rows = await sql`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = ${tableName}
    ) as exists
  `
  return Boolean(rows[0]?.exists)
}

export async function actorId(sql: postgres.Sql) {
  const rows = await sql`
    select id from user_profiles
    where is_active is distinct from false
    order by case when role in ('developer', 'admin') then 0 else 1 end, created_at nulls last
    limit 1
  `
  if (!rows[0]?.id) {
    throw new Error('No active user_profiles row found; create/login a user before seeding test data.')
  }
  return rows[0].id as string
}

export async function idsByCode(sql: postgres.Sql, table: string, codeColumn: string, idColumn: string, codes: readonly string[]) {
  const rows = await sql.unsafe(
    `select ${idColumn} as id, ${codeColumn} as code from ${table} where ${codeColumn} = any($1)`,
    [codes],
  )
  return Object.fromEntries(rows.map((row) => [row.code, row.id])) as Record<string, string>
}
