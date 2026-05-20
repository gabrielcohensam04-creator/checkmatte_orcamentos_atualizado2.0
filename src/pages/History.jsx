import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const History = () => {
  const { isDark } = useTheme();
  const { SCLO, OV, ONS, ONSV, SEC, ERR, SUC } = isDark ? dark : light;
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      // Tentativa 1: Busca com companies (vai falhar se a tabela companies não existir ainda)
      const { data, error } = await supabase
        .from('budgets')
        .select('*, companies(nome, responsavel)')
        .order('criado_em', { ascending: false });

      if (error) {
        // Tentativa 2: Fallback (Busca simples, ideal para o nosso banco atual)
        const { data: fb, error: fallbackError } = await supabase
          .from('budgets')
          .select('*')
          .order('criado_em', { ascending: false });
          
        if (fallbackError) throw fallbackError;
        setBudgets(fb || []);
      } else {
        setBudgets(data || []);
      }
    } catch (e) { 
      console.error("Erro ao buscar orçamentos no histórico:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir permanentemente este orçamento?')) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (e) { alert('Erro ao excluir: ' + e.message); }
  };

  const StatusChip = ({ status }) => {
    const map = {
      pending:   { label: 'Pendente',  bg: 'rgba(232,25,60,.1)',   color: '#E8193C', border: 'rgba(232,25,60,.25)' },
      approved:  { label: 'Aprovado',  bg: 'rgba(22,163,74,.1)',  color: SUC,  border: 'rgba(22,163,74,.25)' },
      rejected:  { label: 'Reprovado', bg: 'rgba(186,26,26,.08)', color: ERR,  border: 'rgba(186,26,26,.2)' },
      completed: { label: 'Concluído', bg: 'rgba(0,100,130,.1)',  color: '#006482', border: 'rgba(0,100,130,.2)' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
        {s.label}
      </span>
    );
  };

  const BudgetCard = ({ budget, onDelete }) => (
    <div
      onClick={() => navigate(`/orcamento/${budget.id}`)}
      style={{ 
        background: SCLO, 
        border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`, 
        borderRadius: 8, 
        padding: 16, 
        cursor: 'pointer', 
        transition: 'border-color .2s ease, background .15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#0A0A0A'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#3A3A3A' : '#D1D5DB'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: ONS, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {budget.nome_projeto || 'Sem nome'}
          </p>
          <p style={{ fontSize: 12, color: ONSV }}>{budget.cliente || budget.companies?.nome || '—'}</p>
        </div>
        <StatusChip status={budget.status} />
      </div>

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(budget.id); }}
          style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', border: 'none', borderRadius: 6, background: '#FCA5A5', color: '#991B1B', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          Excluir
        </button>
      )}
    </div>
  );

  const rejected = budgets.filter(b => b.status === 'rejected');
  const pending = budgets.filter(b => b.status === 'pending');
  const approvedCompleted = budgets.filter(b => b.status === 'approved' || b.status === 'completed');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: ONSV, fontSize: 14 }}>
        <span className="material-symbols-outlined" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
        Carregando histórico…
      </div>
    );
  }

  const Column = ({ title, items, canDelete }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 10, borderBottom: `1px solid ${isDark ? '#2A2A2A' : '#E0E0E0'}`, margin: 0 }}>
        {title} — {items.length}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(b => <BudgetCard key={b.id} budget={b} onDelete={canDelete ? handleDelete : null} />)}
        {items.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', background: SCLO, border: `1px dashed ${OV}`, borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: ONSV }}>Nenhum item</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--stack-lg)', marginTop: 12 }}>
        <Column title="Reprovados" items={rejected} canDelete />
        <Column title="Pendentes" items={pending} />
        <Column title="Aprovados & Concluídos" items={approvedCompleted} />
      </div>
    </div>
  );
};

export default History;
