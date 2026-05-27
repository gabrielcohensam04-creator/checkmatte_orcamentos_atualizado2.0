const SUPABASE_URL = 'https://qinjlrgvxmplvsotxyth.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmpscmd2eG1wbHZzb3R4eXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDI5OTYsImV4cCI6MjA5MzgxODk5Nn0.Q9J60g0LsOwVAQiE6dywCrkk2Ey64N1byHu-L6uR8IM';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function query(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers });
  return res.json();
}

async function main() {
  // Busca o orçamento MEGA DANCE
  const budgets = await query('budgets', '?nome_projeto=ilike.*MEGA*&select=id,nome_projeto,total');
  if (!budgets || budgets.length === 0) { console.log('Não encontrado'); return; }
  
  const b = budgets[0];
  const budgetId = b.id;
  console.log(`Analisando: ${b.nome_projeto} (ID: ${budgetId})`);
  console.log(`Total salvo: R$ ${Number(b.total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\n`);

  // =============================================
  // DADOS BRUTOS DA EQUIPE NO BANCO
  // =============================================
  const team = await query('budget_team', `?budget_id=eq.${budgetId}&select=*`);
  
  console.log('======== DADOS BRUTOS DO BANCO (budget_team) ========');
  for (const e of team) {
    console.log(`  [${e.funcao}]`);
    console.log(`    quantidade: ${e.quantidade}`);
    console.log(`    valor_diaria: R$ ${Number(e.valor_diaria).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
    console.log(`    quantidade_diarias: ${e.quantidade_diarias}`);
    console.log(`    verba_alimentacao: R$ ${Number(e.verba_alimentacao||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
    console.log('');
  }

  // =============================================
  // COMO O APP REPLICA A LÓGICA (igual ao CreateBudget.jsx)
  // =============================================
  console.log('======== COMO O APP CALCULA (réplica exata do código) ========');
  
  // O app pega verbaAlimentacao do PRIMEIRO membro
  const firstMember = team[0];
  const verbaAlimentacao = Number(firstMember?.verba_alimentacao || 0);
  
  // O app pega verbaMotorista do PRIMEIRO motorista encontrado
  const motoristaRow = team.find(x => x.funcao.startsWith('Motorista'));
  const verbaMotorista = Number(motoristaRow?.verba_alimentacao || 0);
  
  console.log(`\nverbaAlimentacao (do 1º membro "${firstMember?.funcao}"): R$ ${verbaAlimentacao.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  console.log(`verbaMotorista (do 1º motorista "${motoristaRow?.funcao}"): R$ ${verbaMotorista.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  
  console.log('\n--- Cálculo por membro ---');
  let totalSalarios = 0;
  let totalVerbas = 0;
  
  for (const e of team) {
    const qtd = Number(e.quantidade) || 0;
    const valorDiaria = Number(e.valor_diaria) || 0;
    const qtdDiarias = Number(e.quantidade_diarias) || 1;
    const isDriver = e.funcao.startsWith('Motorista');
    const verba = isDriver ? verbaMotorista : verbaAlimentacao;
    
    const salario = qtd * valorDiaria * qtdDiarias;
    const verbaMembro = verba * qtd * qtdDiarias;
    
    totalSalarios += salario;
    totalVerbas += verbaMembro;
    
    console.log(`\n  ${e.funcao}:`);
    console.log(`    Salário: ${qtd} × R$${valorDiaria} × ${qtdDiarias} diárias = R$ ${salario.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
    console.log(`    Verba:   R$${verba} × ${qtd} pessoas × ${qtdDiarias} diárias = R$ ${verbaMembro.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
    console.log(`    Subtotal: R$ ${(salario+verbaMembro).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  }
  
  const totalEquipe = totalSalarios + totalVerbas;
  console.log('\n======== RESUMO EQUIPE ========');
  console.log(`  Total Salários: R$ ${totalSalarios.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  console.log(`  Total Verbas:   R$ ${totalVerbas.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  console.log(`  TOTAL EQUIPE:   R$ ${totalEquipe.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);

  // =============================================
  // PROBLEMA: Operadores de Câmera faltando?
  // =============================================
  console.log('\n======== VERIFICAÇÃO: Funções cadastradas no banco ========');
  const funcoesSalvas = team.map(e => e.funcao);
  const funcoesEsperadas = [
    'Operadores de Câmera', 'Assistentes', 'Técnicos de Câmeras',
    'Video Man', 'Coordenadores', 'Técnicos de Sistemas',
    'Maquinistas', 'Motorista - Carros', 'Motorista - Caminhão'
  ];
  
  console.log('\nFunções NO BANCO:', funcoesSalvas);
  console.log('\nFunções FALTANDO (qtd=0, não salvas):');
  for (const f of funcoesEsperadas) {
    if (!funcoesSalvas.includes(f)) {
      console.log(`  ✗ ${f} — NÃO está no banco (foi deixado como 0)`);
    }
  }
  
  // =============================================
  // PROBLEMA: Verba aplicada com lógica errada?
  // =============================================
  console.log('\n======== POTENCIAL BUG: Verba pega do 1º membro ========');
  console.log('O app pega verbaAlimentacao do PRIMEIRO row do banco, não do registro específico.');
  console.log('Se o 1º membro do banco NÃO tem verba_alimentacao preenchida, TODA equipe fica sem verba.');
  console.log(`1º membro no banco: "${firstMember?.funcao}" → verba_alimentacao = ${firstMember?.verba_alimentacao}`);
}

main().catch(console.error);
