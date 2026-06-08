import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DownloadPDFButton, DownloadTeamPDFButton } from '../components/BudgetPDF';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';
import Logo from '../components/Logo';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

const BudgetView = () => {
  const { isDark } = useTheme();
  const { P, SURF, HEAD, SCLO, SCN, OV, ONS, ONSV, SEC, ERR, SUC, WARN, TERT } = isDark ? dark : light;

  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const STATUS_MAP = {
    pending:   { label: 'Pendente',  bg: 'rgba(199,80,0,.1)',   color: WARN, border: 'rgba(199,80,0,.25)' },
    approved:  { label: 'Aprovado',  bg: 'rgba(22,163,74,.1)',  color: SUC,  border: 'rgba(22,163,74,.25)' },
    rejected:  { label: 'Reprovado', bg: 'rgba(186,26,26,.08)', color: ERR,  border: 'rgba(186,26,26,.2)' },
    completed: { label: 'Concluído', bg: 'rgba(0,100,130,.1)',  color: TERT, border: 'rgba(0,100,130,.2)' },
  };

  const Chip = ({ status }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    return (
      <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
        {s.label}
      </span>
    );
  };

  const Section = ({ icon, title, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: SEC }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      </div>
      <div style={{ background: SCLO, border: `0.5px solid ${OV}`, borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, highlight, last }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderBottom: last ? 'none' : `0.5px solid ${OV}` }}>
      <span style={{ fontSize: 13, color: ONSV }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? P : ONS }}>{value}</span>
    </div>
  );

  const ActionBtn = ({ onClick, icon, children, primary, danger, success, iconRight, style: extraStyle }) => {
    const bg = danger ? ERR : success ? SUC : primary ? P : SCN;
    const color = (primary || danger || success) ? '#fff' : ONS;
    return (
      <button
        onClick={onClick}
        style={{ 
          flex: 1, height: 36, border: 'none', borderRadius: 8, 
          fontFamily: 'inherit', fontSize: 13, fontWeight: 500, 
          cursor: 'pointer', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', gap: 8, padding: '6px 20px',
          whiteSpace: 'nowrap', background: bg, color, 
          transition: 'opacity .15s', ...extraStyle 
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {!iconRight && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>}
        {children}
        {iconRight && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>}
      </button>
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // 1. Carrega os dados principais do orçamento e tenta carregar a empresa (caso a tabela companies exista)
        const { data: b, error: budgetError } = await supabase
            .from('budgets')
            .select('*, companies(nome, responsavel)')
            .eq('id', id)
            .single();
            
        // Fallback caso a tabela companies ainda não exista ou não esteja ligada
        if (budgetError && budgetError.code === 'PGRST200') {
            const { data: fallbackB } = await supabase.from('budgets').select('*').eq('id', id).single();
            setBudget(fallbackB);
        } else {
            setBudget(b);
        }

        // 2. Carrega todos os equipamentos das novas tabelas relacionais em paralelo
        const [camRes, lenRes, droneRes, comRes, movRes] = await Promise.all([
          supabase.from('budget_cameras').select('*').eq('budget_id', id),
          supabase.from('budget_lenses').select('*').eq('budget_id', id),
          supabase.from('budget_drones').select('*').eq('budget_id', id),
          supabase.from('budget_communication').select('*').eq('budget_id', id),
          supabase.from('budget_movement').select('*').eq('budget_id', id)
        ]);

        // Remonta o objeto equipment com a estrutura que o ecrã espera
        setEquipment({
          cameras: camRes.data?.map(item => ({...item, valorUnit: item.valor_unit})) || [],
          lentes: lenRes.data?.map(item => ({...item, valorUnit: item.valor_unit})) || [],
          aereo: droneRes.data?.map(item => ({...item, valorUnit: item.valor_unit})) || [],
          comunicacao: comRes.data?.map(item => ({...item, valorUnit: item.valor_unit})) || [],
          movimento: movRes.data?.map(item => ({...item, valorUnit: item.valor_unit})) || []
        });

        // 3. Carrega a equipa
        const { data: teamData } = await supabase.from('budget_team').select('*').eq('budget_id', id);
        
        if (teamData && teamData.length > 0) {
          // Remonta o objeto team com a estrutura que o ecrã espera
          const equipeFormatada = teamData.map(membro => ({
            funcao: membro.funcao,
            qtd: membro.quantidade,
            valorPessoa: membro.valor_diaria,
            qtdDiarias: membro.quantidade_diarias,
            nomes: membro.nomes || [],
            verba_alimentacao: membro.verba_alimentacao || 0
          }));
          
          setTeam({
            equipe: equipeFormatada,
            verba_alimentacao: teamData[0]?.verba_alimentacao || 0
          });
        } else {
            setTeam({ equipe: [], verba_alimentacao: 0 });
        }
        
      } catch (e) { 
          console.error("Erro ao carregar BudgetView:", e); 
      } finally { 
          setLoading(false); 
      }
    };
    load();
  }, [id]);

  const updateStatus = async (newStatus, extra = {}) => {
    const { error } = await supabase.from('budgets').update({ status: newStatus, ...extra }).eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    setBudget(prev => ({ ...prev, status: newStatus, ...extra }));
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', color: ONSV, fontSize: 14 }}>
      <span className="material-symbols-outlined" style={{ marginRight: 8 }}>progress_activity</span>
      Carregando…
    </div>
  );

  if (!budget) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', color: ONSV, fontSize: 14 }}>
      Orçamento não encontrado.
    </div>
  );

  const estruturas = (budget.tipo_estrutura || []);
  const cameras    = equipment?.cameras    || [];
  const lentes     = equipment?.lentes     || [];
  const aereo      = equipment?.aereo      || [];
  const comunicacao= equipment?.comunicacao || [];
  const movimento  = equipment?.movimento  || [];
  const equipe     = team?.equipe          || [];
  const verba      = team?.verba_alimentacao || 0;

  const totalEstrutura  = estruturas.reduce((a, e) => a + (Number(e.valor) || 0), 0);
  const totalCameras    = cameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0);
  const totalLentes     = lentes.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0) * (Number(l.diarias) || 1), 0);
  const totalAereo      = aereo.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0) * (Number(d.diarias) || 1), 0);
  const totalCom        = comunicacao.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0);
  const totalMovimento  = movimento.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0) * (Number(m.diarias) || 1), 0);
  const totalEquipe = equipe.reduce((a, e) => {
    const qtd     = Number(e.qtd || 0);
    const diarias = Number(e.qtdDiarias || 1);
    const valor   = Number(e.valorPessoa || 0);
    const verbaM  = Number(e.verba_alimentacao || 0);
    return a + (qtd * diarias * valor) + (verbaM * qtd * diarias);
  }, 0);
  const totalFrete      = (Number(budget.distancia_km) || 0) * (Number(budget.valor_km) || 0);

  const sections = [
    { label: 'Estrutura',   value: totalEstrutura, icon: 'local_shipping' },
    { label: 'Câmeras',     value: totalCameras,   icon: 'videocam' },
    { label: 'Lentes',      value: totalLentes,    icon: 'photo_camera' },
    { label: 'Drones',      value: totalAereo,     icon: 'flight' },
    { label: 'Comunicação', value: totalCom,       icon: 'cell_tower' },
    { label: 'Movimento',   value: totalMovimento, icon: 'switch_video' },
    { label: 'Equipe',      value: totalEquipe,    icon: 'groups' },
    { label: 'Frete',       value: totalFrete,     icon: 'local_shipping' },
  ].filter(s => s.value > 0);

  const isPending   = budget.status === 'pending';
  const isApproved  = budget.status === 'approved';
  const isCompleted = budget.status === 'completed';

  return (
    <div style={{ minHeight: '100dvh', background: SURF, fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: HEAD, borderBottom: `1px solid ${OV}`, height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <button
          onClick={() => navigate('/')}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: P, borderRadius: '50%' }}
          onMouseEnter={e => e.currentTarget.style.background = SCN}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <Logo style={{ height: 28 }} />
        <div style={{ flex: 1 }} />
        <Chip status={budget.status} />
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Hero info card */}
        <div style={{ background: SCLO, border: `0.5px solid ${OV}`, borderRadius: 14, padding: '20px 18px', marginBottom: 20 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: ONS, letterSpacing: '-0.01em', marginBottom: 4 }}>
            {budget.nome_projeto || 'Projeto sem nome'}
          </p>
          <p style={{ fontSize: 14, color: ONSV, marginBottom: 16 }}>
            {budget.cliente || budget.companies?.nome || '—'}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: SEC, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: P, letterSpacing: '-0.02em' }}>R$ {fmt(budget.total)}</span>
          </div>
          {budget.descricao && (
            <p style={{ fontSize: 13, color: ONSV, marginTop: 12, lineHeight: 1.6, borderTop: `0.5px solid ${OV}`, paddingTop: 12 }}>
              {budget.descricao}
            </p>
          )}
        </div>

        {/* Dates */}
        <Section icon="calendar_month" title="Logística">
          <Row label="Cidade"   value={budget.cidade || '—'} />
          <Row label="Local"    value={budget.local_evento || '—'} />
          <Row label="Viagem"   value={fmtDate(budget.data_viagem)} />
          <Row label="Montagem" value={fmtDate(budget.data_montagem)} />
          <Row label="Gravação" value={fmtDate(budget.data_gravacao)} />
          <Row label="Retorno"  value={fmtDate(budget.data_volta)} last />
        </Section>

        {/* Breakdown */}
        {sections.length > 0 && (
          <Section icon="receipt_long" title="Resumo por Categoria">
            {sections.map((s, i) => (
              <Row key={s.label} label={s.label} value={`R$ ${fmt(s.value)}`} highlight last={i === sections.length - 1} />
            ))}
          </Section>
        )}

        {/* Estrutura detail */}
        {estruturas.length > 0 && (
          <Section icon="local_shipping" title="Estrutura">
            {estruturas.map((e, i) => (
              <Row key={i} label={e.tipo} value={`R$ ${fmt(e.valor)}`} last={i === estruturas.length - 1} />
            ))}
          </Section>
        )}

        {/* Cameras detail */}
        {cameras.filter(c => c.quantidade > 0).length > 0 && (
          <Section icon="videocam" title="Câmeras">
            {cameras.filter(c => c.quantidade > 0).map((c, i, arr) => {
              const dias = Number(c.diarias) || 1;
              const label = dias > 1 ? `${c.modelo} ×${c.quantidade} · ${dias} diárias` : `${c.modelo} ×${c.quantidade}`;
              return <Row key={i} label={label} value={`R$ ${fmt(c.quantidade * c.valorUnit * dias)}`} last={i === arr.length - 1} />;
            })}
          </Section>
        )}

        {/* Lentes detail */}
        {lentes.filter(l => l.quantidade > 0).length > 0 && (
          <Section icon="photo_camera" title="Lentes">
            {lentes.filter(l => l.quantidade > 0).map((l, i, arr) => {
              const dias = Number(l.diarias) || 1;
              const label = dias > 1 ? `${l.modelo} ×${l.quantidade} · ${dias} diárias` : `${l.modelo} ×${l.quantidade}`;
              return <Row key={i} label={label} value={`R$ ${fmt(l.quantidade * l.valorUnit * dias)}`} last={i === arr.length - 1} />;
            })}
          </Section>
        )}

        {/* Drones detail */}
        {aereo.filter(d => d.quantidade > 0).length > 0 && (
          <Section icon="flight" title="Drones">
            {aereo.filter(d => d.quantidade > 0).map((d, i, arr) => {
              const dias = Number(d.diarias) || 1;
              const label = dias > 1 ? `${d.modelo} ×${d.quantidade} · ${dias} diárias` : `${d.modelo} ×${d.quantidade}`;
              return <Row key={i} label={label} value={`R$ ${fmt(d.quantidade * d.valorUnit * dias)}`} last={i === arr.length - 1} />;
            })}
          </Section>
        )}

        {/* Movimento detail */}
        {movimento.filter(m => m.quantidade > 0).length > 0 && (
          <Section icon="switch_video" title="Movimento">
            {movimento.filter(m => m.quantidade > 0).map((m, i, arr) => {
              const dias = Number(m.diarias) || 1;
              const label = dias > 1 ? `${m.modelo} ×${m.quantidade} · ${dias} diárias` : `${m.modelo} ×${m.quantidade}`;
              return <Row key={i} label={label} value={`R$ ${fmt(m.quantidade * m.valorUnit * dias)}`} last={i === arr.length - 1} />;
            })}
          </Section>
        )}

        {/* Equipe detail */}
        {equipe.filter(e => e.qtd > 0).length > 0 && (
          <Section icon="groups" title="Equipe">
            {equipe.filter(e => e.qtd > 0).map((e, i, arr) => {
              const diarias       = Number(e.qtdDiarias) || 1;
              const cache         = (Number(e.qtd) || 0) * (Number(e.valorPessoa) || 0) * diarias;
              const verbaM        = Number(e.verba_alimentacao) || 0;
              const verbaSubtotal = verbaM * (Number(e.qtd) || 0) * diarias;
              const isLast        = i === arr.length - 1 && verbaSubtotal === 0;
              return (
                <Row
                  key={i}
                  label={`${e.funcao} ×${e.qtd} · ${diarias} diária${diarias !== 1 ? 's' : ''}${verbaM > 0 ? ` + R$\u00a0${fmt(verbaM)}/alim.` : ''}`}
                  value={`R$ ${fmt(cache + verbaSubtotal)}`}
                  last={isLast}
                />
              );
            })}
          </Section>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px', width: '100%' }}>
          <DownloadPDFButton budget={budget} equipment={equipment} team={team} />

          {/* NOVO BOTÃO EXCLUSIVO PARA O PDF DA EQUIPE */}
          <DownloadTeamPDFButton budget={budget} team={team} />

          <ActionBtn icon="edit" style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }} onClick={() => navigate(`/orcamento/${id}/editar`)}>
            Editar
          </ActionBtn>
          {isPending && (
            <>
              <ActionBtn 
                icon="close" 
                style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }} 
                onClick={async () => {
                  await updateStatus('rejected', { data_reprovacao: new Date().toISOString() });
                  navigate('/');
                }}
              >
                Reprovar
              </ActionBtn>
              <ActionBtn 
                icon="check_circle" 
                style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC' }}
                iconRight 
                onClick={() => updateStatus('approved')}
              >
                Job Fechado
              </ActionBtn>
            </>
          )}
          {isApproved && (
            <ActionBtn icon="undo" style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }} onClick={() => updateStatus('pending')}>
              Pendente
            </ActionBtn>
          )}
          {isCompleted && (
            <ActionBtn icon="undo" style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }} onClick={() => updateStatus('approved')}>
              Desconcluir
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
