import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const Dashboard = () => {
  const { isDark } = useTheme();
  const { P, SCLO, SCLN, OV, ONS, ONSV, ERR, SUC, WARN } = isDark ? dark : light;

  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const StatusChip = ({ status }) => {
    const map = {
      pending:   { label: 'Pendente',  bg: 'rgba(232,25,60,.1)',   color: '#E8193C', border: 'rgba(232,25,60,.25)' },
      approved:  { label: 'Aprovado',  bg: 'rgba(22,163,74,.1)',  color: SUC,  border: 'rgba(22,163,74,.25)' },
      rejected:  { label: 'Reprovado', bg: 'rgba(186,26,26,.08)', color: ERR,  border: 'rgba(186,26,26,.2)' },
      completed: { label: 'Concluído', bg: 'rgba(0,100,130,.1)',  color: '#006482', border: 'rgba(0,100,130,.2)' },
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
        borderRadius: 8, 
        padding: 16, 
        cursor: 'pointer', 
        transition: 'border-color .2s ease, background .15s' 
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#0A0A0A'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#3A3A3A' : '#D1D5DB'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: ONS, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {budget.nome_projeto || 'Projeto sem nome'}
          </p>
          <p style={{ fontSize: 12, color: ONSV, marginBottom: 2 }}>{budget.cliente || (budget.companies?.nome) || '—'}</p>
          <p style={{ fontSize: 12, color: ONSV }}>
            {(budget.data_gravacao || budget.data_viagem)
              ? new Date((budget.data_gravacao || budget.data_viagem) + 'T12:00:00').toLocaleDateString('pt-BR')
              : '—'}
          </p>
        </div>
        <StatusChip status={budget.status} />
      </div>

      {actions && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
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

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('budgets').select('*, companies(nome, responsavel)').order('created_at', { ascending: false });
      if (error) {
        const { data: fb } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
        setBudgets(fb || []);
      } else {
        setBudgets(data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, newStatus, extra = {}) => {
    try {
      const { error } = await supabase.from('budgets').update({ status: newStatus, ...extra }).eq('id', id);
      if (error) throw error;
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
    <div className="dashboard-container" style={{ padding: '0 16px' }}>
      {/* 1. Header Pendentes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, color: ONSV, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          PENDENTES — {pending.length}
        </div>
        <button
          onClick={() => navigate('/novo-orcamento')}
          title="Novo Orçamento"
          style={{ 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            border: 'none',
            background: isDark ? '#FFFFFF' : '#0A0A0A',
            color: isDark ? '#0A0A0A' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>

      {/* 2. Lista Pendentes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

      {/* 3. Header Aprovados */}
      <div style={{ width: '100%', marginTop: 32, marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ 
          fontWeight: 600, 
          color: ONSV, 
          fontSize: 12, 
          background: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB', 
          padding: '4px 12px', 
          borderRadius: 20,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          APROVADOS — {approved.length}
        </div>
      </div>

      {/* 4. Lista Aprovados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {approved.map(budget => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onClick={() => navigate(`/orcamento/${budget.id}`)}
            actions={<>
              <Btn onClick={() => updateStatus(budget.id, 'completed')} bgColor="#86EFAC" color="#166534">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
                Concluir
              </Btn>
              <Btn onClick={() => updateStatus(budget.id, 'pending')} bgColor="#E5E7EB" color="#374151">
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
  );
};

export default Dashboard;
