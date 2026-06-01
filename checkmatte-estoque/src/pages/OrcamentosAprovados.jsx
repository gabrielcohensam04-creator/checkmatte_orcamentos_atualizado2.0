import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './OrcamentosAprovados.css';

const fmt = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const SECTIONS = [
  { key: 'cameras',       label: 'Câmeras',       icon: '📷' },
  { key: 'lenses',        label: 'Lentes',         icon: '🔭' },
  { key: 'drones',        label: 'Drones',         icon: '🚁' },
  { key: 'communication', label: 'Comunicação',    icon: '📡' },
  { key: 'movement',      label: 'Movimento',      icon: '🎚️' },
];

function EquipmentSection({ icon, label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="eq-section">
      <div className="eq-section-title">
        <span className="eq-icon">{icon}</span>
        {label}
      </div>
      <ul className="eq-list">
        {items.map((item) => (
          <li key={item.id} className="eq-item">
            <span className="eq-name">{item.modelo}</span>
            <span className="eq-qty">{item.quantidade}x</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfraSection({ estrutura }) {
  if (!estrutura || estrutura.length === 0) return null;
  return (
    <div className="eq-section">
      <div className="eq-section-title">
        <span className="eq-icon">🏗️</span>
        Infraestrutura
      </div>
      <ul className="eq-list">
        {estrutura.map((e, i) => (
          <li key={i} className="eq-item">
            <span className="eq-name">{e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BudgetCard({ budget, equipment }) {
  const [open, setOpen] = useState(false);

  const hasEquipment = equipment && (
    equipment.cameras?.length > 0 ||
    equipment.lenses?.length > 0 ||
    equipment.drones?.length > 0 ||
    equipment.communication?.length > 0 ||
    equipment.movement?.length > 0 ||
    (budget.tipo_estrutura && budget.tipo_estrutura.length > 0)
  );

  return (
    <article className={`budget-card ${open ? 'open' : ''}`}>
      <button className="card-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="card-header-left">
          <div className="card-badge">✅ Aprovado</div>
          <h2 className="card-title">{budget.nome_projeto}</h2>
          <p className="card-client">{budget.cliente}</p>
        </div>
        <div className="card-header-right">
          <div className="card-location">
            <span className="loc-icon">📍</span>
            <span>{budget.local_evento} — {budget.cidade}</span>
          </div>
          <div className="card-dates">
            <DateChip label="Viagem" date={budget.data_viagem} />
            <DateChip label="Montagem" date={budget.data_montagem} />
            <DateChip label="Gravação" date={budget.data_gravacao} />
            <DateChip label="Volta" date={budget.data_volta} />
          </div>
          <div className={`chevron ${open ? 'up' : ''}`}>›</div>
        </div>
      </button>

      {open && (
        <div className="card-body">
          {!hasEquipment ? (
            <p className="no-eq">Nenhum equipamento cadastrado neste orçamento.</p>
          ) : (
            <div className="eq-grid">
              <InfraSection estrutura={budget.tipo_estrutura} />
              {SECTIONS.map(s => (
                <EquipmentSection
                  key={s.key}
                  icon={s.icon}
                  label={s.label}
                  items={equipment[s.key]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function DateChip({ label, date }) {
  if (!date) return null;
  return (
    <div className="date-chip">
      <span className="date-label">{label}</span>
      <span className="date-val">{fmt(date)}</span>
    </div>
  );
}

export default function OrcamentosAprovados() {
  const [budgets, setBudgets] = useState([]);
  const [equipmentMap, setEquipmentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // 1. Busca orçamentos aprovados
        const { data: bList, error: bErr } = await supabase
          .from('budgets')
          .select('id, nome_projeto, cliente, cidade, local_evento, data_viagem, data_montagem, data_gravacao, data_volta, tipo_estrutura, criado_em')
          .eq('status', 'approved')
          .order('criado_em', { ascending: false });

        if (bErr) throw bErr;
        if (!bList || bList.length === 0) {
          setBudgets([]);
          setLoading(false);
          return;
        }

        setBudgets(bList);

        // 2. Para cada orçamento, busca os equipamentos em paralelo
        const ids = bList.map(b => b.id);
        const eqMap = {};

        await Promise.all(ids.map(async (id) => {
          const tables = ['budget_cameras', 'budget_lenses', 'budget_drones', 'budget_communication', 'budget_movement'];
          const keys   = ['cameras',        'lenses',        'drones',        'communication',        'movement'];

          const results = await Promise.all(
            tables.map(t => supabase.from(t).select('id, modelo, quantidade').eq('budget_id', id))
          );

          eqMap[id] = {};
          keys.forEach((k, i) => {
            eqMap[id][k] = results[i].data || [];
          });
        }));

        setEquipmentMap(eqMap);
      } catch (e) {
        setError(e.message || 'Erro ao carregar orçamentos.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="oa-root">
      <header className="oa-header">
        <div className="oa-header-inner">
          <div>
            <h1 className="oa-title">Orçamentos Aprovados</h1>
            <p className="oa-subtitle">Lista de projetos aprovados com equipamentos solicitados</p>
          </div>
          <div className="oa-count-badge">
            {loading ? '…' : `${budgets.length} projeto${budgets.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </header>

      <div className="oa-body">
        {loading && (
          <div className="oa-loading">
            <div className="spinner" />
            <p>Carregando orçamentos...</p>
          </div>
        )}

        {error && (
          <div className="oa-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && !error && budgets.length === 0 && (
          <div className="oa-empty">
            <span>📋</span>
            <p>Nenhum orçamento aprovado encontrado.</p>
          </div>
        )}

        {!loading && budgets.map(b => (
          <BudgetCard
            key={b.id}
            budget={b}
            equipment={equipmentMap[b.id] || {}}
          />
        ))}
      </div>
    </section>
  );
}
