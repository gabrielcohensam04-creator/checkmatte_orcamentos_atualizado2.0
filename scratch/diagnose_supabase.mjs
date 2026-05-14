import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import ws from 'ws';

// Parse .env file
const envContent = readFileSync('/Users/gabrielcohen/Desktop/ANTYGRAVITY/checkmatte_orcamentos/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0) {
    env[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: ws }
});

async function run() {
  console.log('=== DIAGNÓSTICO SUPABASE ===');
  console.log('URL:', SUPABASE_URL);
  console.log('');

  // Test 1: SELECT from empresas
  console.log('--- TESTE 1: SELECT * FROM empresas ---');
  const { data: selectData, error: selectError } = await supabase.from('empresas').select('*').limit(5);
  if (selectError) {
    console.log('❌ SELECT FALHOU:', selectError.message, '| Código:', selectError.code, '| Hint:', selectError.hint);
  } else {
    console.log('✅ SELECT OK — registros encontrados:', selectData.length);
    if (selectData.length > 0) console.log('   Colunas:', Object.keys(selectData[0]));
  }
  console.log('');

  // Test 2: INSERT into empresas
  console.log('--- TESTE 2: INSERT INTO empresas ---');
  const payload = {
    razao_social: 'Empresa Diagnóstico TEMP',
    cnpj: '00.000.000/0001-99',
    contato: 'Teste',
    responsavel: 'Antigravity Bot'
  };
  const { data: insertData, error: insertError } = await supabase.from('empresas').insert(payload).select();
  if (insertError) {
    console.log('❌ INSERT FALHOU');
    console.log('   Mensagem:', insertError.message);
    console.log('   Código:', insertError.code);
    console.log('   Detalhes:', insertError.details);
    console.log('   Hint:', insertError.hint);
  } else {
    console.log('✅ INSERT OK — dados salvos:', JSON.stringify(insertData));
    if (insertData && insertData.length > 0) {
      await supabase.from('empresas').delete().eq('id', insertData[0].id);
      console.log('✅ Registro temporário deletado');
    }
  }

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
