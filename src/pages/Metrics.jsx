import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const Metrics = () => {
  const { isDark } = useTheme();
  const { SCLO, ONS, ONSV, OV, P, SUC } = isDark ? dark : light;
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly');

  useEffect(() => {
    fetchData();

    // Realtime subscription — atualiza métricas ao vivo
    const channel = supabase
      .channel('metrics-budgets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
        fetchData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, companies(nome)')
        .order('criado_em', { ascending: true });

      if (error) {
        const { data: fb, error: fallbackError } = await supabase
          .from('budgets')
          .select('*')
          .order('criado_em', { ascending: true });
        if (fallbackError) throw fallbackError;
        setBudgets(fb || []);
      } else {
        setBudgets(data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar dados de métricas:', e);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (filteredBudgets) => {
    const currentYear = new Date().getFullYear();

    if (chartView === 'monthly') {
      const months = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'short' }),
        Quantidade: 0
      }));
      filteredBudgets.forEach(b => {
        if (b.criado_em) {
          const date = new Date(b.criado_em);
          if (date.getFullYear() === currentYear) {
            months[date.getMonth()].Quantidade += 1;
          }
        }
      });
      return months;
    } else {
      const yearsMap = {};
      filteredBudgets.forEach(b => {
        if (b.criado_em) {
          const year = new Date(b.criado_em).getFullYear();
          yearsMap[year] = (yearsMap[year] || 0) + 1;
        }
      });
      return Object.keys(yearsMap).sort().map(year => ({
        name: year,
        Quantidade: yearsMap[year]
      }));
    }
  };

  const pendingBudgets  = useMemo(() => budgets.filter(b => b.status === 'pending'),  [budgets]);
  const approvedBudgets = useMemo(() => budgets.filter(b => b.status === 'approved' || b.status === 'completed'), [budgets]);

  const pendingChartData  = useMemo(() => buildChartData(pendingBudgets),  [pendingBudgets,  chartView]);
  const approvedChartData = useMemo(() => buildChartData(approvedBudgets), [approvedBudgets, chartView]);

  // Tabela: clientes com total gasto por período
  const customerData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const map = {};

    budgets.forEach(b => {
      const clientName = b.cliente || (b.companies?.nome) || 'Cliente Indefinido';
      if (!map[clientName]) {
        map[clientName] = { name: clientName, total: 0, totalValue: 0, monthly: Array(12).fill(0), annual: {} };
      }
      map[clientName].total += 1;
      const val = Number(b.total) || 0;
      map[clientName].totalValue += val;

      if (b.criado_em) {
        const date = new Date(b.criado_em);
        if (date.getFullYear() === currentYear) {
          map[clientName].monthly[date.getMonth()] += 1;
        }
        const yr = date.getFullYear();
        map[clientName].annual[yr] = (map[clientName].annual[yr] || 0) + 1;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [budgets]);

  const ViewToggle = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {['monthly', 'annual'].map(view => (
        <button
          key={view}
          onClick={() => setChartView(view)}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${chartView === view ? P : OV}`,
            background: chartView === view ? `${P}1A` : 'transparent',
            color: chartView === view ? P : ONSV,
            fontFamily: 'inherit',
            transition: 'all .2s'
          }}
        >
          {view === 'monthly' ? 'Mensal' : 'Anual'}
        </button>
      ))}
    </div>
  );

  const ChartBlock = ({ title, data, color, total }) => (
    <div
      style={{
        background: SCLO,
        border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`,
        borderRadius: 12,
        padding: 24,
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(10, 10, 10, 0.08)',
        transition: 'all .2s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = isDark ? '0 6px 16px rgba(0, 0, 0, 0.5)' : '0 6px 16px rgba(10, 10, 10, 0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(10, 10, 10, 0.08)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: ONS, margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: color, margin: '6px 0 0' }}>{total}</p>
        </div>
        <ViewToggle />
      </div>
      <div style={{ height: 220, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={OV} vertical={false} />
            <XAxis dataKey="name" stroke={ONSV} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={ONSV} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <RechartsTooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              contentStyle={{ backgroundColor: SCLO, borderColor: OV, color: ONS, borderRadius: 8 }}
            />
            <Bar dataKey="Quantidade" fill={color} radius={[4, 4, 0, 0]} barSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: ONSV, fontSize: 14 }}>
        <span className="material-symbols-outlined" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
        Carregando métricas…
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'short' })
  );

  return (
    <div className="dashboard-container">
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>Métricas e Relatórios</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Bloco 1: Orçamentos Pendentes */}
        <ChartBlock
          title="Orçamentos Pendentes"
          data={pendingChartData}
          color={P}
          total={pendingBudgets.length}
        />

        {/* Bloco 2: Orçamentos Aprovados */}
        <ChartBlock
          title="Orçamentos Aprovados / Concluídos"
          data={approvedChartData}
          color={SUC}
          total={approvedBudgets.length}
        />

        {/* Bloco 3: Tabela de Clientes */}
        <div
          style={{
            background: SCLO,
            border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`,
            borderRadius: 12,
            padding: 24,
            overflowX: 'auto',
            boxShadow: '0 4px 12px rgba(255, 0, 0, 0.15)',
            transition: 'all .2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 0, 0, 0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.15)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: ONS, margin: 0 }}>Orçamentos por Cliente</h3>
            <ViewToggle />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${OV}`, color: ONSV, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${OV}`, color: ONSV, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                {chartView === 'monthly'
                  ? monthNames.map(m => (
                      <th key={m} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: `1px solid ${OV}`, color: ONSV, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m}</th>
                    ))
                  : (() => {
                      const years = [...new Set(budgets.map(b => b.criado_em ? new Date(b.criado_em).getFullYear() : null).filter(Boolean))].sort();
                      return years.map(y => (
                        <th key={y} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${OV}`, color: ONSV, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{y}</th>
                      ));
                    })()
                }
              </tr>
            </thead>
            <tbody>
              {customerData.map((client, idx) => {
                const years = [...new Set(budgets.map(b => b.criado_em ? new Date(b.criado_em).getFullYear() : null).filter(Boolean))].sort();
                return (
                  <tr key={idx} style={{ borderBottom: `1px solid ${OV}` }}>
                    <td style={{ padding: '14px 16px', color: ONS, fontSize: 14, fontWeight: 500 }}>{client.name}</td>
                    <td style={{ padding: '14px 16px', color: ONS, fontSize: 14, textAlign: 'center', fontWeight: 700 }}>{client.total}</td>
                    {chartView === 'monthly'
                      ? client.monthly.map((count, i) => (
                          <td key={i} style={{ padding: '14px 8px', textAlign: 'center', fontSize: 13 }}>
                            {count > 0
                              ? <span style={{ background: `${P}1A`, color: P, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{count}</span>
                              : <span style={{ color: OV }}>—</span>
                            }
                          </td>
                        ))
                      : years.map(y => (
                          <td key={y} style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13 }}>
                            {client.annual[y]
                              ? <span style={{ background: `${P}1A`, color: P, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{client.annual[y]}</span>
                              : <span style={{ color: OV }}>—</span>
                            }
                          </td>
                        ))
                    }
                  </tr>
                );
              })}
              {customerData.length === 0 && (
                <tr>
                  <td colSpan="20" style={{ padding: '32px 16px', textAlign: 'center', color: ONSV, fontSize: 14 }}>
                    Nenhum dado disponível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Metrics;
