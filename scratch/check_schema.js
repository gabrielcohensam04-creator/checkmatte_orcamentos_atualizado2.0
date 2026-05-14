import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Read .env from the project root
const envFile = fs.readFileSync('/Users/gabrielcohen/Desktop/ANTYGRAVITY/checkmatte_orcamentos/.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabase = createSupabaseClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('Checking table: empresas');
  const { data, error } = await supabase.from('empresas').insert({ dummy_column_test: 'test' }).select();
  if (error) {
    console.log('Error caught:');
    console.log(error.message);
    console.log('Hint:', error.hint);
    console.log('Details:', error.details);
  } else {
    console.log('Insert successful:', data);
  }
}

checkSchema();
