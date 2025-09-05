// Test database connection
// Run this with: node test-db-connection.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing database connection...');
console.log('🔑 Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🔑 Publishable Key exists:', !!process.env.SUPABASE_PUBLISHABLE_KEY);

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

console.log('🔑 Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'PUBLISHABLE');
console.log('🔑 Key starts with:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT FOUND');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testing user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ user_profiles error:', profilesError);
    } else {
      console.log('✅ user_profiles accessible');
    }

    console.log('\n📊 Testing standings table...');
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('count')
      .limit(1);
    
    if (standingsError) {
      console.error('❌ standings error:', standingsError);
    } else {
      console.log('✅ standings accessible');
    }

    console.log('\n📊 Testing fixtures table...');
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('count')
      .limit(1);
    
    if (fixturesError) {
      console.error('❌ fixtures error:', fixturesError);
    } else {
      console.log('✅ fixtures accessible');
    }

    console.log('\n🎯 Testing insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        display_name: 'Test User'
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
