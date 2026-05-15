import { useState, useEffect, Fragment } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';
import Logo from '../components/Logo';

const STEPS = [
  { id: 1,  title: 'Dados Gerais', icon: 'assignment',          required: true  },
  { id: 2,  title: 'Logística',    icon: 'calendar_month',       required: true  },
  { id: 3,  title: 'Estrutura',    icon: 'local_shipping',       required: true  },
  { id: 4,  title: 'Câmeras',      icon: 'videocam',             required: false },
  { id: 5,  title: 'Lentes',       icon: 'photo_camera',         required: false },
  { id: 6,  title: 'Drones',       icon: 'drone',               required: false },
  { id: 7,  title: 'Comunicação',  icon: 'cell_tower',           required: false },
  { id: 8,  title: 'Movimento',    icon: 'switch_video',         required: false },
  { id: 9,  title: 'Equipe',       icon: 'groups',               required: false },
  { id: 10, title: 'Resumo',       icon: 'summarize',            required: true  },
];

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// ── Stable sub-components (defined outside to prevent focus loss on re-render) ──

const Stepper = ({ value, onChange, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-container-low)', padding: 4, borderRadius: 10 }}>
    <button
      style={{ width: 32, height: 32, border: '0.5px solid var(--outline-variant)', borderRadius: 4, fontSize: 18, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', opacity: (disabled || value <= 0) ? 0.4 : 1, transition: 'background .15s' }}
      disabled={disabled || value <= 0}
      onClick={() => onChange(Math.max(0, value - 1))}
    >−</button>
    <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>{value}</span>
    <button
      style={{ width: 32, height: 32, border: 'none', borderRadius: 4, fontSize: 18, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#fff', opacity: disabled ? 0.4 : 1, transition: 'opacity .15s' }}
      disabled={disabled}
      onClick={() => onChange(value + 1)}
    >+</button>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const baseInput = {
  width: '100%', padding: '11px 14px', border: '0.5px solid var(--outline-variant)',
  borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: 'var(--on-surface)',
  background: 'var(--surface-container-lowest)', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .2s, box-shadow .2s',
};
const onFocusInput = e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(165,54,13,.08)'; };
const onBlurInput  = e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none'; };

const FInput = ({ disabled, style: extra, ...props }) => (
  <input
    disabled={disabled}
    style={{ ...baseInput, ...(disabled ? { background: 'var(--surface-container)', opacity: 0.7 } : {}), ...extra }}
    onFocus={onFocusInput} onBlur={onBlurInput}
    {...props}
  />
);

const FSelect = ({ disabled, style: extra, children, ...props }) => (
  <select
    disabled={disabled}
    style={{ ...baseInput, ...(disabled ? { background: 'var(--surface-container)', opacity: 0.7 } : {}), ...extra }}
    onFocus={onFocusInput} onBlur={onBlurInput}
    {...props}
  >{children}</select>
);

const FTextarea = ({ disabled, style: extra, ...props }) => (
  <textarea
    disabled={disabled}
    style={{ ...baseInput, resize: 'vertical', ...(disabled ? { background: 'var(--surface-container)', opacity: 0.7 } : {}), ...extra }}
    onFocus={onFocusInput} onBlur={onBlurInput}
    {...props}
  />
);

// ── Main Component ────────────────────────────────────────────────────────
const CreateBudget = () => {
  const { isDark } = useTheme();
  const { P, SEC, BG, SURF, HEAD, SCLO, SCLN, SCN, SCHN, ONS, ONSV, OL, OV } = isDark ? dark : light;

  // ── Shared styles ───────────────────────────────────────────────────────
  const S = {
    // Layout
    page:     { minHeight: '100dvh', background: BG, fontFamily: "'Inter', sans-serif" },
    topBar:   { position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: HEAD, borderBottom: `1px solid ${OV}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 100 },
    backBtn:  { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: P, borderRadius: '50%', transition: 'background .15s', flexShrink: 0 },
    topTitle: { flex: 1, fontSize: 16, fontWeight: 600, color: ONS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    stepBadge:{ fontSize: 11, fontWeight: 600, color: SEC, background: SCN, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' },
    content:  { paddingTop: 56, paddingBottom: 120 },
    inner:    { padding: '20px 16px', maxWidth: 560, margin: '0 auto' },

    // Progress
    progWrap:  { padding: '16px 16px 0' },
    progLabel: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progStep:  { fontSize: 11, fontWeight: 600, color: SEC, textTransform: 'uppercase', letterSpacing: '0.05em' },
    progName:  { fontSize: 11, fontWeight: 500, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.04em' },
    progTrack: { height: 4, background: SCN, borderRadius: 99, overflow: 'hidden' },
    progFill:  { height: '100%', background: P, borderRadius: 99, transition: 'width .4s ease' },

    // Hero canvas
    hero:      { margin: '16px 16px 0', borderRadius: 10, border: `1.5px dashed rgba(232,25,60,.3)`, background: SCLN, aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' },
    heroIconW: { width: 56, height: 56, borderRadius: '50%', background: SCN, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    heroTxt:   { fontSize: 13, color: ONSV, textAlign: 'center', maxWidth: 200, lineHeight: 1.5, fontWeight: 400 },

    // Typography
    sectionTitle: { fontSize: 22, fontWeight: 600, color: ONS, letterSpacing: '-0.01em', lineHeight: '28px', marginBottom: 4 },
    sectionSub:   { fontSize: 14, color: ONSV, marginBottom: 20, lineHeight: 1.5 },

    // Horizontal card (selection) — border lives on the wrapper div, not the card itself
    hCard:    { background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background .15s', textAlign: 'left', width: '100%' },
    hCardSel: { background: SCHN },
    iconBox:  { width: 48, height: 48, borderRadius: 10, background: SCN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hBody:    { flex: 1, minWidth: 0 },
    hTitle:   { fontSize: 14, fontWeight: 500, color: ONS, marginBottom: 2 },
    hDesc:    { fontSize: 12, color: ONSV },
    hPrice:   { fontSize: 14, fontWeight: 600, color: P, flexShrink: 0 },

    // Expanded input panel — sits inside the wrapper, separated by a subtle top border
    expandPanel: { padding: '12px 16px', background: SCHN, borderTop: `0.5px solid ${OV}` },

    // Grid card (lentes)
    grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    gCard:   { background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'border-color .15s' },
    gCardSel:{ border: `1.5px solid ${P}` },
    gImgPh:  { width: '100%', aspectRatio: '4/3', background: SCHN, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    gBody:   { padding: '10px 12px 14px' },

    // Info box
    infoBox: { background: SCLN, border: `0.5px solid rgba(165,54,13,.2)`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16 },
    infoTxt: { fontSize: 13, color: '#6b4a3e', lineHeight: 1.5 },

    // Summary rows
    sumRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, marginBottom: 6 },
    sumLbl:  { fontSize: 14, color: ONSV },
    sumVal:  { fontSize: 14, fontWeight: 600, color: ONS },

    // Footer
    footer:     { position: 'fixed', bottom: 0, left: 0, right: 0, background: SURF, borderTop: `1px solid rgba(224,192,182,.5)`, padding: '10px 16px', zIndex: 50, boxShadow: '0 -4px 24px rgba(37,25,21,.06)' },
    footerRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    totalLbl:   { fontSize: 10, fontWeight: 600, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.06em' },
    totalVal:   { fontSize: 16, fontWeight: 700, color: ONS, letterSpacing: '-0.01em', whiteSpace: 'nowrap' },
    btnPri:     { height: 36, padding: '0 16px', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'opacity .15s', fontFamily: 'inherit' },
    btnSec:     { height: 36, padding: '0 12px', background: SCN, color: ONS, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: 'inherit' },

    // Item card (cameras, drones, etc.)
    itemCard: { background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: 14, marginBottom: 10 },
    itemLabel:{ fontSize: 11, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },

    btnSuc:     { height: 48, padding: '0 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'opacity .15s', fontFamily: 'inherit' },
    btnErr:     { height: 48, padding: '0 20px', background: '#ba1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'opacity .15s', fontFamily: 'inherit' },
  };


  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || (id ? 'edit' : 'create');
  const isView = mode === 'view';

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('pending');

  const [companySearch, setCompanySearch] = useState('');
  const [companyResults, setCompanyResults] = useState([]);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({ nome: '', cnpj: '', contato: '', responsavel: '' });

  const [allCompanies, setAllCompanies] = useState([]);
  useEffect(() => {
    supabase.from('companies').select('*').order('nome').then(({ data }) => setAllCompanies(data || []));
  }, []);

  useEffect(() => {
    if (selectedCompany?.nome === companySearch) {
      setCompanyResults(allCompanies);
      return;
    }
    if (!companySearch) {
      setCompanyResults(allCompanies);
      return;
    }
    setCompanyResults(
      allCompanies.filter(c => c.nome.toLowerCase().includes(companySearch.toLowerCase()))
    );
  }, [companySearch, selectedCompany, allCompanies]);

  const [generalData, setGeneralData] = useState({ nomeProjeto: '', cliente: '', empresaId: '', descricao: '', imgUrl: '' });
  const [logistica, setLogistica]     = useState({ diaViagem: '', diaMontagem: '', diaGravacao: '', diaVolta: '', cidade: '', localEvento: '', distanciaKm: '', valorKm: '' });
  const [estruturas, setEstruturas]   = useState({
    rack:     { checked: false, valor: 0 },
    delivery: { checked: false, valor: 0 },
    carreta:  { checked: false, valor: 0 },
  });
  const [cameras, setCameras]       = useState([
    { modelo: 'Blackmagic URSA G2', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'Sony PXW FX9',      quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'Sony PXW FX3',      quantidade: 0, valorUnit: 0, img: null },
    { modelo: '',                  isOutra: true, quantidade: 0, valorUnit: 0, img: null },
  ]);
  const [lentes, setLentes]         = useState([
    { modelo: '',                isOutra: true, subTitle: 'Modelo personalizado', quantidade: 0, valorUnit: 0 },
    { modelo: 'Canon 50-1000mm', subTitle: 'Super teleobjetiva zoom',  quantidade: 0, valorUnit: 0 },
    { modelo: 'Canon 25-150mm',  subTitle: 'Zoom cinema versátil',    quantidade: 0, valorUnit: 0 },
    { modelo: 'Canon 17-120mm',  subTitle: 'Cine servo zoom',         quantidade: 0, valorUnit: 0 },
    { modelo: 'Sony 200-600mm',  subTitle: 'Teleobjetiva zoom',       quantidade: 0, valorUnit: 0 },
    { modelo: 'Fujinon 20-120mm', subTitle: 'Cabrio zoom lens',        quantidade: 0, valorUnit: 0 },
    { modelo: 'Fujinon 19-90mm',  subTitle: 'Compact cinema zoom',     quantidade: 0, valorUnit: 0 },
    { modelo: 'Sigma 14-24mm',   subTitle: 'Grande angular zoom',     quantidade: 0, valorUnit: 0 },
    { modelo: 'Sony 16-35mm',    subTitle: 'Grande angular GM',       quantidade: 0, valorUnit: 0 },
    { modelo: 'Sony 24-70mm',    subTitle: 'Zoom padrão GM',          quantidade: 0, valorUnit: 0 },
    { modelo: 'Sony 18-110mm',   subTitle: 'Cine zoom Super 35',      quantidade: 0, valorUnit: 0 },
    { modelo: 'Sony 28-135mm',   subTitle: 'Full frame cine zoom',    quantidade: 0, valorUnit: 0 },
    { modelo: 'Angenieux 24-290mm', subTitle: 'Optimo zoom cinema',    quantidade: 0, valorUnit: 0 },
  ]);
  const [drones, setDrones]         = useState([
    { modelo: 'DJI FPV',        subTitle: 'Voo imersivo FPV',           quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'DJI Mavic 3 Pro', subTitle: 'Tri-câmera Hasselblad',     quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'DJI Avata 2',    subTitle: 'FPV O4 + estabilização EIS', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'DJI Air 3S',     subTitle: 'HDR 4K · sensor 1"',        quantidade: 0, valorUnit: 0, img: null },
  ]);
  const [comunicacao, setComunicacao] = useState([]);
  const [movEquip, setMovEquip]     = useState([
    { modelo: 'Steady Cam',   subTitle: 'Estabilização manual de ombro',  quantidade: 0, valorUnit: 0 },
    { modelo: 'DJI Ronin 4D', subTitle: 'Gimbal cinematográfico 4 eixos', quantidade: 0, valorUnit: 0 },
  ]);
  const [gruas, setGruas]   = useState([
    { metragem: '7,50m', quantidade: 0, valorUnit: 0 },
    { metragem: '10m',   quantidade: 0, valorUnit: 0 },
    { metragem: '14m',   quantidade: 0, valorUnit: 0 },
  ]);
  const [trilhos, setTrilhos] = useState([]);
  const [equipe, setEquipe]         = useState([
    { funcao: 'Assistentes',          qtd: 0, valorPessoa: 0, nomes: [] },
    { funcao: 'Técnicos de Sistemas', qtd: 0, valorPessoa: 0, nomes: [] },
    { funcao: 'Coordenadores',        qtd: 0, valorPessoa: 0, nomes: [] },
    { funcao: 'Técnicos de Câmeras',  qtd: 0, valorPessoa: 0, nomes: [] },
    { funcao: 'Video Man',            qtd: 0, valorPessoa: 0, nomes: [] },
    { funcao: 'Maquinistas',          qtd: 0, valorPessoa: 0, nomes: [] },
    { funcao: 'Motoristas',           qtd: 0, valorPessoa: 0, nomes: [] },
  ]);
  const [verbaAlimentacao, setVerbaAlimentacao] = useState(0);
  const [desconto, setDesconto] = useState({
    modo: 'global',    // 'global' | 'porItem'
    tipo: 'percent',   // 'percent' | 'valor'
    valor: '',
    itens: { estrutura: '', cameras: '', lentes: '', aereo: '', comunicacao: '', movimento: '', equipe: '' },
  });
  const [lensSearch, setLensSearch] = useState('');

  const [cidadeSugestoes, setCidadeSugestoes] = useState([]);
  const [isCidadeDropdownOpen, setIsCidadeDropdownOpen] = useState(false);

  useEffect(() => {
    const texto = logistica.cidade;
    if (!isCidadeDropdownOpen || !texto || texto.length < 2) {
      setCidadeSugestoes([]);
      return;
    }

    const normalizar = (str) => 
      str.normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
         .toLowerCase();

    const buscarCidades = async () => {
      if (!window.__cidadesCache) {
        try {
          const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
          window.__cidadesCache = await res.json();
        } catch (e) { return; }
      }
      const filtradas = window.__cidadesCache
        .filter(c => normalizar(c.nome).includes(normalizar(texto)))
        .slice(0, 10);
      setCidadeSugestoes(filtradas);
    };
    const t = setTimeout(buscarCidades, 300);
    return () => clearTimeout(t);
  }, [logistica.cidade, isCidadeDropdownOpen]);

  // ── Load existing budget (edit mode) ──
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data: b } = await supabase.from('budgets').select('*').eq('id', id).single();
        if (!b) return;
        setStatus(b.status || 'pending');
        setGeneralData({ nomeProjeto: b.nome_projeto || '', cliente: b.cliente || '', empresaId: b.empresa_id || '', descricao: b.descricao || '' });
        if (b.empresa_id) {
          const { data: emp } = await supabase.from('companies').select('*').eq('id', b.empresa_id).single();
          if (emp) {
            setSelectedCompany(emp);
            setCompanySearch(emp.nome);
          }
        }
        setLogistica({ diaViagem: b.data_viagem || '', diaMontagem: b.data_montagem || '', diaGravacao: b.data_gravacao || '', diaVolta: b.data_volta || '' });
        if (b.tipo_estrutura?.length) {
          setEstruturas(prev => {
            const next = { ...prev };
            b.tipo_estrutura.forEach(e => { if (next[e.tipo]) next[e.tipo] = { checked: true, valor: e.valor }; });
            return next;
          });
        }
        const { data: eq } = await supabase.from('budget_equipment').select('*').eq('budget_id', id).maybeSingle();
        if (eq) {
          if (eq.cameras) {
            setCameras(prev => {
              const stdModels = ['Sony PXW FX9', 'Blackmagic URSA G2', 'Sony PXW FX3'];
              const customCam = eq.cameras.find(x => !stdModels.includes(x.modelo));
              return prev.map(c => {
                if (c.isOutra && customCam) {
                  return { ...c, modelo: customCam.modelo, quantidade: customCam.quantidade || 0, valorUnit: customCam.valorUnit || 0 };
                }
                const s = eq.cameras.find(x => x.modelo === c.modelo);
                return s ? { ...c, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : c;
              });
            });
          }
          if (eq.lentes) {
            setLentes(prev => {
              const stdModels = ['Canon 50-1000mm', 'Canon 25-150mm', 'Canon 17-120mm', 'Sony 200-600mm', 'Fujinon 20-120mm', 'Fujinon 19-90mm', 'Sigma 14-24mm', 'Sony 16-35mm', 'Sony 24-70mm', 'Sony 18-110mm', 'Sony 28-135mm'];
              const customLente = eq.lentes.find(x => !stdModels.includes(x.modelo));
              return prev.map(l => {
                if (l.isOutra && customLente) {
                  return { ...l, modelo: customLente.modelo, quantidade: customLente.quantidade || 0, valorUnit: customLente.valorUnit || 0 };
                }
                const s = eq.lentes.find(x => x.modelo === l.modelo);
                return s ? { ...l, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : l;
              });
            });
          }
          if (eq.aereo)      setDrones(prev     => prev.map(d => { const s = eq.aereo.find(x => x.modelo === d.modelo);       return s ? { ...d, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : d; }));
          if (eq.comunicacao) setComunicacao(eq.comunicacao);
          if (eq.movimento) {
            setMovEquip(prev => prev.map(m => {
              const s = eq.movimento.find(x => x.modelo === m.modelo);
              return s ? { ...m, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : m;
            }));
            setGruas(prev => prev.map(g => {
              const s = eq.movimento.find(x => x.metragem === g.metragem && (x.modelo || '').startsWith('Grua'));
              return s ? { ...g, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : g;
            }));
            const savedTrilhos = eq.movimento.filter(x => x.tipoCarrinho !== undefined);
            if (savedTrilhos.length) setTrilhos(savedTrilhos.map(t => ({ metragem: t.metragem || '', tipoCarrinho: t.tipoCarrinho || '', quantidade: t.quantidade || 0, valorUnit: t.valorUnit || 0 })));
          }
        }
        const { data: tm } = await supabase.from('budget_team').select('*').eq('budget_id', id).maybeSingle();
        if (tm) {
          if (tm.equipe) setEquipe(prev => prev.map(e => { const s = tm.equipe.find(x => x.funcao === e.funcao); return s ? { ...e, qtd: s.qtd || 0, valorPessoa: s.valorPessoa || 0, nomes: s.nomes || [] } : e; }));
          setVerbaAlimentacao(tm.verba_alimentacao || 0);
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [id]);

  // ── Totals ──
  const totalEstrutura = Object.values(estruturas).reduce((a, e) => a + (e.checked ? Number(e.valor) || 0 : 0), 0);
  const totalCameras   = cameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0), 0);
  const totalLentes    = lentes.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0), 0);
  const totalAereo     = drones.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0), 0);
  const totalCom       = comunicacao.reduce((a, c) => a + (Number(c.valor) || 0), 0);
  const totalMovimento = movEquip.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0), 0)
    + gruas.reduce((a, g) => a + (Number(g.quantidade) || 0) * (Number(g.valorUnit) || 0), 0)
    + trilhos.reduce((a, t) => a + (Number(t.quantidade) || 0) * (Number(t.valorUnit) || 0), 0);
  const totalEquipe    = equipe.reduce((a, e) => a + e.qtd * e.valorPessoa, 0) + (Number(verbaAlimentacao) || 0);
  const totalFrete     = (Number(logistica.distanciaKm) || 0) * (Number(logistica.valorKm) || 0);
  const subtotal       = totalEstrutura + totalCameras + totalLentes + totalAereo + totalCom + totalMovimento + totalEquipe + totalFrete;
  const descontoAmt    = desconto.modo === 'global'
    ? (desconto.tipo === 'percent' ? subtotal * (Number(desconto.valor) || 0) / 100 : Number(desconto.valor) || 0)
    : Object.entries(desconto.itens).reduce((a, [key, v]) => {
        const base = { frete: totalFrete, estrutura: totalEstrutura, cameras: totalCameras, lentes: totalLentes, aereo: totalAereo, comunicacao: totalCom, movimento: totalMovimento, equipe: totalEquipe }[key] || 0;
        return a + base * (Number(v) || 0) / 100;
      }, 0);
  const grandTotal     = subtotal - descontoAmt;

  // ── Validation ──
  const canAdvance = () => true;

  const next = () => { if (currentStep < 10) setCurrentStep(s => s + 1); };
  const prev = () => { if (currentStep > 1)  setCurrentStep(s => s - 1); };

  const setLen = (arr, setArr, len, tpl) => setArr(Array.from({ length: len }, (_, i) => arr[i] || tpl(i)));
  const upd    = (arr, setArr, i, field, val) => { const a = [...arr]; a[i] = { ...a[i], [field]: val }; setArr(a); };

  const toggleEstrutura = (key) => {
    if (isView) return;
    setEstruturas(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }));
  };

  // ── Save ──
  const handleSave = async (newStatus = null) => {
    setIsSaving(true);
    try {
      const activeEstruturas = Object.keys(estruturas).filter(k => estruturas[k].checked).map(k => ({ tipo: k, valor: estruturas[k].valor }));
      const movimentoPayload = [
        ...movEquip,
        ...gruas.filter(g => g.quantidade > 0).map(g => ({ modelo: `Grua ${g.metragem}`, metragem: g.metragem, quantidade: g.quantidade, valorUnit: g.valorUnit })),
        ...trilhos.map(t => ({ modelo: `Trilho ${t.metragem}`, metragem: t.metragem, tipoCarrinho: t.tipoCarrinho, quantidade: t.quantidade, valorUnit: t.valorUnit })),
      ];
      
      const targetStatus = newStatus || status || 'pending';
      
      const budgetPayload = {
        nome_projeto:   generalData.nomeProjeto,
        cliente:        generalData.cliente,
        empresa_id:     generalData.empresaId || null,
        descricao:      generalData.descricao || null,
        tipo_estrutura: activeEstruturas,
        data_viagem:    logistica.diaViagem   || null,
        data_montagem:  logistica.diaMontagem || null,
        data_gravacao:  logistica.diaGravacao || null,
        data_volta:     logistica.diaVolta    || null,
        total:          grandTotal || 0,
        status:         targetStatus,
        ...(targetStatus === 'rejected' ? { data_reprovacao: new Date().toISOString() } : {})
      };

      let budgetId = id;
      if (id) {
        // UPDATE
        const { error } = await supabase.from('budgets').update(budgetPayload).eq('id', id);
        if (error) throw error;
        // Upsert equipment
        await supabase.from('budget_equipment').upsert({ budget_id: id, cameras, lentes, aereo: drones, comunicacao, movimento: movimentoPayload }, { onConflict: 'budget_id' });
        if (equipe.some(e => e.qtd > 0))
          await supabase.from('budget_team').upsert({ budget_id: id, equipe, verba_alimentacao: verbaAlimentacao || 0 }, { onConflict: 'budget_id' });
      } else {
        // INSERT
        const { data: budget, error } = await supabase.from('budgets').insert(budgetPayload).select().single();
        if (error) throw error;
        budgetId = budget.id;
        if (cameras.length || lentes.length || drones.length || comunicacao.length || movEquip.some(m => m.quantidade > 0))
          await supabase.from('budget_equipment').insert({ budget_id: budgetId, cameras, lentes, aereo: drones, comunicacao, movimento: movimentoPayload });
        if (equipe.some(e => e.qtd > 0))
          await supabase.from('budget_team').insert({ budget_id: budgetId, equipe, verba_alimentacao: verbaAlimentacao || 0 });
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const step    = STEPS[currentStep - 1];


  // ── Hero section ──
  const Hero = ({ icon, text, imgUrl }) => (
    imgUrl
      ? <div style={{ margin: '16px 16px 0', borderRadius: 10, overflow: 'hidden', lineHeight: 0 }}>
          <img src={imgUrl} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
        </div>
      : <div style={S.hero}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(37,25,21,.06))', pointerEvents: 'none' }} />
          <div style={S.heroIconW}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: P }}>{icon}</span>
          </div>
          <p style={S.heroTxt}>{text}</p>
        </div>
  );

  // ── Step content ──
  const renderStep = () => {
    switch (currentStep) {

      // ── 1. Dados Gerais ──
      case 1: return (
        <>
          <div style={{ ...S.inner, paddingTop: 16 }}>
            <img 
              src="/IMAGEM_ETAPA01.jpeg"
              alt="Etapa 1"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />

            <h2 style={S.sectionTitle}>Dados do Projeto</h2>
            <Field label="Nome do Projeto *">
              <FInput disabled={isView} type="text" placeholder="Ex: Copa do Brasil 2025" value={generalData.nomeProjeto} onChange={e => setGeneralData({ ...generalData, nomeProjeto: e.target.value })} />
            </Field>
            <Field label="Cliente *">
              <div style={{ position: 'relative' }}>
                <FInput
                  disabled={isView}
                  placeholder="Buscar empresa cadastrada..."
                  value={companySearch}
                  onChange={e => {
                    setCompanySearch(e.target.value);
                    setSelectedCompany(null);
                    setGeneralData({ ...generalData, empresaId: '', cliente: e.target.value });
                    setIsCompanyDropdownOpen(true);
                  }}
                  onFocus={() => setIsCompanyDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCompanyDropdownOpen(false), 200)}
                />
                {isCompanyDropdownOpen && !selectedCompany && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: SURF, border: `1px solid ${OV}`, borderRadius: 8, marginTop: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 250, overflowY: 'auto' }}>
                    {companyResults.length > 0 ? (
                      companyResults.map(emp => (
                        <div
                          key={emp.id}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${OV}`, fontSize: 14, color: ONS }}
                          onMouseDown={() => {
                            setSelectedCompany(emp);
                            setCompanySearch(emp.nome);
                            setGeneralData({ ...generalData, empresaId: emp.id, cliente: emp.nome });
                            setIsCompanyDropdownOpen(false);
                          }}
                        >
                          {emp.nome}
                          {emp.cnpj && <div style={{ fontSize: 11, color: ONSV, marginTop: 2 }}>{emp.cnpj}</div>}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 14px', fontSize: 13, color: ONSV, fontStyle: 'italic', borderBottom: `1px solid ${OV}` }}>
                        Nenhuma empresa encontrada.
                      </div>
                    )}
                    <div
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, color: P, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewCompanyData({ nome: companySearch, cnpj: '', contato: '', responsavel: '' });
                        setShowCompanyModal(true);
                        setIsCompanyDropdownOpen(false);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                      + Criar nova empresa
                    </div>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Descrição">
              <FTextarea disabled={isView} rows={3} placeholder="Detalhes do projeto…" value={generalData.descricao} onChange={e => setGeneralData({ ...generalData, descricao: e.target.value })} />
            </Field>
          </div>
        </>
      );

      // ── 2. Logística ──
      case 2: return (
        <>
          <div style={{ ...S.inner, paddingTop: 16 }}>
            <img 
              src="/IMAGEM_ETAPA02.jpeg"
              alt="Logística"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Logística</h2>

            <Field label="Cidade">
              <div style={{ position: 'relative' }}>
                <FInput 
                  disabled={isView} 
                  type="text" 
                  placeholder="Ex: São Paulo, SP" 
                  value={logistica.cidade} 
                  onChange={e => {
                    setLogistica({ ...logistica, cidade: e.target.value });
                    setIsCidadeDropdownOpen(true);
                  }}
                  onFocus={() => setIsCidadeDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCidadeDropdownOpen(false), 200)}
                />
                {isCidadeDropdownOpen && cidadeSugestoes.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: SURF, border: `1px solid ${OV}`, borderRadius: 8, marginTop: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 250, overflowY: 'auto' }}>
                    {cidadeSugestoes.map(c => (
                      <div 
                        key={c.id} 
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${OV}`, fontSize: 14, color: ONS }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setLogistica({ ...logistica, cidade: `${c.nome} - ${c.microrregiao.mesorregiao.UF.sigla}` });
                          setIsCidadeDropdownOpen(false);
                        }}
                      >
                        {c.nome} - {c.microrregiao.mesorregiao.UF.sigla}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Local do Evento">
              <FInput disabled={isView} type="text" placeholder="Ex: Estádio do Morumbi" value={logistica.localEvento} onChange={e => setLogistica({ ...logistica, localEvento: e.target.value })} />
            </Field>

            <Field label="Dia de Viagem"><FInput disabled={isView} type="date" value={logistica.diaViagem} onChange={e => setLogistica({ ...logistica, diaViagem: e.target.value })} /></Field>
            <Field label="Dia de Montagem"><FInput disabled={isView} type="date" value={logistica.diaMontagem} onChange={e => setLogistica({ ...logistica, diaMontagem: e.target.value })} /></Field>
            <Field label="Dia de Gravação"><FInput disabled={isView} type="date" value={logistica.diaGravacao} onChange={e => setLogistica({ ...logistica, diaGravacao: e.target.value })} /></Field>
            <Field label="Dia de Volta"><FInput disabled={isView} type="date" value={logistica.diaVolta} onChange={e => setLogistica({ ...logistica, diaVolta: e.target.value })} /></Field>

            {/* Frete */}
            <div style={{ marginTop: 8, background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: P }}>local_shipping</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>Frete</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <Field label="Distância (km)">
                  <FInput disabled={isView} type="number" placeholder="0" value={logistica.distanciaKm} onChange={e => setLogistica({ ...logistica, distanciaKm: e.target.value })} />
                </Field>
                <Field label="Valor por km (R$)">
                  <FInput disabled={isView} type="number" placeholder="0,00" value={logistica.valorKm} onChange={e => setLogistica({ ...logistica, valorKm: e.target.value })} />
                </Field>
              </div>
              {totalFrete > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: SCN, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: P }}>calculate</span>
                    <span style={{ fontSize: 12, color: ONSV }}>
                      {logistica.distanciaKm} km × R$ {fmt(logistica.valorKm)}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: P }}>R$ {fmt(totalFrete)}</span>
                </div>
              )}
            </div>
          </div>
        </>
      );

      // ── 3. Estrutura ──
      case 3: return (
        <>
          <div style={{ ...S.inner, paddingTop: 16 }}>
            <img 
              src="/IMAGEM_ETAPA03.jpeg"
              alt="Estrutura"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Escolha a Infraestrutura</h2>

            {[
              { key: 'rack',     label: 'Rack',                    desc: 'Solução logística compacta' },
              { key: 'delivery', label: 'Unidade Móvel Delivery',  desc: 'Unidade profissional média' },
              { key: 'carreta',  label: 'Unidade Móvel Carreta',   desc: 'Estação de broadcast completa' },
            ].map(({ key, label, desc }) => {
              const sel = estruturas[key].checked;
              const estruturaImages = {
                'rack': '/IMAGEM_RACK.jpeg',
                'delivery': '/IMAGEM_DELIVERY.jpeg',
                'carreta': '/IMAGEM_CARRETA.jpeg'
              };
              
              return (
                <div key={key} style={{ 
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${sel ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}>
                  <button 
                    style={{ 
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }} 
                    onClick={() => toggleEstrutura(key)}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'
                    }}>
                      <img 
                        src={estruturaImages[key]}
                        alt={label}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <div style={S.hBody}>
                      <div style={S.hTitle}>{label}</div>
                      <div style={S.hDesc}>{desc}</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: sel ? P : (isDark ? '#444' : '#CCC'), flexShrink: 0 }}>
                      {sel ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                  {sel && (
                    <div style={S.expandPanel}>
                      <Field label="Valor (R$)">
                        <FInput disabled={isView} type="number" placeholder="0,00" value={estruturas[key].valor || ''} onChange={e => setEstruturas({ ...estruturas, [key]: { ...estruturas[key], valor: parseFloat(e.target.value) || 0 } })} />
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}

            {!Object.values(estruturas).some(e => e.checked) && (
              <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: ONSV }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>add_circle</span>
                Nenhuma unidade selecionada
              </div>
            )}
          </div>
        </>
      );

      // ── 4. Câmeras ──
      case 4: return (
        <>
          <div style={{ ...S.inner, paddingTop: 16 }}>
            <img 
              src="/IMAGEM_ETAPA04.jpeg"
              alt="Câmeras"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Câmeras</h2>

            {(() => {
              const cameraImages = {
                'Blackmagic URSA G2': '/IMAGEM_BLACKMAGIC.jpeg',
                'Sony PXW FX9': '/IMAGEM_FX9.jpeg',
                'Sony PXW FX3': '/IMAGEM_FX3.jpeg',
              };

              return cameras.map((cam, i) => (
                <Fragment key={i}>
                  <div style={{ 
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    border: `1px solid ${cam.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: cam.quantidade > 0 ? `0 0 8px rgba(232, 25, 60, 0.15)` : 'none'
                  }}>
                    <div style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 8, 
                      overflow: 'hidden', 
                      background: isDark ? '#2A2A2A' : '#F5F5F5', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0 
                    }}>
                      {cam.img || cameraImages[cam.modelo]
                        ? <img 
                            src={cam.img || cameraImages[cam.modelo]} 
                            alt={cam.modelo} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover'
                            }} 
                          />
                        : <span className="material-symbols-outlined" style={{ fontSize: 22, color: SEC }}>videocam</span>
                      }
                    </div>
                    <div style={S.hBody}>
                      {cam.isOutra ? (
                        <div style={{ marginBottom: 4 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outras (digitar modelo)</label>
                          <FInput 
                            disabled={isView} 
                            type="text" 
                            placeholder="Digite o modelo da câmera..." 
                            value={cam.modelo} 
                            onChange={e => upd(cameras, setCameras, i, 'modelo', e.target.value)} 
                            style={{ padding: '6px 10px', fontSize: 13 }}
                          />
                        </div>
                      ) : (
                        <div style={S.hTitle}>{cam.modelo}</div>
                      )}
                      {cam.quantidade > 0 && cam.valorUnit > 0 && (
                        <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 2 }}>R$ {fmt(cam.quantidade * cam.valorUnit)}</div>
                      )}
                    </div>
                    <Stepper disabled={isView} value={cam.quantidade} onChange={n => upd(cameras, setCameras, i, 'quantidade', n)} />
                  </div>
                  {cam.quantidade > 0 && (
                    <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                      <Field label="Valor unitário (R$)">
                        <FInput disabled={isView} type="number" placeholder="0,00" value={cam.valorUnit || ''} onChange={e => upd(cameras, setCameras, i, 'valorUnit', parseFloat(e.target.value) || 0)} />
                      </Field>
                    </div>
                  )}
                </Fragment>
              ));
            })()}

          </div>
        </>
      );

      // ── 5. Lentes ──
      case 5: return (
        <>
          <div style={{ ...S.inner, paddingTop: 16 }}>
            <img 
              src="/IMAGEM_ETAPA05.jpeg"
              alt="Lentes"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Lentes</h2>

            <Field label="Pesquisar Lente">
              <div style={{ position: 'relative' }}>
                <FInput 
                  placeholder="Ex: Canon, Sony, 50mm..." 
                  value={lensSearch} 
                  onChange={e => setLensSearch(e.target.value)} 
                  style={{ paddingLeft: 36 }}
                />
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: OV }}>search</span>
              </div>
            </Field>

            {lentes
              .filter(l => l.modelo.toLowerCase().includes(lensSearch.toLowerCase()) || l.subTitle.toLowerCase().includes(lensSearch.toLowerCase()))
              .map((l, i) => {
                const originalIndex = lentes.findIndex(x => x.modelo === l.modelo);
                return (
                  <div key={l.modelo} style={{ 
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    border: `1px solid ${l.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ ...S.iconBox, background: l.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: l.quantidade > 0 ? P : OL }}>photo_camera</span>
                    </div>
                    <div style={S.hBody}>
                      {l.isOutra ? (
                        <div style={{ marginBottom: 4 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outras (digitar modelo)</label>
                          <FInput 
                            disabled={isView} 
                            type="text" 
                            placeholder="Digite o modelo da lente..." 
                            value={l.modelo} 
                            onChange={e => upd(lentes, setLentes, originalIndex, 'modelo', e.target.value)} 
                            style={{ padding: '6px 10px', fontSize: 13 }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={S.hTitle}>{l.modelo}</div>
                          <div style={S.hDesc}>{l.subTitle}</div>
                        </>
                      )}
                      {l.quantidade > 0 && l.valorUnit > 0 && (
                        <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(l.quantidade * l.valorUnit)}</div>
                      )}
                    </div>
                    <Stepper disabled={isView} value={l.quantidade} onChange={n => upd(lentes, setLentes, originalIndex, 'quantidade', n)} />
                  </div>
                );
              })}

            <div style={S.infoBox}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: P, flexShrink: 0 }}>info</span>
              <p style={{ ...S.infoTxt, color: '#FFFFFF' }}>As lentes incluem filtros de proteção e cases rígidos para transporte.</p>
            </div>
          </div>
        </>
      );

      // ── 6. Drones ──
      case 6: return (
        <>
          <div style={{ ...S.inner, paddingTop: 16 }}>
            <img 
              src="/IMAGEM_ETAPA06.jpeg"
              alt="Drones"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Drones</h2>

            {drones.map((d, i) => (
              <Fragment key={i}>
                <div style={{ 
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${d.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ ...S.iconBox, background: d.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: d.quantidade > 0 ? P : OL }}>drone</span>
                  </div>
                  <div style={S.hBody}>
                    <div style={S.hTitle}>{d.modelo}</div>
                    <div style={S.hDesc}>{d.subTitle}</div>
                    {d.quantidade > 0 && d.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(d.quantidade * d.valorUnit)}</div>
                    )}
                  </div>
                  <Stepper disabled={isView} value={d.quantidade} onChange={n => upd(drones, setDrones, i, 'quantidade', n)} />
                </div>
                {d.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <Field label="Valor unitário (R$)">
                      <FInput disabled={isView} type="number" placeholder="0,00" value={d.valorUnit || ''} onChange={e => upd(drones, setDrones, i, 'valorUnit', parseFloat(e.target.value) || 0)} />
                    </Field>
                    {d.valorUnit > 0 && (
                      <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                        {d.quantidade}× R$ {fmt(d.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(d.quantidade * d.valorUnit)}</strong>
                      </p>
                    )}
                  </div>
                )}
              </Fragment>
            ))}

          </div>
        </>
      );

      // ── 7. Comunicação ──
      case 7: return (
        <>
          <div style={S.inner}>
            <img 
              src="/IMAGEM_ETAPA07.jpeg"
              alt="Lentes"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Comunicação</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '12px 14px', background: SCLO, border: `0.5px solid rgba(224,192,182,.6)`, borderRadius: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: ONS }}>Kits de comunicação</span>
              <Stepper disabled={isView} value={comunicacao.length} onChange={n => setLen(comunicacao, setComunicacao, n, () => ({ modelo: '', pontos: 1, valor: 0 }))} />
            </div>
            {comunicacao.map((c, i) => (
              <div key={i} style={S.itemCard}>
                <p style={S.itemLabel}>Kit {i + 1}</p>
                <Field label="Modelo"><FInput disabled={isView} type="text" value={c.modelo} onChange={e => upd(comunicacao, setComunicacao, i, 'modelo', e.target.value)} /></Field>
                <Field label="Pontos (Rádios)"><FInput disabled={isView} type="number" value={c.pontos || ''} onChange={e => upd(comunicacao, setComunicacao, i, 'pontos', e.target.value)} /></Field>
                <Field label="Valor Total (R$)"><FInput disabled={isView} type="number" value={c.valor || ''} onChange={e => upd(comunicacao, setComunicacao, i, 'valor', e.target.value)} /></Field>
              </div>
            ))}
          </div>
        </>
      );

      // ── 8. Movimento ──
      case 8: return (
        <>
          <div style={S.inner}>
            <img 
              src="/IMAGEM_ETAPA08.jpeg"
              alt="Lentes"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Movimento</h2>

            {/* Steady Cam + Ronin */}
            {movEquip.map((m, i) => (
              <Fragment key={i}>
                <div style={{ 
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${m.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ ...S.iconBox, background: m.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: m.quantidade > 0 ? P : OL }}>switch_video</span>
                  </div>
                  <div style={S.hBody}>
                    <div style={S.hTitle}>{m.modelo}</div>
                    <div style={S.hDesc}>{m.subTitle}</div>
                    {m.quantidade > 0 && m.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(m.quantidade * m.valorUnit)}</div>
                    )}
                  </div>
                  <Stepper disabled={isView} value={m.quantidade} onChange={n => upd(movEquip, setMovEquip, i, 'quantidade', n)} />
                </div>
                {m.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <Field label="Valor unitário (R$)">
                      <FInput disabled={isView} type="number" placeholder="0,00" value={m.valorUnit || ''} onChange={e => upd(movEquip, setMovEquip, i, 'valorUnit', parseFloat(e.target.value) || 0)} />
                    </Field>
                    {m.valorUnit > 0 && (
                      <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                        {m.quantidade}× R$ {fmt(m.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(m.quantidade * m.valorUnit)}</strong>
                      </p>
                    )}
                  </div>
                )}
              </Fragment>
            ))}

            {/* Gruas */}
            <div style={{ background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: P }}>settings_overscan</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>Gruas</span>
              </div>
              {gruas.map((g, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: i < gruas.length - 1 || g.quantidade > 0 ? `0.5px solid ${OV}` : 'none' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: ONS }}>Grua {g.metragem}</div>
                      {g.quantidade > 0 && g.valorUnit > 0 && (
                        <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 2 }}>R$ {fmt(g.quantidade * g.valorUnit)}</div>
                      )}
                    </div>
                    <Stepper disabled={isView} value={g.quantidade} onChange={n => { const ng = [...gruas]; ng[i] = { ...ng[i], quantidade: n }; setGruas(ng); }} />
                  </div>
                  {g.quantidade > 0 && (
                    <div style={{ paddingBottom: i < gruas.length - 1 ? 10 : 0, marginBottom: i < gruas.length - 1 ? 10 : 0, borderBottom: i < gruas.length - 1 ? `0.5px solid ${OV}` : 'none' }}>
                      <label style={S.fLabel}>Valor unitário (R$)</label>
                      <FInput disabled={isView} type="number" placeholder="0,00" value={g.valorUnit || ''} onChange={e => { const ng = [...gruas]; ng[i] = { ...ng[i], valorUnit: parseFloat(e.target.value) || 0 }; setGruas(ng); }} />
                      {g.valorUnit > 0 && (
                        <p style={{ fontSize: 12, color: ONSV, marginTop: 6 }}>
                          {g.quantidade}× R$ {fmt(g.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(g.quantidade * g.valorUnit)}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Trilhos */}
            <div style={{ background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: trilhos.length > 0 ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: P }}>linear_scale</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>Trilhos</span>
                </div>
                <Stepper disabled={isView} value={trilhos.length} onChange={n => setLen(trilhos, setTrilhos, n, () => ({ metragem: '', tipoCarrinho: '', quantidade: 1, valorUnit: 0 }))} />
              </div>
              {trilhos.map((t, i) => (
                <div key={i} style={{ borderTop: `0.5px solid ${OV}`, paddingTop: 12, marginTop: i === 0 ? 0 : 0 }}>
                  <p style={{ ...S.itemLabel, marginBottom: 10 }}>Trilho {i + 1}</p>
                  <Field label="Tamanho do Trilho">
                    <FSelect disabled={isView} value={t.metragem} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], metragem: e.target.value }; setTrilhos(nt); }}>
                      <option value="">Selecione…</option>
                      <option value="1m">1 metro</option>
                      <option value="2m">2 metros</option>
                      <option value="3m">3 metros</option>
                      <option value="6m">6 metros</option>
                      <option value="9m">9 metros</option>
                      <option value="12m">12 metros</option>
                      <option value="15m">15 metros</option>
                      <option value="18m">18 metros</option>
                      <option value="21m">21 metros</option>
                      <option value="24m">24 metros</option>
                      <option value="Personalizado">Personalizado</option>
                    </FSelect>
                  </Field>
                  <Field label="Tipo de Carrinho">
                    <FSelect disabled={isView} value={t.tipoCarrinho} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], tipoCarrinho: e.target.value }; setTrilhos(nt); }}>
                      <option value="">Selecione…</option>
                      <option value="Doorway Dolly">Doorway Dolly</option>
                      <option value="Dolly Standard">Dolly Standard</option>
                      <option value="Super Panther">Super Panther</option>
                      <option value="Fisher 10">Fisher 10</option>
                      <option value="Outro">Outro</option>
                    </FSelect>
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Quantidade">
                      <FInput disabled={isView} type="number" placeholder="1" value={t.quantidade || ''} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], quantidade: parseInt(e.target.value) || 0 }; setTrilhos(nt); }} />
                    </Field>
                    <Field label="Valor (R$)">
                      <FInput disabled={isView} type="number" placeholder="0,00" value={t.valorUnit || ''} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], valorUnit: parseFloat(e.target.value) || 0 }; setTrilhos(nt); }} />
                    </Field>
                  </div>
                  {t.quantidade > 0 && t.valorUnit > 0 && (
                    <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                      {t.quantidade}× R$ {fmt(t.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(t.quantidade * t.valorUnit)}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>
        </>
      );

      // ── 9. Equipe ──
      case 9: return (
        <>
          <div style={S.inner}>
            <img 
              src="/IMAGEM_ETAPA09.jpeg"
              alt="Lentes"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto 24px'
              }}
            />
            <h2 style={S.sectionTitle}>Equipe</h2>

            {equipe.map((m, i) => (
              <div key={i} style={{ 
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`,
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: m.qtd > 0 ? 14 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: SCN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: SEC }}>person</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: ONS }}>{m.funcao}</span>
                  </div>
                  <Stepper disabled={isView} value={m.qtd} onChange={n => {
                    const ne = [...equipe];
                    ne[i].qtd = n;
                    ne[i].nomes = Array.from({ length: n }, (_, x) => ne[i].nomes[x] || '');
                    setEquipe(ne);
                  }} />
                </div>
                {m.qtd > 0 && (
                  <div style={{ borderTop: `0.5px solid ${OV}`, paddingTop: 12 }}>
                    <Field label="Valor por Pessoa (R$)">
                      <FInput disabled={isView} type="number" value={m.valorPessoa || ''} onChange={e => { const ne = [...equipe]; ne[i].valorPessoa = parseFloat(e.target.value) || 0; setEquipe(ne); }} />
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: SCLN, borderRadius: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: ONSV }}>Subtotal</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: P }}>R$ {fmt(m.qtd * m.valorPessoa)}</span>
                    </div>
                    {m.nomes.map((nome, ni) => (
                      <FInput key={ni} disabled={isView} style={{ marginBottom: 6, fontSize: 13 }} type="text" placeholder={`Nome ${ni + 1} (opcional)`} value={nome} onChange={e => { const ne = [...equipe]; ne[i].nomes[ni] = e.target.value; setEquipe(ne); }} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={{ ...S.itemCard, marginTop: 4 }}>
              <Field label="Verba de Alimentação Total (R$)">
                <FInput disabled={isView} type="number" value={verbaAlimentacao || ''} onChange={e => setVerbaAlimentacao(parseFloat(e.target.value) || 0)} />
              </Field>
            </div>
          </div>
        </>
      );

      // ── 10. Resumo ──
      case 10: {
        const catRows = [
          { key: 'frete',       label: 'Frete',       icon: 'local_shipping', value: totalFrete      },
          { key: 'estrutura',   label: 'Estrutura',   icon: 'warehouse',      value: totalEstrutura  },
          { key: 'cameras',     label: 'Câmeras',     icon: 'videocam',       value: totalCameras    },
          { key: 'lentes',      label: 'Lentes',      icon: 'photo_camera',   value: totalLentes     },
          { key: 'aereo',       label: 'Drones',      icon: 'drone',          value: totalAereo      },
          { key: 'comunicacao', label: 'Comunicação', icon: 'cell_tower',     value: totalCom        },
          { key: 'movimento',   label: 'Movimento',   icon: 'switch_video',   value: totalMovimento  },
          { key: 'equipe',      label: 'Equipe',      icon: 'groups',         value: totalEquipe     },
        ].filter(r => r.value > 0);

        const segBtn = (label, active, onClick) => (
          <button onClick={onClick} style={{ flex: 1, height: 34, border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: active ? P : 'transparent', color: active ? '#fff' : ONSV, transition: 'all .15s' }}>
            {label}
          </button>
        );

        return (
          <>
            <div style={S.inner}>
              <img 
                src="/IMAGEM_ETAPA10.jpeg"
                alt="Lentes"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  display: 'block',
                  margin: '0 auto 24px'
                }}
              />
              <h2 style={S.sectionTitle}>Resumo</h2>

              {/* Category rows */}
              {catRows.map(r => (
                <div key={r.label} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px', 
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', 
                  border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, 
                  borderRadius: '10px', 
                  marginBottom: '6px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: ONSV }}>{r.icon}</span>
                    <span style={S.sumLbl}>{r.label}</span>
                  </div>
                  <span style={S.sumVal}>R$ {fmt(r.value)}</span>
                </div>
              ))}

              {/* Discount section */}
              {!isView && subtotal > 0 && (
                <div style={{ marginTop: 20, background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: P }}>local_offer</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>Desconto</span>
                  </div>

                  {/* Mode toggle */}
                  <div style={{ display: 'flex', background: SCN, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                    {segBtn('Global', desconto.modo === 'global',   () => setDesconto(d => ({ ...d, modo: 'global' })))}
                    {segBtn('Por Categoria', desconto.modo === 'porItem', () => setDesconto(d => ({ ...d, modo: 'porItem' })))}
                  </div>

                  {desconto.modo === 'global' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ display: 'flex', background: SCN, borderRadius: 8, padding: 3, flexShrink: 0 }}>
                        {['percent', 'valor'].map(t => (
                          <button key={t} onClick={() => setDesconto(d => ({ ...d, tipo: t }))} style={{ width: 36, height: 30, border: 'none', borderRadius: 6, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: desconto.tipo === t ? P : 'transparent', color: desconto.tipo === t ? '#fff' : ONSV, transition: 'all .15s' }}>
                            {t === 'percent' ? '%' : 'R$'}
                          </button>
                        ))}
                      </div>
                      <FInput type="number" placeholder={desconto.tipo === 'percent' ? '0' : '0,00'} value={desconto.valor} onChange={e => setDesconto(d => ({ ...d, valor: e.target.value }))} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catRows.map(r => (
                        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ flex: 1, fontSize: 13, color: ONSV }}>{r.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 120 }}>
                            <FInput type="number" placeholder="0" value={desconto.itens[r.key] || ''} onChange={e => setDesconto(d => ({ ...d, itens: { ...d.itens, [r.key]: e.target.value } }))} style={{ padding: '8px 10px', textAlign: 'right' }} />
                            <span style={{ fontSize: 13, color: ONSV, flexShrink: 0 }}>%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Totals block */}
              <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: `1px solid ${OV}` }}>
                {descontoAmt > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: SCLO }}>
                      <span style={{ fontSize: 13, color: ONSV }}>Subtotal</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: ONS }}>R$ {fmt(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: SCHN, borderTop: `0.5px solid rgba(199,80,0,.15)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c75000' }}>local_offer</span>
                        <span style={{ fontSize: 13, color: '#c75000', fontWeight: 600 }}>
                          Desconto{desconto.modo === 'global' && desconto.tipo === 'percent' && desconto.valor ? ` (${desconto.valor}%)` : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#c75000' }}>− R$ {fmt(descontoAmt)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px', background: P }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Total Estimado</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>R$ {fmt(grandTotal)}</span>
                </div>
              </div>

              {subtotal === 0 && (
                <div style={S.infoBox}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: P, flexShrink: 0 }}>info</span>
                  <p style={S.infoTxt}>Nenhum item adicionado. Volte e preencha as etapas anteriores.</p>
                </div>
              )}
            </div>
          </>
        );
      }

      default: return null;
    }
  };

  return (
    <div style={S.page}>
      {/* Top Bar */}
      <div style={S.topBar}>
        <button
          style={S.backBtn}
          onClick={() => navigate('/')}
          onMouseEnter={e => e.currentTarget.style.background = SCN}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <Logo style={{ height: 28 }} />
        <div style={{ flex: 1 }} />
        <span style={S.stepBadge}>Etapa {currentStep}/{STEPS.length}</span>
      </div>

      {/* Content */}
      <div style={S.content}>
        {renderStep()}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <div style={{ marginBottom: 10 }}>
          <div style={S.progLabel}>
            <span style={S.progStep}>{step.title}</span>
            <span style={S.progName}>{currentStep} de {STEPS.length}</span>
          </div>
          <div style={{ position: 'relative', height: 16, display: 'flex', alignItems: 'center', marginTop: 4 }}>
            {/* linha de fundo */}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: SCN, borderRadius: 99 }} />
            {/* linha preenchida */}
            <div style={{ position: 'absolute', left: 0, height: 2, background: P, borderRadius: 99, transition: 'width .4s ease', width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
            {/* círculos */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              {STEPS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  style={{
                    width: 10, height: 10, borderRadius: '50%', padding: 0, cursor: 'pointer', flexShrink: 0,
                    border: `2px solid ${s.id <= currentStep ? P : SCN}`,
                    background: s.id < currentStep ? P : s.id === currentStep ? P : 'transparent',
                    transition: 'background .2s, border-color .2s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={S.footerRow}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={S.totalLbl}>Total</span>
              <span style={S.totalVal}>R$ {fmt(grandTotal)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 1 && (
              <button style={S.btnSec} onClick={prev} disabled={isSaving}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                Voltar
              </button>
            )}
            {currentStep < 10 ? (
              <button
                style={{ ...S.btnPri, opacity: (canAdvance() || isView) ? 1 : 0.45 }}
                onClick={next}
                disabled={!canAdvance() && !isView}
              >
                {canAdvance() ? 'Próximo' : 'Pular'}
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            ) : (
              !isView && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {id && status === 'pending' && (
                    <>
                      <button 
                        style={{ ...S.btnPri, background: '#FCA5A5', color: '#991B1B' }} 
                        onClick={() => handleSave('rejected')} 
                        disabled={isSaving}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                        Reprovar
                      </button>
                      <button 
                        style={{ ...S.btnPri, background: '#86EFAC', color: '#166534' }} 
                        onClick={() => handleSave('approved')} 
                        disabled={isSaving}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
                        Aprovar
                      </button>
                    </>
                  )}
                  <button style={S.btnPri} onClick={() => handleSave()} disabled={isSaving}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isSaving ? 'progress_activity' : 'save'}</span>
                    {isSaving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {showCompanyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: SURF, padding: 24, borderRadius: 10, width: '90%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: ONS }}>Nova Empresa</h3>
            <Field label="Razão Social *">
              <FInput value={newCompanyData.nome} onChange={e => setNewCompanyData({...newCompanyData, nome: e.target.value})} placeholder="Razão social da empresa" />
            </Field>
            <Field label="CNPJ">
              <FInput value={newCompanyData.cnpj} onChange={e => setNewCompanyData({...newCompanyData, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Contato">
              <FInput value={newCompanyData.contato} onChange={e => setNewCompanyData({...newCompanyData, contato: e.target.value})} placeholder="Nome / Telefone" />
            </Field>
            <Field label="Responsável">
              <FInput value={newCompanyData.responsavel} onChange={e => setNewCompanyData({...newCompanyData, responsavel: e.target.value})} placeholder="Nome do responsável" />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button style={S.btnSec} onClick={() => setShowCompanyModal(false)}>Cancelar</button>
              <button style={S.btnPri} onClick={async () => {
                if (!newCompanyData.nome) return alert('Nome é obrigatório');
                const { data, error } = await supabase.from('companies').insert(newCompanyData).select().single();
                if (error) alert('Erro: ' + error.message);
                else {
                  setSelectedCompany(data);
                  setCompanySearch(data.nome);
                  setGeneralData({ ...generalData, empresaId: data.id, cliente: data.nome });
                  setAllCompanies(prev => [...prev, data]);
                  setShowCompanyModal(false);
                  setNewCompanyData({ nome: '', cnpj: '', contato: '', responsavel: '' });
                }
              }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBudget;
