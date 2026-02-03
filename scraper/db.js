const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Try to load from .env.local for local development
// In GitHub Actions, environment variables are already set
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    console.error('Set them in .env.local for local development or as secrets in GitHub Actions');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
