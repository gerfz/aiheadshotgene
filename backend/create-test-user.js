require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@admin.ee',
      password: 'admin',
      email_confirm: true, // Auto-confirm the email
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('📧 Email: admin@admin.ee');
    console.log('🔑 Password: admin');
    console.log('👤 User ID:', data.user.id);

    // The trigger will automatically create the profile
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Optional: Give them extra credits or make them a subscriber
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        free_credits: 100, 
        is_subscribed: true 
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.log('⚠️  Warning: Could not update profile:', updateError.message);
    } else {
      console.log('✨ Profile updated with 100 credits and pro subscription!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTestUser();

