const postgres = require('postgres');
const sql = postgres('postgres://postgres:P78K%232A!aucTzs9@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres', { connect_timeout: 10, max: 1 });
sql`SELECT 1`.then(() => { console.log('SUCCESS'); process.exit(0); }).catch(e => { console.log('FAILED', e.message); process.exit(1); });
