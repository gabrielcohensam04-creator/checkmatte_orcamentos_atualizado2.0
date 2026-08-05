import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const History = () => {
  const { isDark } = useTheme();
  const { SCLO, OV, ONS, ONSV, P, ERR, SUC, TERT } = isDark ? dark : light;
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*, companies(nome, responsavel)')
        .order('criado_em', { ascending: false });

      if (error) {
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
      pending:   { label: 'Pendente',  bg: `${P}1A`,    color: P,    border: `${P}40` },
      approved:  { label: 'Aprovado',  bg: `${SUC}1A`,  color: SUC,  border: `${SUC}40` },
      rejected:  { label: 'Reprovado', bg: `${ERR}1A`,  color: ERR,  border: `${ERR}40` },
      completed: { label: 'Concluído', bg: `${TERT}1A`, color: TERT, border: `${TERT}40` },
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
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'all .2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(10, 10, 10, 0.08)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#0A0A0A';
        e.currentTarget.style.boxShadow = isDark ? '0 6px 16px rgba(0, 0, 0, 0.5)' : '0 6px 16px rgba(10, 10, 10, 0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDark ? '#3A3A3A' : '#D1D5DB';
        e.currentTarget.style.boxShadow = isDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(10, 10, 10, 0.08)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: ONS, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {budget.nome_projeto || 'Sem nome'}
          </p>
          <p style={{ fontSize: 13, color: ONSV }}>{budget.cliente || budget.companies?.nome || '—'}</p>
        </div>
        <StatusChip status={budget.status} />
      </div>

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(budget.id); }}
          style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', border: 'none', borderRadius: 8, background: `${ERR}1A`, color: ERR, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          Excluir
        </button>
      )}
    </div>
  );

  const filteredBudgets = budgets.filter(b => {
    const term = searchTerm.toLowerCase();
    return (b.nome_projeto || '').toLowerCase().includes(term) || (b.cliente || '').toLowerCase().includes(term);
  });

  const rejected = filteredBudgets.filter(b => b.status === 'rejected');
  const pending = filteredBudgets.filter(b => b.status === 'pending');
  const approvedCompleted = filteredBudgets.filter(b => b.status === 'approved' || b.status === 'completed');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: ONSV, fontSize: 14 }}>
        <span className="material-symbols-outlined" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
        Carregando histórico…
      </div>
    );
  }

  const ColumnSection = ({ title, items, canDelete }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="column-header">{title} — {items.length}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(b => <BudgetCard key={b.id} budget={b} onDelete={canDelete ? handleDelete : null} />)}
        {items.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', background: SCLO, border: `1px dashed ${OV}`, borderRadius: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: OV, display: 'block', marginBottom: 8 }}>inbox</span>
            <p style={{ fontSize: 13, color: ONSV }}>Nenhum item</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>Histórico</h2>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: ONSV, fontSize: 18, pointerEvents: 'none' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Buscar projeto ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: 10,
              border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`,
              background: SCLO,
              color: ONS,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all .2s'
            }}
            onFocus={e => { e.target.style.borderColor = P; }}
            onBlur={e => { e.target.style.borderColor = isDark ? '#3A3A3A' : '#D1D5DB'; }}
          />
        </div>
      </div>

      {/* Three columns layout */}
      <div className="history-grid">
        <ColumnSection title="Pendentes" items={pending} />
        <ColumnSection title="Aprovados" items={approvedCompleted} />
        <ColumnSection title="Reprovados" items={rejected} canDelete />
      </div>
    </div>
  );
};

export default History;
