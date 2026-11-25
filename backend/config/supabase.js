const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Initialized client successfully.');
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err.message);
  }
} else {
  console.log('[Supabase] Credentials not set in .env. Operating in in-memory fallback mode.');
}

module.exports = supabase;
