const postgres = require('postgres');
const sql = postgres('postgres://postgres.viabjxdggrdarcveaxam:P78K%232A!aucTzs9@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function run() {
  const result = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'department_id';
  `;
  console.log('Verification Output:', result);
  process.exit();
}
run();
