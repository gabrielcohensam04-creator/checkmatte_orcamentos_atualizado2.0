import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const Dashboard = () => {
  const { isDark } = useTheme();
  const { P, SCLO, OV, ONS, ONSV, ERR, SUC, TERT } = isDark ? dark : light;

  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fmt = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '—';

  const StatusChip = ({ status }) => {
    const map = {
      pending:   { label: 'Pendente',  bg: `${P}1A`,    color: P,    border: `${P}40` },
      approved:  { label: 'Aprovado',  bg: `${SUC}1A`,  color: SUC,  border: `${SUC}40` },
      rejected:  { label: 'Reprovado', bg: `${ERR}1A`,  color: ERR,  border: `${ERR}40` },
      completed: { label: 'Concluído', bg: `${TERT}1A`, color: TERT, border: `${TERT}40` },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
        {s.label}
      </span>
    );
  };

  const BudgetCard = ({ budget, onClick, actions }) => (
    <div
      onClick={onClick}
      style={{
        background: SCLO,
        border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`,
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'all .2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: '100%',
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
      {/* Title + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: ONS, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {budget.nome_projeto || 'Projeto sem nome'}
        </p>
        <StatusChip status={budget.status} />
      </div>

      {/* Cliente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONSV, fontSize: 13 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {budget.cliente || budget.companies?.nome || 'Cliente não informado'}
        </span>
      </div>

      {/* Datas de Início e Fim */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: ONSV, fontSize: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: SUC }}>play_circle</span>
          <span>Início: <strong style={{ color: ONS }}>{fmt(budget.data_gravacao)}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: ONSV, fontSize: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: P }}>stop_circle</span>
          <span>Fim: <strong style={{ color: ONS }}>{fmt(budget.data_volta)}</strong></span>
        </div>
      </div>

      {/* Valor total */}
      {budget.total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONS, fontSize: 14, fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: SUC }}>payments</span>
          <span>{Number(budget.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      )}

      {/* Data de criação pequeninha */}
      <p style={{ fontSize: 10, color: ONSV, marginTop: 'auto', opacity: 0.7 }}>
        Criado em {fmt(budget.criado_em)}
      </p>

      {actions && (
        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );

  const Btn = ({ onClick, children, color, bgColor }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: 36, border: 'none', borderRadius: 8,
        fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6, transition: 'opacity .15s',
        background: bgColor, color: color
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  );

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*, companies(nome)')
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
      console.error("Erro ao buscar orçamentos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();

    // Realtime subscription
    const channel = supabase
      .channel('dashboard-budgets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
        fetchBudgets();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, newStatus, extra = {}) => {
    try {
      const { error } = await supabase.from('budgets').update({ status: newStatus, ...extra }).eq('id', id);
      if (error) throw error;
      // Realtime vai atualizar automaticamente, mas atualizamos o state local também para UX instantânea
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, ...extra } : b));
    } catch (e) { alert('Erro ao atualizar: ' + e.message); }
  };

  const pending  = budgets.filter(b => b.status === 'pending');
  const approved = budgets.filter(b => b.status === 'approved');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: ONSV, fontSize: 14 }}>
        <span className="material-symbols-outlined" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
        Carregando orçamentos…
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Row: Title + Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>Orçamentos</h2>
        <button
          onClick={() => navigate('/novo-orcamento')}
          title="Novo Orçamento"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', fontSize: 20,
            background: P, color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(232,25,60,0.25)',
            transition: 'transform .15s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Pendentes */}
        <div className="column">
          <h2 className="column-header">Pendentes — {pending.length}</h2>
          <div className="cards-list">
            {pending.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onClick={() => navigate(`/orcamento/${budget.id}`)}
              />
            ))}
            {pending.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', background: SCLO, border: `1px dashed ${OV}`, borderRadius: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: OV, display: 'block', marginBottom: 8 }}>inbox</span>
                <p style={{ fontSize: 13, color: ONSV }}>Nenhum orçamento pendente</p>
              </div>
            )}
          </div>
        </div>

        {/* Aprovados */}
        <div className="column">
          <h2 className="column-header">Aprovados — {approved.length}</h2>
          <div className="cards-list">
            {approved.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onClick={() => navigate(`/orcamento/${budget.id}`)}
                actions={<>
                  <Btn onClick={() => updateStatus(budget.id, 'completed')} bgColor={`${TERT}1A`} color={TERT}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
                    Concluir
                  </Btn>
                  <Btn onClick={() => updateStatus(budget.id, 'pending')} bgColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,10,0.05)'} color={ONSV}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>undo</span>
                    Pendente
                  </Btn>
                </>}
              />
            ))}
            {approved.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', background: SCLO, border: `1px dashed ${OV}`, borderRadius: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: OV, display: 'block', marginBottom: 8 }}>verified</span>
                <p style={{ fontSize: 13, color: ONSV }}>Nenhum orçamento aprovado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Resumo */}
      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <div style={{ padding: '16px 24px', background: SCLO, border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: ONS }}>Pendentes: {pending.length}</span>
        </div>
        <div style={{ padding: '16px 24px', background: SCLO, border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: ONS }}>Aprovados: {approved.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
