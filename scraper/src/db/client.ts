import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional: for admin tasks if available

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
}

// Use Service Key if available for better permissions (bypassing RLS), otherwise Anon Key
const clientKey = serviceKey || supabaseKey;

export const supabase: SupabaseClient = createClient(supabaseUrl, clientKey);

export function getClient(): SupabaseClient {
    return supabase;
}
