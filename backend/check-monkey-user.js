const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nopucomnlyvogmfdldaw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ'
);

async function checkMonkeyUser() {
  console.log('🔍 Checking monkey user in user_profiles table...');
  
  const { data: monkeyProfile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('display_name', 'The Monkey')
    .single();
    
  if (error) {
    console.error('❌ Error finding monkey user:', error);
    return;
  }
  
  if (monkeyProfile) {
    console.log('✅ Found monkey user:');
    console.log('  - ID:', monkeyProfile.id);
    console.log('  - Display Name:', monkeyProfile.display_name);
    console.log('  - Total Points:', monkeyProfile.total_points);
    console.log('  - Fixture Points:', monkeyProfile.fixture_points);
    console.log('  - Table Points:', monkeyProfile.table_points);
    console.log('  - Created At:', monkeyProfile.created_at);
  } else {
    console.log('❌ Monkey user not found in user_profiles table');
  }
  
  console.log('\n🔍 Checking all users in leaderboard...');
  const { data: allUsers, error: allError } = await supabase
    .from('user_profiles')
    .select('display_name, total_points, fixture_points, table_points')
    .order('total_points', { ascending: false });
    
  if (allError) {
    console.error('❌ Error fetching all users:', allError);
    return;
  }
  
  console.log('📊 All users:');
  allUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.display_name}: ${user.total_points} total (${user.fixture_points} fixture + ${user.table_points} table)`);
  });
}

checkMonkeyUser().catch(console.error);
