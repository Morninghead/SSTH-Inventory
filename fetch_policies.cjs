const postgres = require('postgres');
const sql = postgres('postgres://postgres.viabjxdggrdarcveaxam:P78K%232A!aucTzs9@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function run() {
  try {
    const policies = await sql.unsafe("SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('suppliers', 'vendors')");
    console.log(JSON.stringify(policies, null, 2));
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit();
  }
}
run();
