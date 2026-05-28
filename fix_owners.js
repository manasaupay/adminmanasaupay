const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgnnvnjuxmflshgshcni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbm52bmp1eG1mbHNoZ3NoY25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMyMzYzNSwiZXhwIjoyMDk0ODk5NjM1fQ.nYex-ZFnYqMvmQqPd6m3ZH04lcw8_WriHMn3JfSNRsA';
const supabase = createClient(supabaseUrl, supabaseKey);

const partnerId = '5dc4446a-e7a0-4d3a-85c5-4474caf25270';

async function fix() {
  console.log('--- Linking Listings to Partner User ---');

  // 1. Update businesses (Sahyog Medical Store)
  const { data: bData, error: bErr } = await supabase
    .from('businesses')
    .update({ owner_id: partnerId })
    .eq('id', '12e88903-cef1-45fc-aae3-4fe54eabebc5');
    
  if (bErr) {
    console.error('Error updating business:', bErr.message);
  } else {
    console.log('Successfully set owner_id for Sahyog Medical Store!');
  }

  // 2. Update services (Vedang Soni - Home Services)
  const { data: sData, error: sErr } = await supabase
    .from('services')
    .update({ provider_id: partnerId })
    .eq('id', 'b9c97324-5112-498a-bd4c-c9aaa0c6e568');
    
  if (sErr) {
    console.error('Error updating service:', sErr.message);
  } else {
    console.log('Successfully set provider_id for Vedang Soni service!');
  }
}

fix();
