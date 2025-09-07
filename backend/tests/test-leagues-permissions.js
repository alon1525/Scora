const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test the service role key specifically for leagues
const supabaseUrl = process.env.SUPABASE_API_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing leagues permissions...');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key exists:', !!serviceRoleKey);
console.log('Service Role Key length:', serviceRoleKey ? serviceRoleKey.length : 'N/A');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testLeaguesPermissions() {
  try {
    console.log('\n=== Testing Leagues Table ===');
    
    // Test 1: Try to select from leagues table
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .limit(1);
    
    if (leaguesError) {
      console.error('❌ Error accessing leagues table:', leaguesError);
    } else {
      console.log('✅ Successfully accessed leagues table');
      console.log('Leagues count:', leagues ? leagues.length : 0);
    }
    
    // Test 2: Try to select from league_memberships table
    console.log('\n=== Testing League Memberships Table ===');
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select('*')
      .limit(1);
    
    if (membershipsError) {
      console.error('❌ Error accessing league_memberships table:', membershipsError);
    } else {
      console.log('✅ Successfully accessed league_memberships table');
      console.log('Memberships count:', memberships ? memberships.length : 0);
    }
    
    // Test 3: Try to call the generate_league_code function
    console.log('\n=== Testing generate_league_code Function ===');
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_league_code');
    
    if (codeError) {
      console.error('❌ Error calling generate_league_code:', codeError);
    } else {
      console.log('✅ Successfully called generate_league_code');
      console.log('Generated code:', codeData);
    }
    
    // Test 4: Check if we can insert into leagues (this should work with service role)
    console.log('\n=== Testing League Creation ===');
    const testLeagueData = {
      name: 'Test League',
      code: 'TEST1234',
      created_by: '00000000-0000-0000-0000-000000000000' // dummy UUID
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('leagues')
      .insert(testLeagueData)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting into leagues:', insertError);
    } else {
      console.log('✅ Successfully inserted into leagues table');
      console.log('Inserted data:', insertData);
      
      // Clean up - delete the test league
      if (insertData && insertData[0]) {
        const { error: deleteError } = await supabase
          .from('leagues')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('❌ Error deleting test league:', deleteError);
        } else {
          console.log('✅ Successfully cleaned up test league');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLeaguesPermissions();
