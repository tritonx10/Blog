const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables.');
  console.error(`   SUPABASE_URL present: ${!!supabaseUrl} (length: ${supabaseUrl?.length || 0})`);
  console.error(`   SUPABASE_KEY present: ${!!supabaseKey} (length: ${supabaseKey?.length || 0})`);
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = supabase;
