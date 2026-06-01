import https from 'https';

const SUPABASE_URL = 'qinjlrgvxmplvsotxyth.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmpscmd2eG1wbHZzb3R4eXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDI5OTYsImV4cCI6MjA5MzgxODk5Nn0.Q9J60g0LsOwVAQiE6dywCrkk2Ey64N1byHu-L6uR8IM';

function httpsGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Primeiro: vê todos os campos disponíveis num orçamento
  const sample = await httpsGet('/rest/v1/budgets?limit=1&select=*');
  if (!Array.isArray(sample)) {
    console.log('Erro ou resposta inesperada:', JSON.stringify(sample, null, 2));
    return;
  }
  if (sample.length === 0) {
    console.log('Tabela vazia.');
    return;
  }
  console.log('Campos disponíveis:', Object.keys(sample[0]).join(', '));
  console.log('Status do 1º registro:', sample[0].status);
  console.log('');

  // Agora busca aprovados
  const budgets = await httpsGet('/rest/v1/budgets?status=eq.approved&select=*&order=created_at.desc');

  if (!Array.isArray(budgets) || budgets.length === 0) {
    console.log('Nenhum orçamento com status=approved. Listando todos os status existentes...');
    const all = await httpsGet('/rest/v1/budgets?select=id,status&limit=50');
    const statusSet = [...new Set(all.map(b => b.status))];
    console.log('Status encontrados no banco:', statusSet);
    console.log('\nTodos os registros:');
    all.forEach(b => console.log(` - ID: ${b.id} | status: ${b.status}`));
    return;
  }

  console.log(`✅ ORÇAMENTOS APROVADOS — Total: ${budgets.length}\n`);
  console.log('='.repeat(80));

  for (const b of budgets) {
    const total = Number(b.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const criado = b.created_at ? new Date(b.created_at).toLocaleDateString('pt-BR') : '—';
    const evento = b.data_evento ? new Date(b.data_evento).toLocaleDateString('pt-BR') : '—';
    console.log(`ID:       ${b.id}`);
    console.log(`Projeto:  ${b.nome_projeto || '—'}`);
    console.log(`Cliente:  ${b.cliente || '—'}`);
    console.log(`Total:    R$ ${total}`);
    console.log(`Criado:   ${criado}`);
    console.log(`Evento:   ${evento}`);
    console.log('-'.repeat(80));
  }

  console.log('\n\n📋 JSON PURO:\n');
  console.log(JSON.stringify(budgets, null, 2));
}

main().catch(console.error);
