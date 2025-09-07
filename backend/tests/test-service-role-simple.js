const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test with different key combinations
const supabaseUrl = process.env.SUPABASE_API_URL;

console.log('Testing different Supabase key configurations...\n');

// Test 1: Service Role Key
console.log('=== Test 1: Service Role Key ===');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseService = createClient(supabaseUrl, serviceRoleKey);

// Test 2: Publishable Key
console.log('=== Test 2: Publishable Key ===');
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabasePublishable = createClient(supabaseUrl, publishableKey);

async function testKeys() {
  try {
    // Test service role key
    console.log('Service Role Key length:', serviceRoleKey ? serviceRoleKey.length : 'NOT_FOUND');
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (serviceError) {
      console.error('❌ Service role key error:', serviceError.message);
    } else {
      console.log('✅ Service role key works for user_profiles');
    }
    
    // Test publishable key
    console.log('Publishable Key length:', publishableKey ? publishableKey.length : 'NOT_FOUND');
    const { data: publishableData, error: publishableError } = await supabasePublishable
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (publishableError) {
      console.error('❌ Publishable key error:', publishableError.message);
    } else {
      console.log('✅ Publishable key works for user_profiles');
    }
    
    // Now test leagues with service role key
    console.log('\n=== Testing Leagues with Service Role Key ===');
    const { data: leaguesData, error: leaguesError } = await supabaseService
      .from('leagues')
      .select('*')
      .limit(1);
    
    if (leaguesError) {
      console.error('❌ Service role key error on leagues:', leaguesError.message);
      console.error('Full error:', leaguesError);
    } else {
      console.log('✅ Service role key works for leagues');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testKeys();
