// Test user profile creation
// Run this with: node test-user-creation.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing user profile creation...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreation() {
  try {
    // Test creating a user profile
    const testUserId = '00000000-0000-0000-0000-000000000002';
    
    console.log('📊 Creating test user profile...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        email: 'test2@example.com',
        display_name: 'Test User 2',
        table_prediction: [
          'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
          'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
          'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
          'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
        ],
        fixture_points: 0,
        table_points: 20, // Should have 20 points for default prediction
        total_points: 20,
        fixture_predictions: {}
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
    }

    // Test reading the user profile
    console.log('\n📊 Reading user profile...');
    const { data: profile, error: readError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (readError) {
      console.error('❌ Read error:', readError);
    } else {
      console.log('✅ Profile read successfully:', profile);
    }

    // Test updating scores
    console.log('\n📊 Testing score update...');
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        table_points: 20,
        total_points: 20
      })
      .eq('user_id', testUserId)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log('✅ Update successful:', updateData);
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserCreation();
