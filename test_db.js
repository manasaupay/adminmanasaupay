const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgnnvnjuxmflshgshcni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbm52bmp1eG1mbHNoZ3NoY25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMyMzYzNSwiZXhwIjoyMDk0ODk5NjM1fQ.nYex-ZFnYqMvmQqPd6m3ZH04lcw8_WriHMn3JfSNRsA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('categories').select('*');
  console.log('Categories Count:', data ? data.length : 0);
  console.log('Categories:', data);
  if (error) console.error('Error:', error);
}

run();
