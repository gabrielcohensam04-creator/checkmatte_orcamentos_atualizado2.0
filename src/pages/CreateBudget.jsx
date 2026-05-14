import { useState, useEffect, Fragment } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';
import Logo from '../components/Logo';

const STEPS = [
  { id: 1, title: 'Dados Gerais', icon: 'assignment', required: true },
  { id: 2, title: 'Logística', icon: 'calendar_month', required: true },
  { id: 3, title: 'Estrutura', icon: 'local_shipping', required: true },
  { id: 4, title: 'Câmeras', icon: 'videocam', required: false },
  { id: 5, title: 'Lentes', icon: 'photo_camera', required: false },
  { id: 6, title: 'Drones', icon: 'drone', required: false },
  { id: 7, title: 'Comunicação', icon: 'cell_tower', required: false },
  { id: 8, title: 'Movimento', icon: 'switch_video', required: false },
  { id: 9, title: 'Equipe', icon: 'groups', required: false },
  { id: 10, title: 'Resumo', icon: 'summarize', required: true },
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
const onBlurInput = e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none'; };

const FInput = ({ disabled, style: extra, ...props }) => (
  <input
    disabled={disabled}
    style={{ ...baseInput, ...(disabled ? { background: 'var(--surface-container)', opacity: 0.7 } : {}), textAlign: props.type === 'number' ? 'left' : undefined, ...extra }}
    onFocus={onFocusInput} onBlur={onBlurInput}
    {...props}
  />
);

const parseCurrency = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  return parseFloat(String(value).replace(/\./g, '').replace(',', '.')) || 0;
};

const formatCurrency = (value) => {
  const numbers = String(value).replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseInt(numbers, 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const FCurrencyInput = ({ value, onChange, disabled, style: extra, ...props }) => {
  const [displayValue, setDisplayValue] = useState(
    value ? formatCurrency(Number(value).toFixed(2)) : ''
  );

  useEffect(() => {
    const currentNum = parseCurrency(displayValue);
    if (value !== currentNum && !(value === 0 && displayValue === '')) {
      setDisplayValue(value ? formatCurrency(Number(value).toFixed(2)) : '');
    }
  }, [value, displayValue]);

  const handleChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    setDisplayValue(formatted);
    if (onChange) {
      onChange({ target: { value: parseCurrency(formatted) || '' } });
    }
  };

  return (
    <FInput
      type="text"
      disabled={disabled}
      style={{ textAlign: 'left', ...extra }}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
};

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
    page: { minHeight: '100dvh', background: BG, fontFamily: "'Inter', sans-serif" },
    topBar: { position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: HEAD, borderBottom: `1px solid ${OV}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 100 },
    backBtn: { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: P, borderRadius: '50%', transition: 'background .15s', flexShrink: 0 },
    topTitle: { flex: 1, fontSize: 16, fontWeight: 600, color: ONS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    stepBadge: { fontSize: 11, fontWeight: 600, color: SEC, background: SCN, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' },
    content: { paddingTop: 56, paddingBottom: 120 },
    inner: { padding: '20px 16px', maxWidth: 560, margin: '0 auto' },

    // Progress
    progWrap: { padding: '16px 16px 0' },
    progLabel: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progStep: { fontSize: 11, fontWeight: 600, color: SEC, textTransform: 'uppercase', letterSpacing: '0.05em' },
    progName: { fontSize: 11, fontWeight: 500, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.04em' },
    progTrack: { height: 4, background: SCN, borderRadius: 99, overflow: 'hidden' },
    progFill: { height: '100%', background: P, borderRadius: 99, transition: 'width .4s ease' },

    // Hero canvas
    hero: { margin: '16px 16px 0', borderRadius: 10, border: `1.5px dashed rgba(232,25,60,.3)`, background: SCLN, aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' },
    heroIconW: { width: 56, height: 56, borderRadius: '50%', background: SCN, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    heroTxt: { fontSize: 13, color: ONSV, textAlign: 'center', maxWidth: 200, lineHeight: 1.5, fontWeight: 400 },

    // Typography
    sectionTitle: { fontSize: 22, fontWeight: 600, color: ONS, letterSpacing: '-0.01em', lineHeight: '28px', marginBottom: 4 },
    sectionSub: { fontSize: 14, color: ONSV, marginBottom: 20, lineHeight: 1.5 },

    // Horizontal card (selection) — border lives on the wrapper div, not the card itself
    hCard: { background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background .15s', textAlign: 'left', width: '100%' },
    hCardSel: { background: SCHN },
    iconBox: { width: 48, height: 48, borderRadius: 10, background: SCN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hBody: { flex: 1, minWidth: 0 },
    hTitle: { fontSize: 14, fontWeight: 500, color: ONS, marginBottom: 2 },
    hDesc: { fontSize: 12, color: ONSV },
    hPrice: { fontSize: 14, fontWeight: 600, color: P, flexShrink: 0 },

    // Expanded input panel — sits inside the wrapper, separated by a subtle top border
    expandPanel: { padding: '12px 16px', background: SCHN, borderTop: `0.5px solid ${OV}` },

    // Grid card (lentes)
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    gCard: { background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'border-color .15s' },
    gCardSel: { border: `1.5px solid ${P}` },
    gImgPh: { width: '100%', aspectRatio: '4/3', background: SCHN, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    gBody: { padding: '10px 12px 14px' },

    // Info box
    infoBox: { background: SCLN, border: `0.5px solid rgba(165,54,13,.2)`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16 },
    infoTxt: { fontSize: 13, color: '#6b4a3e', lineHeight: 1.5 },

    // Summary rows
    sumRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, marginBottom: 6 },
    sumLbl: { fontSize: 14, color: ONSV },
    sumVal: { fontSize: 14, fontWeight: 600, color: ONS },

    // Footer
    footer: { 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      background: SURF, 
      borderTop: `1px solid rgba(224,192,182,.5)`, 
      padding: '12px 16px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      zIndex: 50, 
      boxShadow: '0 -4px 24px rgba(37,25,21,.06)' 
    },
    footerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', boxSizing: 'border-box', flexWrap: 'wrap' },
    totalLbl: { fontSize: 10, fontWeight: 600, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.06em' },
    totalVal: { fontSize: 16, fontWeight: 700, color: ONS, letterSpacing: '-0.01em', whiteSpace: 'nowrap' },
    btnPri: { height: 36, padding: '0 16px', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'opacity .15s', fontFamily: 'inherit' },
    btnSec: { height: 36, padding: '0 12px', background: SCN, color: ONS, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: 'inherit' },

    // Item card (cameras, drones, etc.)
    itemCard: { background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: 14, marginBottom: 10 },
    itemLabel: { fontSize: 11, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },

    btnSuc: { height: 48, padding: '0 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'opacity .15s', fontFamily: 'inherit' },
    btnErr: { height: 48, padding: '0 20px', background: '#ba1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'opacity .15s', fontFamily: 'inherit' },
  };


  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || (id ? 'edit' : 'create');
  const isView = mode === 'view';

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentStep]);
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
      allCompanies.filter(c => (c.nome || '').toLowerCase().includes(companySearch.toLowerCase()))
    );
  }, [companySearch, selectedCompany, allCompanies]);

  const [generalData, setGeneralData] = useState({ nomeProjeto: '', cliente: '', empresaId: '', descricao: '', imgUrl: '' });
  const [logistica, setLogistica] = useState({ diaViagem: '', diaMontagem: '', diaGravacao: '', diaVolta: '', cidade: '', localEvento: '', distanciaKm: '', valorKm: '' });
  const [estruturas, setEstruturas] = useState({
    rack: { checked: false, valor: 0 },
    delivery: { checked: false, valor: 0 },
    carreta: { checked: false, valor: 0 },
  });
  const [cameras, setCameras] = useState([
    { modelo: 'Blackmagic URSA G2', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'Sony PXW FX9', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'Sony PXW FX3', quantidade: 0, valorUnit: 0, img: null },
    { modelo: '', isOutra: true, quantidade: 0, valorUnit: 0, img: null, id: 'cam_outra_1' },
  ]);
  const [lentes, setLentes] = useState([
    { nome: 'Canon 50-1000mm', subTitle: 'Super teleobjetiva zoom', quantidade: 0, valorUnit: 0 },
    { nome: 'Canon 25-150mm', subTitle: 'Zoom cinema versátil', quantidade: 0, valorUnit: 0 },
    { nome: 'Canon 17-120mm', subTitle: 'Cine servo zoom', quantidade: 0, valorUnit: 0 },
    { nome: 'Sony 200-600mm', subTitle: 'Teleobjetiva zoom', quantidade: 0, valorUnit: 0 },
    { nome: 'Fujinon 20-120mm', subTitle: 'Cabrio zoom lens', quantidade: 0, valorUnit: 0 },
    { nome: 'Fujinon 19-90mm', subTitle: 'Compact cinema zoom', quantidade: 0, valorUnit: 0 },
    { nome: 'Sigma 14-24mm', subTitle: 'Grande angular zoom', quantidade: 0, valorUnit: 0 },
    { nome: 'Sony 16-35mm', subTitle: 'Grande angular GM', quantidade: 0, valorUnit: 0 },
    { nome: 'Sony 24-70mm', subTitle: 'Zoom padrão GM', quantidade: 0, valorUnit: 0 },
    { nome: 'Sony 18-110mm', subTitle: 'Cine zoom Super 35', quantidade: 0, valorUnit: 0 },
    { nome: 'Sony 28-135mm', subTitle: 'Full frame cine zoom', quantidade: 0, valorUnit: 0 },
    { nome: 'Angenieux 24-290mm', subTitle: 'Optimo zoom cinema', quantidade: 0, valorUnit: 0 },
    { nome: 'Outras', isOutra: true, subTitle: 'Modelo personalizado', quantidade: 0, valorUnit: 0, id: 'lente_outra_1' },
  ]);
  const [drones, setDrones] = useState([
    { modelo: 'DJI Inspire', subTitle: 'Cinema aéreo profissional', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'DJI FPV', subTitle: 'Voo imersivo FPV', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'Outros', isOutra: true, subTitle: 'Modelo personalizado', quantidade: 0, valorUnit: 0, img: null, id: 'drone_outra_1' },
  ]);
  const [comunicacao, setComunicacao] = useState([]);
  const [movEquip, setMovEquip] = useState([
    { modelo: 'Steady Cam', subTitle: 'Estabilização manual de ombro', quantidade: 0, valorUnit: 0, img: null },
    { modelo: 'DJI Ronin 4D', subTitle: 'Gimbal cinematográfico 4 eixos', quantidade: 0, valorUnit: 0, img: null },
  ]);
  const [gruas, setGruas] = useState([]);
  const [trilhos, setTrilhos] = useState([]);
  const [equipe, setEquipe] = useState([
    { funcao: 'Assistentes', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Técnicos de Sistemas', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Coordenadores', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Técnicos de Câmeras', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Operadores de Câmera', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Video Man', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Maquinistas', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { funcao: 'Motoristas', qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
    { id: Date.now(), funcao: '', isOutra: true, qtd: 0, valorPessoa: 0, diarias: '', nomes: [] },
  ]);
  const [verbaAlimentacao, setVerbaAlimentacao] = useState(0);
  const [diariasAlimentacao, setDiariasAlimentacao] = useState('');
  const [desconto, setDesconto] = useState({
    modo: 'global',    // 'global' | 'porItem'
    tipo: 'percent',   // 'percent' | 'valor'
    valor: '',
    itens: { estrutura: '', cameras: '', lentes: '', aereo: '', comunicacao: '', movimento: '', equipe: '' },
  });
  const [lensSearch, setLensSearch] = useState('');
  const [camSearch, setCamSearch] = useState('');
  const [droneSearch, setDroneSearch] = useState('');

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

      const termoBusca = (texto || '').toLowerCase().trim();
      
      const atalhos = {
        'ac': 'acre', 'al': 'alagoas', 'ap': 'amapa', 'am': 'amazonas',
        'ba': 'bahia', 'ce': 'ceara', 'df': 'distrito federal', 'es': 'espirito santo',
        'go': 'goias', 'ma': 'maranhao', 'mt': 'mato grosso', 'ms': 'mato grosso do sul',
        'mg': 'minas gerais', 'pa': 'para', 'pb': 'paraiba', 'pr': 'parana',
        'pe': 'pernambuco', 'pi': 'piaui', 'rj': 'rio de janeiro', 'rn': 'rio grande do norte',
        'rs': 'rio grande do sul', 'ro': 'rondonia', 'rr': 'roraima', 'sc': 'santa catarina',
        'sp': 'sao paulo', 'se': 'sergipe', 'to': 'tocantins'
      };

      const termoConvertido = atalhos[termoBusca] || termoBusca;

      const capitaisPrioritarias = [
        'sao paulo', 'rio de janeiro', 'belo horizonte', 'brasilia', 
        'curitiba', 'porto alegre', 'salvador', 'florianopolis', 'fortaleza',
        'recife', 'goiania', 'belem', 'manaus', 'vitoria', 'cuiaba', 'campo grande'
      ];

      const filtradas = (window.__cidadesCache || [])
        .filter(c => {
          if (!c) return false;
          const nomeNormalizado = normalizar(c?.nome || '');
          const ufSigla = c?.microrregiao?.mesorregiao?.UF?.sigla?.toLowerCase() || '';
          
          return (
            nomeNormalizado.includes(termoConvertido) || 
            nomeNormalizado.includes(termoBusca) ||
            ufSigla === termoBusca
          );
        })
        .sort((a, b) => {
          const nomeA = normalizar(a?.nome || '');
          const nomeB = normalizar(b?.nome || '');
          const aIsCapital = capitaisPrioritarias.some(cap => nomeA === cap);
          const bIsCapital = capitaisPrioritarias.some(cap => nomeB === cap);

          if (aIsCapital && !bIsCapital) return -1;
          if (!aIsCapital && bIsCapital) return 1;
          return nomeA.localeCompare(nomeB);
        })
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
        setLogistica({
          diaViagem: b.data_viagem || '',
          diaMontagem: b.data_montagem || '',
          diaGravacao: b.data_gravacao || '',
          diaVolta: b.data_volta || '',
          cidade: b.cidade || '',
          localEvento: b.local_evento || '',
          distanciaKm: b.frete ? '1' : '',
          valorKm: b.frete ? String(b.frete) : '',
        });
        if (b.tipo_estrutura?.length) {
          setEstruturas(prev => {
            const next = { ...prev };
            b.tipo_estrutura.forEach(e => { if (next[e.tipo]) next[e.tipo] = { checked: true, valor: e.valor }; });
            return next;
          });
        }
        const { data: eq } = await supabase.from('budget_equipment').select('*').eq('budget_id', id).maybeSingle();
        const savedCameras = b.cameras || eq?.cameras;
        if (savedCameras) {
          setCameras(prev => {
            const stdModels = ['Sony PXW FX9', 'Blackmagic URSA G2', 'Sony PXW FX3'];
            const customCam = savedCameras.find(x => !stdModels.includes(x.modelo));
            return prev.map(c => {
              if (c.isOutra && customCam) {
                return { ...c, modelo: customCam.modelo, quantidade: customCam.quantidade || 0, valorUnit: customCam.valorUnit || 0 };
              }
              const s = savedCameras.find(x => x.modelo === c.modelo);
              return s ? { ...c, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : c;
            });
          });
        }
        const savedLentes = b.lentes || eq?.lentes;
        if (savedLentes) {
          setLentes(prev => {
            const stdNames = ['Canon 50-1000mm', 'Canon 25-150mm', 'Canon 17-120mm', 'Sony 200-600mm', 'Fujinon 20-120mm', 'Fujinon 19-90mm', 'Sigma 14-24mm', 'Sony 16-35mm', 'Sony 24-70mm', 'Sony 18-110mm', 'Sony 28-135mm', 'Angenieux 24-290mm'];
            const customLente = savedLentes.find(x => !stdNames.includes(x.nome || x.modelo));
            return prev.map(l => {
              if (l.isOutra && customLente) {
                return { ...l, nome: customLente.nome || customLente.modelo, quantidade: customLente.quantidade || 0, valorUnit: customLente.valorUnit || 0 };
              }
              const s = savedLentes.find(x => (x.nome || x.modelo) === l.nome);
              return s ? { ...l, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : l;
            });
          });
        }
        const savedDrones = b.drones || eq?.aereo;
        if (savedDrones) {
          setDrones(prev => {
            const stdModels = ['DJI Inspire', 'DJI FPV'];
            const customDrone = savedDrones.find(x => !stdModels.includes(x.modelo));
            return prev.map(d => {
              if (d.isOutra && customDrone) {
                return { ...d, modelo: customDrone.modelo, quantidade: customDrone.quantidade || 0, valorUnit: customDrone.valorUnit || 0 };
              }
              const s = savedDrones.find(x => x.modelo === d.modelo);
              return s ? { ...d, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : d;
            });
          });
        }
        const savedComunicacao = b.comunicacao || eq?.comunicacao;
        if (savedComunicacao) {
          setComunicacao(savedComunicacao);
        }
        const savedMovimento = b.movimento || eq?.movimento;
        if (savedMovimento) {
          setMovEquip(prev => prev.map(m => {
            const s = savedMovimento.find(x => x.modelo === m.modelo);
            return s ? { ...m, quantidade: s.quantidade || 0, valorUnit: s.valorUnit || 0 } : m;
          }));
          const savedGruas = savedMovimento.filter(x => (x.modelo || '').startsWith('Grua') || (x.modelo || '').startsWith('Cammate'));
          if (savedGruas.length) setGruas(savedGruas.map(g => ({ metragem: g.metragem || '', quantidade: g.quantidade || 0, valorUnit: g.valorUnit || 0 })));
          const savedTrilhos = savedMovimento.filter(x => x.tipoCarrinho !== undefined);
          if (savedTrilhos.length) setTrilhos(savedTrilhos.map(t => ({ metragem: t.metragem || '', tipoCarrinho: t.tipoCarrinho || '', quantidade: t.quantidade || 0, valorUnit: t.valorUnit || 0 })));
        }
        const { data: tm } = await supabase.from('budget_team').select('*').eq('budget_id', id).maybeSingle();
        const savedEquipe = b.equipe || tm?.equipe;
        if (savedEquipe) {
          setEquipe(prev => {
            const stdRoles = ['Assistentes', 'Técnicos de Sistemas', 'Coordenadores', 'Técnicos de Câmeras', 'Operadores de Câmera', 'Video Man', 'Maquinistas', 'Motoristas'];
            const customTeam = savedEquipe.filter(x => {
              const roleName = (x.nome || x.funcao || '').trim();
              return roleName !== '' && roleName !== 'Outros' && roleName !== 'Outras' && !stdRoles.includes(roleName);
            });

            const next = prev.filter(p => !p.isOutra).map(e => {
              const s = savedEquipe.find(x => (x.nome || x.funcao) === e.funcao);
              return s ? { ...e, qtd: s.quantidade ?? s.qtd ?? 0, valorPessoa: s.valorUnitario ?? s.valorPessoa ?? 0, diarias: s.diarias ?? '', nomes: s.nomes || [] } : e;
            });

            if (customTeam.length) {
              customTeam.forEach(c => next.push({ ...c, funcao: c.nome || c.funcao, qtd: c.quantidade ?? c.qtd ?? 0, valorPessoa: c.valorUnitario ?? c.valorPessoa ?? 0, isOutra: true, id: c.id || Date.now() + Math.random() }));
            }
            next.push({ id: Date.now(), funcao: '', isOutra: true, qtd: 0, valorPessoa: 0, diarias: '', nomes: [] });
            return next;
          });
        }
        if (b.alimentacao) {
          setVerbaAlimentacao(b.alimentacao.valorPorPessoa || 0);
          setDiariasAlimentacao(b.alimentacao.diarias || '');
        } else if (tm) {
          setVerbaAlimentacao(tm.verba_alimentacao || 0);
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [id]);

  // ── Image preload (cache silencioso no mount) ──
  useEffect(() => {
    const imagensParaPreload = [
      // Banners das etapas
      '/IMAGEM_ETAPA02.jpeg', '/IMAGEM_ETAPA03.jpeg', '/IMAGEM_ETAPA04.jpeg',
      '/IMAGEM_ETAPA05.jpeg', '/IMAGEM_ETAPA06.jpeg', '/IMAGEM_ETAPA07.jpeg',
      '/IMAGEM_ETAPA08.jpeg', '/IMAGEM_ETAPA09.jpeg', '/IMAGEM_ETAPA10.jpeg',
      // Câmeras
      '/IMAGEM_BLACKMAGIC.jpeg', '/IMAGEM_FX9.jpeg', '/IMAGEM_FX3.jpeg',
      // Lentes
      '/IMAGEM_17-120.jpeg', '/IMAGEM_25-250.jpeg', '/IMAGEM_50-1000.jpeg',
      '/IMAGEM_200-600.jpeg', '/IMAGEM_20-120.jpeg', '/IMAGEM_19-90.jpeg',
      '/IMAGEM_14-24.jpeg', '/IMAGEM_16-35.jpeg', '/IMAGEM_24-70.jpeg',
      '/IMAGEM_18-110.jpeg', '/IMAGEM_28-135.jpeg', '/IMAGEM_24-290.jpeg',
      // Drones
      '/IMAGEM_INSPAIRE.jpeg', '/IMAGEM_DJIFPV.jpeg',
      // Estrutura / Logística
      '/IMAGEM_RACK.jpeg', '/IMAGEM_DELIVERY.jpeg', '/IMAGEM_CARRETA.jpeg',
      // Movimento
      '/IMAGEM_STEADYCAM.jpeg', '/IMAGEM_RONIN.jpeg',
      '/IMAGEM_CAMMATE750.jpeg', '/IMAGEM_CAMMATE10.jpeg', '/IMAGEM_CAMMATE14.jpeg',
    ];
    imagensParaPreload.forEach(src => {
      const img = new window.Image();
      img.src = src;
    });
  }, []); // Executa apenas 1× na montagem do componente

  // ── Totals ──
  const totalEstrutura = Object.values(estruturas).reduce((a, e) => a + (e.checked ? Number(e.valor) || 0 : 0), 0);
  const totalCameras = cameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0), 0);
  const totalLentes = lentes.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0), 0);
  const totalAereo = drones.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0), 0);
  const totalCom = comunicacao.reduce((a, c) => {
    if (c._fixo) return a + (Number(c.kits) || 0) * (Number(c.valor) || 0); // Solidcom M1
    return a + (Number(c.valor) || 0); // kits livres
  }, 0);
  const totalMovimento = movEquip.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0), 0)
    + gruas.reduce((a, g) => a + (Number(g.quantidade) || 0) * (Number(g.valorUnit) || 0), 0)
    + trilhos.reduce((a, t) => a + (Number(t.quantidade) || 0) * (Number(t.valorUnit) || 0), 0);
  const totalPessoasEquipe = equipe.reduce((a, e) => a + (Number(e.qtd) || 0), 0);
  const totalEquipe = equipe.reduce((a, e) => a + (Number(e.qtd) || 0) * (Number(e.valorPessoa) || 0) * (Number(e.diarias) || 0), 0)
    + (totalPessoasEquipe * (Number(verbaAlimentacao) || 0) * (Number(diariasAlimentacao) || 0));
  const totalFrete = (Number(logistica.distanciaKm) || 0) * (Number(logistica.valorKm) || 0);
  const subtotal = totalEstrutura + totalCameras + totalLentes + totalAereo + totalCom + totalMovimento + totalEquipe + totalFrete;
  const descontoAmt = desconto.modo === 'global'
    ? (desconto.tipo === 'percent' ? subtotal * (Number(desconto.valor) || 0) / 100 : Number(desconto.valor) || 0)
    : Object.entries(desconto.itens).reduce((a, [key, v]) => {
      const base = { frete: totalFrete, estrutura: totalEstrutura, cameras: totalCameras, lentes: totalLentes, aereo: totalAereo, comunicacao: totalCom, movimento: totalMovimento, equipe: totalEquipe }[key] || 0;
      return a + base * (Number(v) || 0) / 100;
    }, 0);
  const grandTotal = subtotal - descontoAmt;

  // ── Validation ──
  const canAdvance = () => true;

  const next = () => { if (currentStep < 10) setCurrentStep(s => s + 1); };
  const prev = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  const setLen = (arr, setArr, len, tpl) => setArr(Array.from({ length: len }, (_, i) => arr[i] || tpl(i)));
  const upd = (arr, setArr, i, field, val) => {
    if (!arr || i < 0 || i >= arr.length) return;
    const a = [...arr];
    a[i] = { ...a[i], [field]: val };
    setArr(a);
  };

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
        ...movEquip.filter(m => m.quantidade > 0),
        ...gruas.filter(g => g.quantidade > 0).map(g => ({ modelo: `Cammate ${g.metragem}`, metragem: g.metragem, quantidade: g.quantidade, valorUnit: g.valorUnit })),
        ...trilhos.filter(t => t.quantidade > 0).map(t => ({ modelo: `Trilho ${t.metragem}`, metragem: t.metragem, tipoCarrinho: t.tipoCarrinho, quantidade: t.quantidade, valorUnit: t.valorUnit })),
      ];

      const targetStatus = newStatus || status || 'pending';

      const budgetPayload = {
        nome_projeto: generalData.nomeProjeto,
        cliente: generalData.cliente,
        empresa_id: generalData.empresaId || null,
        descricao: generalData.descricao || null,
        tipo_estrutura: activeEstruturas,
        data_viagem: logistica.diaViagem || null,
        data_montagem: logistica.diaMontagem || null,
        data_gravacao: logistica.diaGravacao || null,
        data_volta: logistica.diaVolta || null,
        cidade: logistica.cidade || null,
        local_evento: logistica.localEvento || null,
        frete: totalFrete || 0,
        cameras: cameras, // Salvando Etapa 4 inteira na nova coluna JSONB
        lentes: lentes, // Salvando Etapa 5 inteira na nova coluna JSONB
        drones: drones, // Salvando Etapa 6 inteira na nova coluna JSONB
        comunicacao: comunicacao, // Salvando Etapa 7 inteira na nova coluna JSONB
        movimento: movimentoPayload, // Salvando Etapa 8 inteira na nova coluna JSONB
        equipe: equipe.filter(e => !e.isOutra || (e.funcao || '').trim() !== '').map(e => ({
          id: e.id || Date.now(),
          nome: e.funcao || '',
          quantidade: Number(e.qtd) || 0,
          diarias: e.diarias,
          valorUnitario: Number(e.valorPessoa) || 0,
          nomes: e.nomes || [],
          isOutra: e.isOutra || false
        })),
        alimentacao: {
          valorPorPessoa: Number(verbaAlimentacao) || 0,
          diarias: Number(diariasAlimentacao) || 0,
          total: totalPessoasEquipe * (Number(verbaAlimentacao) || 0) * (Number(diariasAlimentacao) || 0)
        },
        total: grandTotal || 0,
        status: targetStatus,
        ...(targetStatus === 'rejected' ? { data_reprovacao: new Date().toISOString() } : {})
      };

      console.log('📦 Payload de Envio:', budgetPayload);

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

  const step = STEPS[currentStep - 1];


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

  // ── Auto-append Outros helper ──
  const appendOutros = (list, setList, campo, itemId, valor) => {
    setList(prev => {
      const next = prev.map(item =>
        (item.id === itemId ? { ...item, [campo]: valor } : item)
      );
      // Se o item editado era o último isOutra e agora tem valor, adiciona novo vazio
      const outraItems = next.filter(x => x.isOutra);
      const lastOutra = outraItems[outraItems.length - 1];
      if (lastOutra && lastOutra.id === itemId && valor.trim() !== '') {
        const newItem = {
          ...lastOutra,
          id: `outra_${Date.now()}`,
          [campo]: '',
          quantidade: 0,
          valorUnit: 0,
          qtd: 0,
          valorPessoa: 0,
          diarias: ''
        };
        return [...next, newItem];
      }
      return next;
    });
  };

  // ── Remove Outros helper ──
  const removerOutros = (setList, campo, itemId) => {
    setList(prev => {
      const semItem = prev.filter(item => item.id !== itemId);
      // Garante que sempre sobra ao menos um card isOutra vazio
      const aindaTemOutra = semItem.some(x => x.isOutra);
      if (!aindaTemOutra) {
        const placeholder = {
          id: `outra_${Date.now()}`,
          isOutra: true,
          [campo]: '',
          quantidade: 0,
          valorUnit: 0,
          qtd: 0,
          valorPessoa: 0,
          diarias: ''
        };
        return [...semItem, placeholder];
      }
      return semItem;
    });
  };

  // ── Delete button style ──
  const deleteBtn = (onClick) => (
    <button
      onClick={onClick}
      disabled={isView}
      title="Remover item"
      style={{
        background: 'none',
        border: 'none',
        cursor: isView ? 'default' : 'pointer',
        padding: '4px 6px',
        borderRadius: 6,
        color: OL,
        display: 'flex',
        alignItems: 'center',
        opacity: isView ? 0.3 : 1,
        transition: 'color 0.15s, background 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = P; e.currentTarget.style.background = isDark ? '#2A1A1A' : '#FFF0F0'; }}
      onMouseLeave={e => { e.currentTarget.style.color = OL; e.currentTarget.style.background = 'none'; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
    </button>
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
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: SURF,
                    border: `1px solid ${OV}`,
                    borderRadius: 8,
                    marginTop: 4,
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    maxHeight: 300,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
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
                        <div style={{ padding: '10px 14px', fontSize: 13, color: ONSV, fontStyle: 'italic' }}>
                          Nenhuma empresa encontrada.
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: P,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        borderTop: `1px solid ${OV}`,
                        background: SURF,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                        position: 'sticky',
                        bottom: 0
                      }}
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
                        key={c?.id}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${OV}`, fontSize: 14, color: ONS }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setLogistica({ ...logistica, cidade: `${c?.nome || ''} - ${c?.microrregiao?.mesorregiao?.UF?.sigla || ''}` });
                          setIsCidadeDropdownOpen(false);
                        }}
                      >
                        {c?.nome} - {c?.microrregiao?.mesorregiao?.UF?.sigla}
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
                  <FCurrencyInput disabled={isView} placeholder="0,00" value={logistica.valorKm} onChange={e => setLogistica({ ...logistica, valorKm: e.target.value })} />
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
              { key: 'rack', label: 'Rack', desc: 'Solução logística compacta' },
              { key: 'delivery', label: 'Unidade Móvel Delivery', desc: 'Unidade profissional média' },
              { key: 'carreta', label: 'Unidade Móvel Carreta', desc: 'Estação de broadcast completa' },
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
                        <FCurrencyInput disabled={isView} placeholder="0,00" value={estruturas[key].valor || ''} onChange={e => setEstruturas({ ...estruturas, [key]: { ...estruturas[key], valor: parseFloat(e.target.value) || 0 } })} />
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

            <Field label="Pesquisar Câmera">
              <div style={{ position: 'relative' }}>
                <FInput
                  placeholder="Ex: Sony, Blackmagic, FX9..."
                  value={camSearch}
                  onChange={e => setCamSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: OV }}>search</span>
              </div>
            </Field>

            {(() => {
              const cameraImages = {
                'Blackmagic URSA G2': '/IMAGEM_BLACKMAGIC.jpeg',
                'Sony PXW FX9': '/IMAGEM_FX9.jpeg',
                'Sony PXW FX3': '/IMAGEM_FX3.jpeg',
              };
              const searchTerm = (camSearch || '').toLowerCase().trim();
              const camsSeguras = Array.isArray(cameras) ? cameras : [];

              const resultadosFiltrados = camsSeguras.filter(c =>
                c && !c.isOutra && (
                  (c.modelo && c.modelo.toLowerCase().includes(searchTerm))
                )
              );
              const outraCards = camsSeguras.filter(c => c?.isOutra);
              const highlight = searchTerm !== '' && resultadosFiltrados.length === 0;
              const listaFinal = searchTerm === '' ? camsSeguras : [...resultadosFiltrados, ...outraCards];

              return listaFinal.map((cam, i) => {
                const camIdx = camsSeguras.findIndex(x => x && (cam.isOutra ? x.id === cam.id : x.modelo === cam.modelo));
                return (
                  <Fragment key={cam.id || cam.modelo || i}>
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
                      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: isDark ? '#2A2A2A' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${(highlight && cam.isOutra) ? '#ba1a1a' : (cam.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0'))}` }}>
                        {cam.img || cameraImages[cam.modelo]
                          ? <img src={cam.img || cameraImages[cam.modelo]} alt={cam.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span className="material-symbols-outlined" style={{ fontSize: 22, color: cam.quantidade > 0 ? P : OL }}>videocam</span>
                        }
                      </div>
                      <div style={S.hBody}>
                        {cam.isOutra ? (
                          <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: highlight ? '#ba1a1a' : 'var(--secondary)', marginBottom: 2 }}>
                              {highlight ? 'Nenhum resultado encontrado. Use esta opção:' : 'Outros (digitar modelo)'}
                            </label>
                            <FInput
                              disabled={isView}
                              type="text"
                              placeholder="Digite o modelo da câmera..."
                              value={cam.modelo}
                              onChange={e => appendOutros(cameras, setCameras, 'modelo', cam.id || `cam_idx_${camIdx}`, e.target.value)}
                              style={{ padding: '6px 10px', fontSize: 13, borderColor: highlight ? '#ba1a1a' : OV }}
                            />
                          </div>
                        ) : (
                          <div style={S.hTitle}>{cam.modelo}</div>
                        )}
                        {cam.quantidade > 0 && cam.valorUnit > 0 && (
                          <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 2 }}>R$ {fmt(cam.quantidade * cam.valorUnit)}</div>
                        )}
                      </div>
                      <Stepper disabled={isView} value={cam.quantidade} onChange={n => upd(cameras, setCameras, camIdx, 'quantidade', n)} />
                      {cam.isOutra && deleteBtn(() => removerOutros(setCameras, 'modelo', cam.id || `cam_idx_${camIdx}`))}
                    </div>
                    {cam.quantidade > 0 && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={cam.valorUnit || ''} onChange={e => upd(cameras, setCameras, camIdx, 'valorUnit', parseFloat(e.target.value) || 0)} />
                        </Field>
                      </div>
                    )}
                  </Fragment>
                );
              });
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

            {(() => {
              const lensImages = {
                'Canon 17-120mm': '/IMAGEM_17-120.jpeg',
                'Canon 25-150mm': '/IMAGEM_25-250.jpeg',
                'Canon 50-1000mm': '/IMAGEM_50-1000.jpeg',
                'Sony 200-600mm': '/IMAGEM_200-600.jpeg',
                'Fujinon 20-120mm': '/IMAGEM_20-120.jpeg',
                'Fujinon 19-90mm': '/IMAGEM_19-90.jpeg',
                'Sigma 14-24mm': '/IMAGEM_14-24.jpeg',
                'Sony 16-35mm': '/IMAGEM_16-35.jpeg',
                'Sony 24-70mm': '/IMAGEM_24-70.jpeg',
                'Sony 18-110mm': '/IMAGEM_18-110.jpeg',
                'Sony 28-135mm': '/IMAGEM_28-135.jpeg',
                'Angenieux 24-290mm': '/IMAGEM_24-290.jpeg'
              };

              const lentesSeguras = Array.isArray(lentes) ? lentes : [];
              const searchTerm = (lensSearch || '').toLowerCase().trim();

              const resultadosFiltrados = lentesSeguras.filter(l =>
                l && !l.isOutra && (
                  (l.nome && l.nome.toLowerCase().includes(searchTerm)) ||
                  (l.subTitle && l.subTitle.toLowerCase().includes(searchTerm))
                )
              );

              // Todos os cards isOutra (lista infinita)
              const outraCards = lentesSeguras.filter(l => l?.isOutra);

              const listaFinal = resultadosFiltrados.length > 0
                ? [...resultadosFiltrados, ...outraCards]
                : outraCards;

              const highlight = searchTerm !== '' && resultadosFiltrados.length === 0;
              const errorColor = '#ba1a1a';

              return (
                <>
                  {(listaFinal || []).map((l) => {
                    if (!l || (!l.isOutra && !l.nome)) return null;

                    const origIdx = lentesSeguras.findIndex(x => x && ((l.isOutra && x.id === l.id) || x.nome === l.nome));
                    const srcImagem = (l && l.nome && lensImages?.[l.nome]) || null;

                    return (
                      <Fragment key={l.isOutra ? (l.id || `outra_${origIdx}`) : l.nome}>
                        {/* Card principal */}
                        <div style={{
                          backgroundColor: (highlight && l.isOutra) ? (isDark ? '#2D1F1F' : '#FFF5F5') : (isDark ? '#1A1A1A' : '#FFFFFF'),
                          border: `1px solid ${(highlight && l.isOutra) ? errorColor : (l.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0'))}`,
                          borderRadius: l.quantidade > 0 ? '10px 10px 0 0' : '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: l.quantidade > 0 ? 0 : '12px',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          boxShadow: l.quantidade > 0 ? `0 0 8px rgba(232, 25, 60, 0.15)` : 'none'
                        }}>
                          <div style={{
                            width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden',
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: l.quantidade > 0 ? `1px solid ${P}` : (isDark ? '1px solid #3A3A3A' : '1px solid #E0E0E0'),
                            background: isDark ? '#2A2A2A' : '#F5F5F5'
                          }}>
                            {srcImagem ? (
                              <img src={srcImagem} alt={l.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span className="material-symbols-outlined" style={{ fontSize: 24, color: l.quantidade > 0 ? P : OL }}>photo_camera</span>
                            )}
                          </div>
                          <div style={S.hBody}>
                            {l.isOutra ? (
                              <div style={{ marginBottom: 4 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: highlight ? errorColor : 'var(--secondary)', marginBottom: 2 }}>
                                  {highlight ? 'Nenhum resultado encontrado. Use esta opção:' : 'Outros (digitar modelo)'}
                                </label>
                                <FInput
                                  disabled={isView}
                                  type="text"
                                  placeholder="Digite o modelo da lente..."
                                  value={l.nome === 'Outras' ? '' : l.nome}
                                  onChange={e => appendOutros(lentesSeguras, setLentes, 'nome', l.id || `lente_idx_${origIdx}`, e.target.value)}
                                  style={{ padding: '6px 10px', fontSize: 13, borderColor: highlight ? errorColor : OV }}
                                />
                              </div>
                            ) : (
                              <>
                                <div style={S.hTitle}>{l.nome}</div>
                                <div style={S.hDesc}>{l.subTitle || ''}</div>
                              </>
                            )}
                            {l.quantidade > 0 && (l.valorUnit || 0) > 0 && (
                              <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(l.quantidade * l.valorUnit)}</div>
                            )}
                          </div>
                          <Stepper disabled={isView} value={l.quantidade || 0} onChange={n => {
                            const ng = [...lentesSeguras];
                            ng[origIdx] = { ...ng[origIdx], quantidade: n };
                            setLentes(ng);
                          }} />
                          {l.isOutra && deleteBtn(() => removerOutros(setLentes, 'nome', l.id || `lente_idx_${origIdx}`))}
                        </div>

                        {/* Expand panel — só aparece quando quantidade > 0 */}
                        {l.quantidade > 0 && (
                          <div style={{
                            ...S.expandPanel,
                            background: isDark ? '#2A2A2A' : '#F9F9F9',
                            borderRadius: '0 0 10px 10px',
                            border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`,
                            borderTop: 'none',
                            marginBottom: 12
                          }}>
                            <Field label="Valor unitário (R$)">
                              <FCurrencyInput
                                disabled={isView}
                                placeholder="0,00"
                                value={l.valorUnit || ''}
                                onChange={e => {
                                  const ng = [...lentesSeguras];
                                  ng[origIdx] = { ...ng[origIdx], valorUnit: parseFloat(e.target.value) || 0 };
                                  setLentes(ng);
                                }}
                              />
                            </Field>
                            {(l.valorUnit || 0) > 0 && (
                              <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                                {l.quantidade}× R$ {fmt(l.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(l.quantidade * l.valorUnit)}</strong>
                              </p>
                            )}
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </>
              );
            })()}

            <div style={S.infoBox}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: P, flexShrink: 0 }}>info</span>
              <p style={{ ...S.infoTxt, color: ONS }}>As lentes incluem filtros de proteção e cases rígidos para transporte.</p>
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

            <Field label="Pesquisar Drone">
              <div style={{ position: 'relative' }}>
                <FInput
                  placeholder="Ex: DJI, Inspire, FPV..."
                  value={droneSearch}
                  onChange={e => setDroneSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: OV }}>search</span>
              </div>
            </Field>

            {/* ETAPA 6 - DRONES */}
            {(() => {
              const droneImages = {
                'DJI Inspire': '/IMAGEM_INSPAIRE.jpeg',
                'DJI FPV': '/IMAGEM_DJIFPV.jpeg'
              };
              const searchTerm = (droneSearch || '').toLowerCase().trim();
              const dronesSeguras = Array.isArray(drones) ? drones : [];

              const resultadosFiltrados = dronesSeguras.filter(d =>
                d && !d.isOutra && (
                  (d.modelo && d.modelo.toLowerCase().includes(searchTerm)) ||
                  (d.subTitle && d.subTitle.toLowerCase().includes(searchTerm))
                )
              );
              const outraCards = dronesSeguras.filter(d => d?.isOutra);
              const highlight = searchTerm !== '' && resultadosFiltrados.length === 0;
              const listaFinal = searchTerm === '' ? dronesSeguras : [...resultadosFiltrados, ...outraCards];

              return listaFinal.map((d, i) => {
                const droneIdx = dronesSeguras.findIndex(x => x && (d.isOutra ? x.id === d.id : x.modelo === d.modelo));
                const isSelected = d.quantidade > 0;
                return (
                  <Fragment key={d.id || d.modelo + i}>
                    <div style={{
                      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                      border: `1px solid ${isSelected ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 8px rgba(232, 25, 60, 0.15)` : 'none'
                    }}>
                      {/* Quadrado da Imagem */}
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: isDark ? '#2A2A2A' : '#F5F5F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: isSelected ? `1px solid ${P}` : `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`
                      }}>
                        {d.img || droneImages[d.modelo]
                          ? <img
                            src={d.img || droneImages[d.modelo]}
                            alt={d.modelo}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          : <span className="material-symbols-outlined" style={{ fontSize: 24, color: OL }}>drone</span>
                        }
                      </div>

                      <div style={S.hBody}>
                        {d.isOutra ? (
                          <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: highlight ? '#ba1a1a' : 'var(--secondary)', marginBottom: 2 }}>
                              {highlight ? 'Nenhum resultado encontrado. Use esta opção:' : 'Outros Modelos'}
                            </label>
                            <FInput
                              disabled={isView}
                              type="text"
                              placeholder="Digite o modelo..."
                              value={d.modelo === 'Outros' ? '' : d.modelo}
                              onChange={e => appendOutros(drones, setDrones, 'modelo', d.id || `drone_idx_${droneIdx}`, e.target.value)}
                              style={{ padding: '6px 10px', fontSize: 13, borderColor: highlight ? '#ba1a1a' : OV }}
                            />
                          </div>
                        ) : (
                          <>
                            <div style={S.hTitle}>{d.modelo}</div>
                            <div style={{ ...S.hDesc, fontSize: 11 }}>{d.subTitle}</div>
                          </>
                        )}
                        {isSelected && d.valorUnit > 0 && (
                          <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(d.quantidade * d.valorUnit)}</div>
                        )}
                      </div>
                      <Stepper disabled={isView} value={d.quantidade} onChange={n => upd(drones, setDrones, droneIdx, 'quantidade', n)} />
                      {d.isOutra && deleteBtn(() => removerOutros(setDrones, 'modelo', d.id || `drone_idx_${droneIdx}`))}
                    </div>

                    {/* Configurações de Valor (expandido quando selecionado) */}
                    {isSelected && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={d.valorUnit || ''} onChange={e => upd(drones, setDrones, droneIdx, 'valorUnit', parseFloat(e.target.value) || 0)} />
                        </Field>
                      </div>
                    )}
                  </Fragment>
                );
              });
            })()}
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

            {/* Hollyland Solidcom M1 — card fixo */}
            {(() => {
              const solidcom = comunicacao.find(c => c._fixo === 'solidcom') || null;
              const solidcomQtd = solidcom ? solidcom.kits : 0;
              return (
                <div style={{
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${solidcomQtd > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: solidcomQtd > 0 ? `0 0 8px rgba(232, 25, 60, 0.15)` : 'none'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    border: `1px solid ${solidcomQtd > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`
                  }}>
                    <img
                      src="/IMAGEM_SOLIDCOMM1.jpeg"
                      alt="Hollyland Solidcom M1"
                      style={{
                        width: '120%',
                        height: '120%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  </div>
                  <div style={S.hBody}>
                    <div style={S.hTitle}>Hollyland Solidcom M1</div>
                    <div style={S.hDesc}>Intercomunicação sem fio — 8 beltpacks</div>
                    {solidcomQtd > 0 && solidcom?.valor > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 2 }}>R$ {fmt(solidcomQtd * (solidcom?.valor || 0))}</div>
                    )}
                  </div>
                  <Stepper disabled={isView} value={solidcomQtd} onChange={n => {
                    setComunicacao(prev => {
                      const idx = prev.findIndex(c => c._fixo === 'solidcom');
                      if (n === 0 && idx >= 0) return prev.filter((_, j) => j !== idx);
                      if (idx >= 0) { const nc = [...prev]; nc[idx] = { ...nc[idx], kits: n }; return nc; }
                      return [...prev, { _fixo: 'solidcom', modelo: 'Hollyland Solidcom M1', kits: n, valor: 0 }];
                    });
                  }} />
                </div>
              );
            })()}
            {/* Valor do Solidcom (expand) */}
            {(() => {
              const solidcom = comunicacao.find(c => c._fixo === 'solidcom');
              if (!solidcom || solidcom.kits === 0) return null;
              return (
                <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                  <Field label="Valor por Kit (R$)">
                    <FCurrencyInput disabled={isView} placeholder="0,00"
                      value={solidcom.valor || ''}
                      onChange={e => setComunicacao(prev => prev.map(c => c._fixo === 'solidcom' ? { ...c, valor: parseFloat(e.target.value) || 0 } : c))}
                    />
                  </Field>
                  {solidcom.valor > 0 && (
                    <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                      {solidcom.kits} kit{solidcom.kits > 1 ? 's' : ''} × R$ {fmt(solidcom.valor)} = <strong style={{ color: P }}>R$ {fmt(solidcom.kits * solidcom.valor)}</strong>
                    </p>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '12px 14px', background: SCLO, border: `0.5px solid rgba(224,192,182,.6)`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#1A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}>
                  <img
                    src="/IMAGEM_Kitsdecomunicaçãoadicionais.jpeg"
                    alt="Comunicação"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }}
                  />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: ONS }}>Kits de comunicação adicionais</span>
              </div>
              <Stepper disabled={isView} value={comunicacao.filter(c => !c._fixo).length} onChange={n => {
                const fixos = comunicacao.filter(c => c._fixo);
                const livres = comunicacao.filter(c => !c._fixo);
                setLen(livres, (newLivres) => setComunicacao([...fixos, ...newLivres]), n, () => ({ modelo: '', pontos: 1, valor: 0 }));
              }} />
            </div>
            {comunicacao.filter(c => !c._fixo).map((c, i) => (
              <div key={i} style={S.itemCard}>
                <p style={S.itemLabel}>Kit {i + 1}</p>
                <Field label="Modelo"><FInput disabled={isView} type="text" value={c.modelo} onChange={e => upd(comunicacao, setComunicacao, i, 'modelo', e.target.value)} /></Field>
                <Field label="Pontos (Rádios)"><FInput disabled={isView} type="number" value={c.pontos || ''} onChange={e => upd(comunicacao, setComunicacao, i, 'pontos', e.target.value)} /></Field>
                <Field label="Valor Total (R$)"><FCurrencyInput disabled={isView} placeholder="0,00" value={c.valor || ''} onChange={e => upd(comunicacao, setComunicacao, i, 'valor', e.target.value)} /></Field>
              </div>
            ))}
          </div>
        </>
      );

      // ── 8. Movimento ──
      case 8: {
        const movimentoImages = {
          'Steady Cam': '/IMAGEM_STEDYCAM.jpeg',
          'Cammate': '/imagem_cammate.jpeg',
          'Trilho': '/IMAGEM_TRILHO.jpeg',
          'DJI Ronin 4D': '/imagem_ronin.jpeg'
        };
        return (
          <>
            <div style={{ ...S.inner, paddingTop: 16 }}>
              <img
                src="/IMAGEM_ETAPA08.jpeg"
                alt="Movimento"
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

              {/* Steady Cam + Ronin + Cameleon */}
              {movEquip.map((m, i) => {
                const isSelected = m.quantidade > 0;
                return (
                  <Fragment key={m.modelo || i}>
                    <div style={{
                      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                      border: `1px solid ${isSelected ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 8px rgba(232, 25, 60, 0.15)` : 'none'
                    }}>
                      {/* Quadrado da Imagem */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#1A1A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        border: isSelected ? `1px solid ${P}` : `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`
                      }}>
                        {movimentoImages[m.modelo] ? (
                          <img
                            src={movimentoImages[m.modelo]}
                            alt={m.modelo}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }}
                          />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: 24, color: isSelected ? P : OL }}>switch_video</span>
                        )}
                      </div>

                      <div style={S.hBody}>
                        <div style={S.hTitle}>{m.modelo}</div>
                        <div style={S.hDesc}>{m.subTitle}</div>
                        {isSelected && m.valorUnit > 0 && (
                          <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(m.quantidade * m.valorUnit)}</div>
                        )}
                      </div>
                      <Stepper disabled={isView} value={m.quantidade} onChange={n => upd(movEquip, setMovEquip, i, 'quantidade', n)} />
                    </div>
                    {isSelected && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={m.valorUnit || ''} onChange={e => upd(movEquip, setMovEquip, i, 'valorUnit', parseFloat(e.target.value) || 0)} />
                        </Field>
                        {m.valorUnit > 0 && (
                          <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                            {m.quantidade}× R$ {fmt(m.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(m.quantidade * m.valorUnit)}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </Fragment>
                );
              })}

              {/* Cammate */}
              <div style={{ background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: gruas.length > 0 ? 14 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#1A1A1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`
                    }}>
                      <img
                        src={movimentoImages['Cammate']}
                        alt="Cammate"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }}
                      />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>Cammate</span>
                  </div>
                  <Stepper disabled={isView} value={gruas.length} onChange={n => setLen(gruas, setGruas, n, () => ({ metragem: '', quantidade: 1, valorUnit: 0 }))} />
                </div>
                {gruas.map((g, i) => (
                  <div key={i} style={{ borderTop: `0.5px solid ${OV}`, paddingTop: 12, marginTop: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Cammate {i + 1}</p>
                    <Field label="Metragem">
                      <FSelect disabled={isView} value={g.metragem} onChange={e => { const ng = [...gruas]; ng[i] = { ...ng[i], metragem: e.target.value }; setGruas(ng); }}>
                        <option value="">Selecione…</option>
                        <option value="7,50m">7,50 metros</option>
                        <option value="10m">10 metros</option>
                        <option value="14m">14 metros</option>
                      </FSelect>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label="Quantidade">
                        <FInput disabled={isView} type="number" placeholder="1" value={g.quantidade || ''} onChange={e => { const ng = [...gruas]; ng[i] = { ...ng[i], quantidade: parseInt(e.target.value) || 0 }; setGruas(ng); }} />
                      </Field>
                      <Field label="Valor (R$)">
                        <FCurrencyInput disabled={isView} placeholder="0,00" value={g.valorUnit || ''} onChange={e => { const ng = [...gruas]; ng[i] = { ...ng[i], valorUnit: parseFloat(e.target.value) || 0 }; setGruas(ng); }} />
                      </Field>
                    </div>
                    {g.quantidade > 0 && g.valorUnit > 0 && (
                      <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                        {g.quantidade}× R$ {fmt(g.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(g.quantidade * g.valorUnit)}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Trilhos */}
              <div style={{ background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: trilhos.length > 0 ? 14 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#1A1A1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`
                    }}>
                      <img
                        src={movimentoImages['Trilho']}
                        alt="Trilhos"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }}
                      />
                    </div>
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
                        <option value="Cameleon Dolly">Cameleon Dolly</option>
                        <option value="Outro">Outro</option>
                      </FSelect>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label="Quantidade">
                        <FInput disabled={isView} type="number" placeholder="1" value={t.quantidade || ''} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], quantidade: parseInt(e.target.value) || 0 }; setTrilhos(nt); }} />
                      </Field>
                      <Field label="Valor (R$)">
                        <FCurrencyInput disabled={isView} placeholder="0,00" value={t.valorUnit || ''} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], valorUnit: parseFloat(e.target.value) || 0 }; setTrilhos(nt); }} />
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
      }

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

            {equipe.map((m, i) => {
              const total = (m.qtd || 0) * (m.valorPessoa || 0);
              return (
                <div key={i} style={{
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${m.qtd > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  transition: 'all 0.2s ease',
                  boxShadow: m.qtd > 0 ? `0 0 8px rgba(232, 25, 60, 0.1)` : 'none'
                }}>
                  {/* Header do card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: isDark ? '#2A2A2A' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${m.qtd > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: m.qtd > 0 ? P : OL }}>{m.isOutra ? 'person_add' : 'person'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      {m.isOutra ? (
                        <FInput
                          disabled={isView}
                          type="text"
                          placeholder="Outro membro da equipe..."
                          value={m.funcao || ''}
                          onChange={e => appendOutros(equipe, setEquipe, 'funcao', m.id || `eq_idx_${i}`, e.target.value)}
                        />
                      ) : (
                        <div style={S.hTitle}>{m.funcao}</div>
                      )}
                      {total > 0 && <div style={{ fontSize: 12, color: P, fontWeight: 700, marginTop: 2 }}>R$ {fmt(total)}</div>}
                    </div>
                    {m.isOutra && i !== equipe.length - 1 && !isView && (
                      <button onClick={() => removerOutros(setEquipe, 'funcao', m.id)} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>

                  {/* Campos Qtd + Diárias + Valor Individual */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: total > 0 ? 10 : 0 }}>
                    <Field label="Qtd. de Pessoas">
                      <FInput
                        disabled={isView}
                        type="number"
                        placeholder="0"
                        value={m.qtd || ''}
                        onChange={e => {
                          const ne = [...equipe];
                          const n = parseInt(e.target.value) || 0;
                          ne[i].qtd = n;
                          ne[i].nomes = Array.from({ length: n }, (_, x) => ne[i].nomes[x] || '');
                          setEquipe(ne);
                        }}
                      />
                    </Field>
                    <Field label="Nº de Diárias">
                      <FInput
                        disabled={isView}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={m.diarias}
                        onChange={e => {
                          const ne = [...equipe];
                          ne[i].diarias = e.target.value;
                          setEquipe(ne);
                        }}
                      />
                    </Field>
                    <Field label="Valor / Diária (R$)">
                      <FCurrencyInput
                        disabled={isView}
                        placeholder="0,00"
                        value={m.valorPessoa || ''}
                        onChange={e => {
                          const ne = [...equipe];
                          ne[i].valorPessoa = parseFloat(e.target.value) || 0;
                          setEquipe(ne);
                        }}
                      />
                    </Field>
                  </div>

                  {/* Total automático */}
                  {(() => {
                    const d = Number(m.diarias) || 0;
                    const cardTotal = (Number(m.qtd) || 0) * (Number(m.valorPessoa) || 0) * d;
                    return cardTotal > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isDark ? '#2A2A2A' : '#FFF5F5', borderRadius: 8, marginBottom: m.qtd > 0 ? 10 : 0, border: `1px solid ${isDark ? '#3A3A3A' : '#FFE0E0'}` }}>
                        <span style={{ fontSize: 12, color: ONSV }}>{m.qtd} × {d} diária{d !== 1 ? 's' : ''} × R$ {fmt(m.valorPessoa)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: P }}>R$ {fmt(cardTotal)}</span>
                      </div>
                    ) : null;
                  })()}

                  {/* Nomes (opcionais) */}
                  {m.qtd > 0 && (
                    <div style={{ borderTop: `0.5px solid ${OV}`, paddingTop: 10 }}>
                      {m.nomes.map((nome, ni) => (
                        <FInput key={ni} disabled={isView} style={{ marginBottom: 6, fontSize: 13 }} type="text" placeholder={`Nome ${ni + 1} (opcional)`} value={nome} onChange={e => { const ne = [...equipe]; ne[i].nomes[ni] = e.target.value; setEquipe(ne); }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Resumo de pessoas */}
            {(() => {
              const totalPessoas = equipe.reduce((acc, m) => acc + (m.qtd || 0), 0);
              if (totalPessoas === 0) return null;
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: isDark ? '#2A2A2A' : '#F5F5F5', borderRadius: 10, marginBottom: 10, border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: P }}>groups</span>
                    <span style={{ fontSize: 13, color: ONS, fontWeight: 600 }}>Total de Pessoas</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: P }}>{totalPessoas}</span>
                </div>
              );
            })()}

            {/* Seção de Alimentação */}
            <div style={{ ...S.itemCard, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: P }}>restaurant</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: ONS }}>Alimentação</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
                <Field label="Total de Pessoas">
                  <FInput disabled type="number" value={totalPessoasEquipe} style={{ background: isDark ? '#2A2A2A' : '#F5F5F5', color: OL, cursor: 'not-allowed' }} />
                </Field>
                <Field label="Valor por Pessoa (R$)">
                  <FCurrencyInput
                    disabled={isView}
                    placeholder="0,00"
                    value={verbaAlimentacao || ''}
                    onChange={e => setVerbaAlimentacao(parseFloat(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Nº de Diárias">
                  <FInput
                    disabled={isView}
                    type="number"
                    placeholder="0"
                    value={diariasAlimentacao}
                    onChange={e => setDiariasAlimentacao(e.target.value)}
                  />
                </Field>
                <Field label="Total Alimentação">
                  <div style={{ height: 40, display: 'flex', alignItems: 'center', paddingLeft: 12, fontWeight: 700, fontSize: 16, color: P }}>
                    R$ {fmt(totalPessoasEquipe * (Number(verbaAlimentacao) || 0) * (Number(diariasAlimentacao) || 0))}
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </>
      );

      // ── 10. Resumo ──
      case 10: {
        const catRows = [
          { key: 'frete', label: 'Frete', icon: 'local_shipping', value: totalFrete },
          { key: 'estrutura', label: 'Estrutura', icon: 'warehouse', value: totalEstrutura },
          { key: 'cameras', label: 'Câmeras', icon: 'videocam', value: totalCameras },
          { key: 'lentes', label: 'Lentes', icon: 'photo_camera', value: totalLentes },
          { key: 'aereo', label: 'Drones', icon: 'drone', value: totalAereo },
          { key: 'comunicacao', label: 'Comunicação', icon: 'cell_tower', value: totalCom },
          { key: 'movimento', label: 'Movimento', icon: 'switch_video', value: totalMovimento },
          { key: 'equipe', label: 'Equipe', icon: 'groups', value: totalEquipe },
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
                    {segBtn('Global', desconto.modo === 'global', () => setDesconto(d => ({ ...d, modo: 'global' })))}
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
                      {desconto.tipo === 'percent' ? (
                        <FInput type="number" placeholder="0" value={desconto.valor} onChange={e => setDesconto(d => ({ ...d, valor: e.target.value }))} />
                      ) : (
                        <FCurrencyInput placeholder="0,00" value={desconto.valor} onChange={e => setDesconto(d => ({ ...d, valor: e.target.value }))} />
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catRows.map(r => (
                        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ flex: 1, fontSize: 13, color: ONSV }}>{r.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 120 }}>
                            <FCurrencyInput placeholder="0,00" value={desconto.itens[r.key] || ''} onChange={e => setDesconto(d => ({ ...d, itens: { ...d.itens, [r.key]: e.target.value } }))} style={{ padding: '8px 10px' }} />
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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {currentStep > 1 && (
              <button style={S.btnSec} onClick={prev} disabled={isSaving}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                Voltar
              </button>
            )}
            {currentStep < 10 ? (
              <>
                {!isView && (
                  <button
                    style={{
                      ...S.btnSec,
                      borderColor: isDark ? '#3A3A3A' : '#D0D0D0',
                      color: isDark ? '#CCCCCC' : '#555555',
                      gap: 6,
                    }}
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    title="Salvar progresso atual sem avançar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                      {isSaving ? 'progress_activity' : 'cloud_upload'}
                    </span>
                    {isSaving ? 'Salvando…' : 'Salvar Progresso'}
                  </button>
                )}
                <button
                  style={{ ...S.btnPri, opacity: (canAdvance() || isView) ? 1 : 0.45 }}
                  onClick={next}
                  disabled={!canAdvance() && !isView}
                >
                  {canAdvance() ? 'Próximo' : 'Pular'}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              </>
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
              <FInput value={newCompanyData.nome} onChange={e => setNewCompanyData({ ...newCompanyData, nome: e.target.value })} placeholder="Razão social da empresa" />
            </Field>
            <Field label="CNPJ">
              <FInput value={newCompanyData.cnpj} onChange={e => setNewCompanyData({ ...newCompanyData, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Contato">
              <FInput value={newCompanyData.contato} onChange={e => setNewCompanyData({ ...newCompanyData, contato: e.target.value })} placeholder="Nome / Telefone" />
            </Field>
            <Field label="Responsável">
              <FInput value={newCompanyData.responsavel} onChange={e => setNewCompanyData({ ...newCompanyData, responsavel: e.target.value })} placeholder="Nome do responsável" />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button style={S.btnSec} onClick={() => setShowCompanyModal(false)}>Cancelar</button>
              <button style={S.btnPri} onClick={async () => {
                if (!newCompanyData.nome) return alert('Razão Social é obrigatória');
                const payload = {
                  nome: newCompanyData.nome,
                  cnpj: newCompanyData.cnpj || null,
                  contato: newCompanyData.contato || null,
                  responsavel: newCompanyData.responsavel || null
                };
                const { data, error } = await supabase.from('companies').insert(payload).select();
                if (error) {
                  console.error('Erro detalhado:', error);
                  alert(`Erro ao salvar: ${error.message} (Código: ${error.code})`);
                } else if (data && data.length > 0) {
                  const newCompany = data[0];
                  setSelectedCompany(newCompany);
                  setCompanySearch(newCompany.nome);
                  setGeneralData({ ...generalData, empresaId: newCompany.id, cliente: newCompany.nome });
                  setAllCompanies(prev => [...prev, newCompany]);
                  setShowCompanyModal(false);
                  setNewCompanyData({ nome: '', cnpj: '', contato: '', responsavel: '' });
                } else {
                  alert('Empresa salva, mas não foi possível retornar os dados. Recarregue a página.');
                  setShowCompanyModal(false);
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
