const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgnnvnjuxmflshgshcni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbm52bmp1eG1mbHNoZ3NoY25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMyMzYzNSwiZXhwIjoyMDk0ODk5NjM1fQ.nYex-ZFnYqMvmQqPd6m3ZH04lcw8_WriHMn3JfSNRsA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Inspecting Supabase Tables ---');
  
  // 1. Fetch Users
  const { data: users, error: usersErr } = await supabase.from('users').select('id, name, phone, role, email');
  if (usersErr) {
    console.error('Error fetching users:', usersErr.message);
  } else {
    console.log(`\nFound ${users.length} users:`);
    users.forEach(u => console.log(`  User: ID=${u.id}, Name=${u.name}, Phone=${u.phone}, Role=${u.role}, Email=${u.email}`));
  }

  // 2. Fetch Businesses
  const { data: businesses, error: bizErr } = await supabase.from('businesses').select('id, name, category, owner_id');
  if (bizErr) {
    console.error('Error fetching businesses:', bizErr.message);
  } else {
    console.log(`\nFound ${businesses.length} businesses:`);
    businesses.forEach(b => console.log(`  Biz: ID=${b.id}, Name=${b.name}, Category=${b.category}, OwnerID=${b.owner_id}`));
  }

  // 3. Fetch Services
  const { data: services, error: srvErr } = await supabase.from('services').select('id, name, category, provider_id');
  if (srvErr) {
    console.error('Error fetching services:', srvErr.message);
  } else {
    console.log(`\nFound ${services.length} services:`);
    services.forEach(s => console.log(`  Service: ID=${s.id}, Name=${s.name}, Category=${s.category}, ProviderID=${srvErr ? 'error' : s.provider_id}`));
  }

  // 4. Fetch FCM Tokens
  const { data: tokens, error: tokErr } = await supabase.from('user_fcm_tokens').select('*');
  if (tokErr) {
    console.error('Error fetching user_fcm_tokens:', tokErr.message);
  } else {
    console.log(`\nFound ${tokens.length} FCM tokens:`);
    tokens.forEach(t => console.log(`  Token: UserID=${t.user_id}, Device=${t.device}, Token=${t.fcm_token ? t.fcm_token.substring(0, 15) + '...' : 'NULL'}`));
  }
}

check();
