// Check all users in the database
// Run this with: node check-users.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Checking all users in database...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', 'desc');

    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} user profiles:\n`);

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. User ID: ${profile.user_id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Display Name: ${profile.display_name}`);
      console.log(`   Table Points: ${profile.table_points}`);
      console.log(`   Fixture Points: ${profile.fixture_points}`);
      console.log(`   Total Points: ${profile.total_points}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkUsers();
