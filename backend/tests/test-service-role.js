const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test the service role key
const supabaseUrl = "https://nopucomnlyvogmfdldaw.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3NjM0NiwiZXhwIjoyMDcyNTUyMzQ2fQ.fhLP5B0-zi2THxKZ3ZJ6ukKC7IuuC2y3MsyIsm4a8Gk";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testServiceRole() {
  try {
    console.log('Testing service role key...');
    
    // Test 1: Check if we can access user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error accessing user_profiles:', profilesError);
    } else {
      console.log('✅ Successfully accessed user_profiles table');
    }
    
    // Test 2: Check if leagues table exists
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .limit(1);
    
    if (leaguesError) {
      console.error('❌ Error accessing leagues table:', leaguesError);
    } else {
      console.log('✅ Successfully accessed leagues table');
    }
    
    // Test 3: Check if league_memberships table exists
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select('*')
      .limit(1);
    
    if (membershipsError) {
      console.error('❌ Error accessing league_memberships table:', membershipsError);
    } else {
      console.log('✅ Successfully accessed league_memberships table');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testServiceRole();
