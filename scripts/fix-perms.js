
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Try to find .env in current dir or parent
const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), 'SSTH-Inventory/.env')
];

let env = {};

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`📄 Found .env at ${p}`);
        const content = fs.readFileSync(p, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, ''); // Remove surrounding quotes
                if (key && !key.startsWith('#')) {
                    env[key] = value;
                }
            }
        });
        break;
    }
}

async function main() {
    let supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    let supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    console.log('--- Supabase Credentials Check ---');
    console.log(`URL Found: ${supabaseUrl ? '✅' : '❌'}`);
    console.log(`Service Key Found: ${supabaseServiceKey ? '✅' : '❌'}`);

    if (!supabaseUrl) {
        supabaseUrl = await askQuestion('👉 Enter Supabase URL: ');
    }

    if (!supabaseServiceKey) {
        console.log('\n⚠️  Service Role Key is missing. This starts with "ey..." and is NOT the anon key.');
        supabaseServiceKey = await askQuestion('👉 Enter Supabase SERVICE ROLE KEY: ');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing credentials. Cannot proceed.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const TARGET_EMAIL = 'nopanat.aplus@gmail.com';

    console.log(`\n🔍 Looking for user: ${TARGET_EMAIL}...`);

    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('❌ Error listing users (Check if your Service Key is correct):', userError.message);
        process.exit(1);
    }

    const user = users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

    if (!user) {
        console.error(`❌ User ${TARGET_EMAIL} not found in Supabase Auth!`);
        console.log('Available users:', users.map(u => u.email).join(', '));
        process.exit(1);
    }

    console.log(`✅ Found Auth User ID: ${user.id}`);

    // Update Profile
    const updates = {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Nopanat Aplus',
        role: 'developer',
        is_active: true
    };

    const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(updates);

    if (upsertError) {
        console.error('❌ Error updating profile:', upsertError.message);
    } else {
        console.log(`\n🎉 SUCCESS! User ${TARGET_EMAIL} is now a DEVELOPER.`);
        console.log('👉 You should be able to access everything now.');
    }

    rl.close();
}

main();
