import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const approved = budgets.filter(b => b.status === 'approved' || b.status === 'completed');

  const StatusChip = ({ status }) => {
    const map = {
      pending:   { label: 'PENDENTE', bg: 'bg-[#FFEBEE]', text: 'text-[#E8193C]', border: 'border-[#FFCDD2]' },
      approved:  { label: 'APROVADO', bg: 'bg-[#E0F2F1]', text: 'text-[#00695C]', border: 'border-[#B2DFDB]' },
      completed: { label: 'CONCLUÍDO', bg: 'bg-[#E1F5FE]', text: 'text-[#01579B]', border: 'border-[#B3E5FC]' },
      rejected:  { label: 'REPROVADO', bg: 'bg-[#F5F5F5]', text: 'text-[#616161]', border: 'border-[#E0E0E0]' },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border} whitespace-nowrap`}>
        {s.label}
      </span>
    );
  };

  const BudgetCard = ({ budget, onClick, actions }) => (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2A2A2A] rounded-xl p-6 shadow-sm hover:border-[#E8193C] transition-all cursor-pointer group flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white truncate">
            {budget.nome_projeto || 'Sem nome'}
          </h3>
          <p className="text-[13px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
            {budget.cliente || (budget.companies?.nome) || '—'}
          </p>
        </div>
        <StatusChip status={budget.status} />
      </div>

      {actions && (
        <div className="flex gap-2 mt-2 pt-4 border-t border-gray-50 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );

  const ActionBtn = ({ onClick, children, className }) => (
    <button
      onClick={onClick}
      className={`flex-1 h-9 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-80 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 gap-4">
        <span className="material-symbols-outlined text-4xl animate-spin text-[#E8193C]">progress_activity</span>
        <p className="text-sm font-medium">Carregando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-black w-full pb-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* GRID RESPONSIVO: 1 coluna no celular, 2 colunas no desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          
          {/* COLUNA: PENDENTES */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-slate-500 dark:text-zinc-400 font-bold text-[12px] uppercase tracking-[0.15em] whitespace-nowrap">
                PENDENTES — {pending.length}
              </h2>
              <div className="h-[1px] w-full bg-gray-100 dark:bg-zinc-800"></div>
            </div>
            
            <div className="flex flex-col gap-4">
              {pending.map(budget => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onClick={() => navigate(`/orcamento/${budget.id}`)}
                />
              ))}
              {pending.length === 0 && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="material-symbols-outlined text-3xl opacity-20">inbox</span>
                  <p className="text-sm font-medium">Nenhum orçamento pendente</p>
                </div>
              )}
            </div>
          </section>

          {/* COLUNA: APROVADOS */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-slate-500 dark:text-zinc-400 font-bold text-[12px] uppercase tracking-[0.15em] whitespace-nowrap">
                APROVADOS — {approved.length}
              </h2>
              <div className="h-[1px] w-full bg-gray-100 dark:bg-zinc-800"></div>
            </div>

            <div className="flex flex-col gap-4">
              {approved.map(budget => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onClick={() => navigate(`/orcamento/${budget.id}`)}
                  actions={budget.status !== 'completed' && <>
                    <ActionBtn 
                      onClick={() => updateStatus(budget.id, 'completed')} 
                      className="bg-[#E0F2F1] text-[#00695C] border border-[#B2DFDB]"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      CONCLUIR
                    </ActionBtn>
                    <ActionBtn 
                      onClick={() => updateStatus(budget.id, 'pending')} 
                      className="bg-gray-50 text-gray-600 border border-gray-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">undo</span>
                      VOLTAR
                    </ActionBtn>
                  </>}
                />
              ))}
              {approved.length === 0 && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="material-symbols-outlined text-3xl opacity-20">verified</span>
                  <p className="text-sm font-medium">Nenhum orçamento aprovado</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* BOTÃO FLUTUANTE (FAB) */}
      <button
        onClick={() => navigate('/novo-orcamento')}
        className="fixed bottom-10 right-10 w-16 h-16 bg-[#0A0A0A] dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-all duration-300">add</span>
      </button>
    </div>
  );
};

export default Dashboard;
