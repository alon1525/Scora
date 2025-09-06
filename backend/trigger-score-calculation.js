const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Use the same supabase client as the server
const supabase = createClient(
  'https://nopucomnlyvogmfdldaw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ'
);

async function triggerScoreCalculation() {
  console.log('🔄 Triggering score calculation...');
  
  try {
    // Call the update-all-scores endpoint
    const response = await axios.post('http://localhost:3001/api/predictions/update-all-scores');
    
    if (response.data.success) {
      console.log('✅ Score calculation completed successfully');
      console.log('📊 Updated scores:', response.data);
    } else {
      console.log('❌ Score calculation failed:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error triggering score calculation:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the script
triggerScoreCalculation().catch(console.error);
