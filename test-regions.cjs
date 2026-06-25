const postgres = require('postgres');
const regions = ['ap-southeast-1', 'us-east-1', 'eu-central-1', 'us-west-1', 'ap-northeast-1', 'ap-southeast-2', 'sa-east-1', 'ca-central-1', 'eu-west-1', 'eu-west-2'];
const projectRef = 'viabjxdggrdarcveaxam';
async function test() {
  for (const r of regions) {
    console.log('Testing', r);
    const sql = postgres(`postgres://postgres.${projectRef}:P78K%232A!aucTzs9@aws-0-${r}.pooler.supabase.com:5432/postgres`, { connect_timeout: 5, max: 1 });
    try {
      await sql`SELECT 1`;
      console.log('SUCCESS:', r);
      process.exit(0);
    } catch(e) {
      console.log('FAILED', r, e.message);
    } finally {
        await sql.end();
    }
  }
}
test();
