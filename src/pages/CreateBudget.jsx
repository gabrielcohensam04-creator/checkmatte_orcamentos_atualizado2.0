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

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Stable sub-components (defined outside to prevent focus loss on re-render) ──

const Stepper = ({ value, onChange, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-container-low)', padding: 4, borderRadius: 10 }}>
    <button
      style={{ width: 32, height: 32, border: '0.5px solid var(--outline-variant)', borderRadius: 4, fontSize: 18, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', opacity: (disabled || value <= 0) ? 0.4 : 1, transition: 'background .15s' }}
      disabled={disabled || value <= 0}
      onClick={() => onChange(Math.max(0, value - 1))}
    >−</button>
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, '');
        onChange(val === '' ? 0 : parseInt(val, 10));
      }}
      style={{ width: 36, height: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', background: 'transparent', border: 'none', outline: 'none' }}
    />
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
const onFocusInput = e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,25,60,.08)'; };
const onBlurInput = e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none'; };

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

const FCurrencyInput = ({ value, onChange, disabled, style: extra, ...props }) => {
  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const floatValue = parseInt(rawValue, 10) / 100;
    onChange(isNaN(floatValue) ? 0 : floatValue);
  };
  const displayValue = value ? (value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
  return (
    <FInput
      disabled={disabled}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      style={extra}
      {...props}
    />
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const CreateBudget = () => {
  const { isDark } = useTheme();
  const { P, SEC, BG, SURF, HEAD, SCLO, SCLN, SCN, SCHN, ONS, ONSV, OL, OV, ERR, SUC } = isDark ? dark : light;

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
    infoBox: { background: SCLN, border: `0.5px solid rgba(232,25,60,.2)`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16 },
    infoTxt: { fontSize: 13, color: ONSV, lineHeight: 1.5 },

    // Summary rows
    sumRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, marginBottom: 6 },
    sumLbl: { fontSize: 14, color: ONSV },
    sumVal: { fontSize: 14, fontWeight: 600, color: ONS },

    // Footer
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: SURF, borderTop: `1px solid ${OV}`, padding: '10px 16px', zIndex: 50, boxShadow: isDark ? '0 -4px 24px rgba(0,0,0,0.4)' : '0 -4px 24px rgba(10,10,10,0.06)' },
    footerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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
  const [logistica, setLogistica] = useState({ diaViagem: '', diaMontagem: '', diaGravacao: '', diaVolta: '', cidade: '', localEvento: '', distanciaKm: '', valorKm: '' });
  const [estruturas, setEstruturas] = useState({
    rack: { checked: false, valor: 0 },
    delivery: { checked: false, valor: 0 },
    carreta: { checked: false, valor: 0 },
  });
  const [cameras, setCameras] = useState([
    { modelo: 'Blackmagic URSA G2', quantidade: 0, valorUnit: 0, diarias: 1, img: null },
    { modelo: 'Sony PXW FX9', quantidade: 0, valorUnit: 0, diarias: 1, img: null },
    { modelo: 'Sony PXW FX3', quantidade: 0, valorUnit: 0, diarias: 1, img: null },
  ]);
  const [customCameras, setCustomCameras] = useState([{ modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
  const [lentes, setLentes] = useState([
    { modelo: 'Canon 50-1000mm', subTitle: 'Super teleobjetiva zoom', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Canon 25-250mm', subTitle: 'Zoom cinema versátil', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Canon 17-120mm', subTitle: 'Cine servo zoom', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Sony 200-600mm', subTitle: 'Teleobjetiva zoom', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Fujinon 20-120mm', subTitle: 'Cabrio zoom lens', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Fujinon 19-90mm', subTitle: 'Compact cinema zoom', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Sigma 14-24mm', subTitle: 'Grande angular zoom', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Sony 16-35mm', subTitle: 'Grande angular GM', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Sony 24-70mm', subTitle: 'Zoom padrão GM', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Sony 18-110mm', subTitle: 'Cine zoom Super 35', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Sony 28-135mm', subTitle: 'Full frame cine zoom', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'Angenieux 24-290mm', subTitle: 'Optimo zoom cinema', quantidade: 0, valorUnit: 0, diarias: 1 },
  ]);
  const [customLenses, setCustomLenses] = useState([{ modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
  const [drones, setDrones] = useState([
    { modelo: 'DJI FPV', subTitle: 'Voo imersivo FPV', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'DJI Inspire', subTitle: 'Cinematografia aérea avançada', quantidade: 0, valorUnit: 0, diarias: 1 },
  ]);
  const [customDrones, setCustomDrones] = useState([{ modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
  const [comunicacao, setComunicacao] = useState([
    { modelo: 'Hollyland Solidcom M1', subTitle: 'Sistema de intercom sem fio', quantidade: 0, pontos: 8, valorUnit: 0, diarias: 1 },
  ]);
  const [customComunicacao, setCustomComunicacao] = useState([{ modelo: '', quantidade: 0, pontos: 0, valorUnit: 0, diarias: 1 }]);
  const [movEquip, setMovEquip] = useState([
    { modelo: 'Steady Cam', subTitle: 'Estabilização manual de ombro', quantidade: 0, valorUnit: 0, diarias: 1 },
    { modelo: 'DJI Ronin 4D', subTitle: 'Gimbal cinematográfico 4 eixos', quantidade: 0, valorUnit: 0, diarias: 1 },
  ]);
  const [customMovEquip, setCustomMovEquip] = useState([{ modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
  const [gruas, setGruas] = useState([]);
  const [trilhos, setTrilhos] = useState([]);
  const [equipe, setEquipe] = useState([
    { funcao: 'Operadores de Câmera', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Assistentes', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Técnicos de Câmeras', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Diretor de Imagens', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Video Man', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Coordenadores', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Técnicos de Sistemas', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Maquinistas', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Motorista - Carros', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
    { funcao: 'Motorista - Caminhão', qtd: 0, valorPessoa: 0, qtdDiarias: 1, nomes: [] },
  ]);
  const [verbaAlimentacao, setVerbaAlimentacao] = useState(0);
  const [verbaMotorista, setVerbaMotorista] = useState(0);
  const [imposto, setImposto] = useState(''); // percentual do imposto
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
    const texto = logistica?.cidade || '';
    if (!isCidadeDropdownOpen || texto.length < 2) {
      setCidadeSugestoes([]);
      return;
    }

    const normalizar = (str) => {
      if (!str) return '';
      return String(str).normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    };

    const buscarCidades = async () => {
      try {
        if (!window.__cidadesCache) {
          const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
          if (!res.ok) throw new Error('Erro ao acessar API IBGE');
          window.__cidadesCache = await res.json();
        }

        const cache = window.__cidadesCache || [];
        const filtradas = cache
          .filter(c => normalizar(c?.nome).includes(normalizar(texto)))
          .slice(0, 10);

        setCidadeSugestoes(filtradas);
      } catch (err) {
        console.error('Erro na busca de cidades:', err);
        setCidadeSugestoes([]);
      }
    };

    const t = setTimeout(buscarCidades, 300);
    return () => clearTimeout(t);
  }, [logistica?.cidade, isCidadeDropdownOpen]);

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
        } else if (b.cliente) {
          setCompanySearch(b.cliente);
        }

        setLogistica({
          diaViagem: b.data_viagem || '',
          diaMontagem: b.data_montagem || '',
          diaGravacao: b.data_gravacao || '',
          diaVolta: b.data_volta || '',
          cidade: b.cidade || '',
          localEvento: b.local_evento || '',
          distanciaKm: b.distancia_km || '',
          valorKm: b.valor_km || ''
        });
        // Carrega imposto se existir
        if (b.imposto_percentual) setImposto(String(b.imposto_percentual));

        if (b.tipo_estrutura?.length) {
          setEstruturas(prev => {
            const next = { ...prev };
            b.tipo_estrutura.forEach(e => { if (next[e.tipo]) next[e.tipo] = { checked: true, valor: e.valor }; });
            return next;
          });
        }

        // Load Cameras
        const { data: camData } = await supabase.from('budget_cameras').select('*').eq('budget_id', id);
        if (camData?.length > 0) {
          const stdModels = ['Sony PXW FX9', 'Blackmagic URSA G2', 'Sony PXW FX3'];
          setCameras(prev => prev.map(c => {
            const s = camData.find(x => x.modelo === c.modelo);
            return s ? { ...c, quantidade: s.quantidade || 0, valorUnit: Number(s.valor_unit) || 0, diarias: s.diarias || 1 } : c;
          }));
          const customs = camData.filter(x => !stdModels.includes(x.modelo));
          if (customs.length) setCustomCameras([...customs.map(c => ({ modelo: c.modelo || '', quantidade: c.quantidade || 0, valorUnit: Number(c.valor_unit) || 0, diarias: c.diarias || 1 })), { modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
        }

        // Load Lenses
        const { data: lenData } = await supabase.from('budget_lenses').select('*').eq('budget_id', id);
        if (lenData?.length > 0) {
          const stdModels = ['Canon 50-1000mm', 'Canon 25-250mm', 'Canon 17-120mm', 'Sony 200-600mm', 'Fujinon 20-120mm', 'Fujinon 19-90mm', 'Sigma 14-24mm', 'Sony 16-35mm', 'Sony 24-70mm', 'Sony 18-110mm', 'Sony 28-135mm', 'Angenieux 24-290mm'];
          setLentes(prev => prev.map(l => {
            const s = lenData.find(x => x.modelo === l.modelo);
            return s ? { ...l, quantidade: s.quantidade || 0, valorUnit: Number(s.valor_unit) || 0, diarias: s.diarias || 1 } : l;
          }));
          const customs = lenData.filter(x => !stdModels.includes(x.modelo));
          if (customs.length) setCustomLenses([...customs.map(l => ({ modelo: l.modelo || '', quantidade: l.quantidade || 0, valorUnit: Number(l.valor_unit) || 0, diarias: l.diarias || 1 })), { modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
        }

        // Load Drones
        const { data: droneData } = await supabase.from('budget_drones').select('*').eq('budget_id', id);
        if (droneData?.length > 0) {
          const stdModels = ['DJI FPV', 'DJI Inspire'];
          setDrones(prev => prev.map(d => {
            const s = droneData.find(x => x.modelo === d.modelo);
            return s ? { ...d, quantidade: s.quantidade || 0, valorUnit: Number(s.valor_unit) || 0, diarias: s.diarias || 1 } : d;
          }));
          const customs = droneData.filter(x => !stdModels.includes(x.modelo));
          if (customs.length) setCustomDrones([...customs.map(d => ({ modelo: d.modelo || '', quantidade: d.quantidade || 0, valorUnit: Number(d.valor_unit) || 0, diarias: d.diarias || 1 })), { modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);
        }

        // Load Comm
        const { data: commData } = await supabase.from('budget_communication').select('*').eq('budget_id', id);
        if (commData?.length > 0) {
          const stdModels = ['Hollyland Solidcom M1'];
          setComunicacao(prev => prev.map(c => {
            const s = commData.find(x => x.modelo === c.modelo);
            return s ? { ...c, quantidade: s.quantidade || 0, pontos: 8, valorUnit: Number(s.valor_unit) || 0, diarias: s.diarias || 1 } : c; // simplified pontos logic for standard model
          }));
          const customs = commData.filter(x => !stdModels.includes(x.modelo));
          if (customs.length) setCustomComunicacao([...customs.map(c => ({ modelo: c.modelo || '', quantidade: c.quantidade || 0, pontos: 0, valorUnit: Number(c.valor_unit) || 0, diarias: c.diarias || 1 })), { modelo: '', quantidade: 0, pontos: 0, valorUnit: 0, diarias: 1 }]);
        }

        // Load Movimento (Steady/Ronin, Gruas, Trilhos)
        const { data: movData } = await supabase.from('budget_movement').select('*').eq('budget_id', id);
        if (movData?.length > 0) {
          const stdModels = ['Steady Cam', 'DJI Ronin 4D'];
          setMovEquip(prev => prev.map(m => {
            const s = movData.find(x => x.modelo === m.modelo);
            return s ? { ...m, quantidade: s.quantidade || 0, valorUnit: Number(s.valor_unit) || 0, diarias: s.diarias || 1 } : m;
          }));

          const customMov = movData.filter(x => x.tipo === 'Outros' && !stdModels.includes(x.modelo));
          if (customMov.length) setCustomMovEquip([...customMov.map(m => ({ modelo: m.modelo || '', quantidade: m.quantidade || 0, valorUnit: Number(m.valor_unit) || 0, diarias: m.diarias || 1 })), { modelo: '', quantidade: 0, valorUnit: 0, diarias: 1 }]);

          const savedGruas = movData.filter(x => x.tipo === 'Grua');
          if (savedGruas.length) setGruas(savedGruas.map(g => ({ metragem: g.metragem || '', quantidade: g.quantidade || 0, valorUnit: Number(g.valor_unit) || 0, diarias: g.diarias || 1 })));

          const savedTrilhos = movData.filter(x => x.tipo === 'Trilho');
          const stdMetragens = ['1m', '2m', '3m', '6m', '9m', '12m', '15m', '18m', '21m', '24m'];
          const stdCarrinhos = ['Doorway Dolly', 'Dolly Standard', 'Super Panther', 'Fisher 10'];
          if (savedTrilhos.length) setTrilhos(savedTrilhos.map(t => {
            const metragemPadrao = stdMetragens.includes(t.metragem);
            const carrinhoPadrao = stdCarrinhos.includes(t.tipo_carrinho);
            return {
              metragem: metragemPadrao ? (t.metragem || '') : 'Personalizado',
              metragemCustom: metragemPadrao ? '' : (t.metragem || ''),
              tipoCarrinho: carrinhoPadrao ? (t.tipo_carrinho || '') : 'Outro',
              customCarrinho: carrinhoPadrao ? '' : (t.tipo_carrinho || ''),
              quantidade: t.quantidade || 0,
              valorUnit: Number(t.valor_unit) || 0,
              diarias: t.diarias || 1,
            };
          }));
        }

        // Load Team
        const { data: teamData } = await supabase.from('budget_team').select('*').eq('budget_id', id);
        if (teamData?.length > 0) {
          setEquipe(prev => prev.map(e => {
            let s = teamData.find(x => x.funcao === e.funcao);
            // Handle legacy mapping if needed, otherwise rely on exact matches
            if (!s && e.funcao === 'Motorista - Carros') s = teamData.find(x => x.funcao === 'Motoristas');
            return s ? { ...e, qtd: s.quantidade || 0, valorPessoa: Number(s.valor_diaria) || 0, qtdDiarias: s.quantidade_diarias || 1, nomes: s.nomes || [] } : e;
          }));

          // Verbas globais — carrega do primeiro membro que NÃO é motorista para evitar confusão de valores
          const nonDriver = teamData.find(x => !x.funcao.startsWith('Motorista'));
          if (nonDriver) {
            setVerbaAlimentacao(Number(nonDriver.verba_alimentacao) || 0);
          }
          // Procurar motorista para verba motorista
          const motorista = teamData.find(x => x.funcao.startsWith('Motorista'));
          if (motorista) {
            setVerbaMotorista(Number(motorista.verba_alimentacao) || 0);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar orçamento:", e);
      }
    };
    load();
  }, [id]);

  // ── Totals ──
  const totalEstrutura = Object.values(estruturas).reduce((a, e) => a + (e.checked ? Number(e.valor) || 0 : 0), 0);
  const totalCameras = cameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0)
    + customCameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0);
  const totalLentes = lentes.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0) * (Number(l.diarias) || 1), 0)
    + customLenses.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0) * (Number(l.diarias) || 1), 0);
  const totalAereo = drones.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0) * (Number(d.diarias) || 1), 0)
    + customDrones.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0) * (Number(d.diarias) || 1), 0);
  const totalCom = comunicacao.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0)
    + customComunicacao.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0);
  const totalMovimento = movEquip.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0) * (Number(m.diarias) || 1), 0)
    + customMovEquip.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0) * (Number(m.diarias) || 1), 0)
    + gruas.reduce((a, g) => a + (Number(g.quantidade) || 0) * (Number(g.valorUnit) || 0) * (Number(g.diarias) || 1), 0)
    + trilhos.reduce((a, t) => a + (Number(t.quantidade) || 0) * (Number(t.valorUnit) || 0) * (Number(t.diarias) || 1), 0);
  const totalEquipe = equipe.reduce((a, e) => a + ((Number(e.qtd) || 0) * (Number(e.valorPessoa) || 0) * (Number(e.qtdDiarias) || 1)), 0) +
    equipe.reduce((a, e) => {
      const verba = e.funcao.startsWith('Motorista') ? (Number(verbaMotorista) || 0) : (Number(verbaAlimentacao) || 0);
      return a + (verba * (Number(e.qtd) || 0) * (Number(e.qtdDiarias) || 1));
    }, 0);
  const totalFrete = (Number(logistica.distanciaKm) || 0) * (Number(logistica.valorKm) || 0);
  const subtotal = totalEstrutura + totalCameras + totalLentes + totalAereo + totalCom + totalMovimento + totalEquipe + totalFrete;
  const descontoAmt = desconto.modo === 'global'
    ? (desconto.tipo === 'percent' ? subtotal * (Number(desconto.valor) || 0) / 100 : Number(desconto.valor) || 0)
    : Object.entries(desconto.itens).reduce((a, [key, v]) => {
      const base = { frete: totalFrete, estrutura: totalEstrutura, cameras: totalCameras, lentes: totalLentes, aereo: totalAereo, comunicacao: totalCom, movimento: totalMovimento, equipe: totalEquipe }[key] || 0;
      return a + base * (Number(v) || 0) / 100;
    }, 0);
  const baseAposDesconto = subtotal - descontoAmt;
  const impostoAmt = baseAposDesconto * (Number(imposto) || 0) / 100;
  const grandTotal = baseAposDesconto + impostoAmt;

  // ── Validation ──
  const canAdvance = () => true;

  const next = () => { if (currentStep < 10) { setCurrentStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const prev = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  const setLen = (arr, setArr, len, tpl) => setArr(Array.from({ length: len }, (_, i) => arr[i] || tpl(i)));
  const upd = (arr, setArr, i, field, val) => { const a = [...arr]; a[i] = { ...a[i], [field]: val }; setArr(a); };

  const toggleEstrutura = (key) => {
    if (isView) return;
    setEstruturas(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }));
  };

  // ── Save ──
  const handleSave = async (newStatus = null, shouldExit = true) => {
    if (!generalData.nomeProjeto.trim() || !(generalData.cliente || '').trim()) {
      alert('Preencha o Nome do Projeto e o Cliente antes de salvar.');
      setCurrentStep(1);
      return;
    }
    setIsSaving(true);
    try {
      const activeEstruturas = Object.keys(estruturas).filter(k => estruturas[k].checked).map(k => ({ tipo: k, valor: estruturas[k].valor }));
      const targetStatus = newStatus || status || 'pending';

      // 1. PREPARA OS DADOS GERAIS E LOGÍSTICA
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
        distancia_km: Number(logistica.distanciaKm) || 0,
        valor_km: Number(logistica.valorKm) || 0,
        total: grandTotal || 0,
        imposto_percentual: Number(imposto) || 0,
        status: targetStatus,
        ...(targetStatus === 'rejected' ? { data_reprovacao: new Date().toISOString() } : {})
      };

      let currentBudgetId = id;

      // 2. GRAVA OU ATUALIZA O PAI (ORÇAMENTO)
      if (id) {
        const { error } = await supabase.from('budgets').update(budgetPayload).eq('id', id);
        if (error) throw error;

        // Em caso de atualização, limpamos os equipamentos antigos para inserir os novos sem duplicar
        await Promise.all([
          supabase.from('budget_cameras').delete().eq('budget_id', id),
          supabase.from('budget_lenses').delete().eq('budget_id', id),
          supabase.from('budget_drones').delete().eq('budget_id', id),
          supabase.from('budget_communication').delete().eq('budget_id', id),
          supabase.from('budget_movement').delete().eq('budget_id', id),
          supabase.from('budget_team').delete().eq('budget_id', id)
        ]);
      } else {
        const { data: newBudget, error } = await supabase.from('budgets').insert(budgetPayload).select().single();
        if (error) throw error;
        currentBudgetId = newBudget.id;
      }

      // 3. PREPARA OS ARRAYS DE EQUIPAMENTOS
      const camerasPayload = [
        ...cameras.filter(c => c.quantidade > 0).map(c => ({ budget_id: currentBudgetId, modelo: c.modelo, is_custom: false, quantidade: c.quantidade, valor_unit: c.valorUnit, diarias: c.diarias || 1 })),
        ...customCameras.filter(c => c.modelo.trim() !== '' && c.quantidade > 0).map(c => ({ budget_id: currentBudgetId, modelo: c.modelo, is_custom: true, quantidade: c.quantidade, valor_unit: c.valorUnit, diarias: c.diarias || 1 }))
      ];

      const lensesPayload = [
        ...lentes.filter(l => l.quantidade > 0).map(l => ({ budget_id: currentBudgetId, modelo: l.modelo, is_custom: false, quantidade: l.quantidade, valor_unit: l.valorUnit, diarias: l.diarias || 1 })),
        ...customLenses.filter(l => l.modelo.trim() !== '' && l.quantidade > 0).map(l => ({ budget_id: currentBudgetId, modelo: l.modelo, is_custom: true, quantidade: l.quantidade, valor_unit: l.valorUnit, diarias: l.diarias || 1 }))
      ];

      const dronesPayload = [
        ...drones.filter(d => d.quantidade > 0).map(d => ({ budget_id: currentBudgetId, modelo: d.modelo, is_custom: false, quantidade: d.quantidade, valor_unit: d.valorUnit, diarias: d.diarias || 1 })),
        ...customDrones.filter(d => d.modelo.trim() !== '' && d.quantidade > 0).map(d => ({ budget_id: currentBudgetId, modelo: d.modelo, is_custom: true, quantidade: d.quantidade, valor_unit: d.valorUnit, diarias: d.diarias || 1 }))
      ];

      const commPayload = [
        ...comunicacao.filter(c => c.quantidade > 0).map(c => ({ budget_id: currentBudgetId, modelo: c.modelo, is_custom: false, quantidade: c.quantidade, valor_unit: c.valorUnit, diarias: c.diarias || 1 })),
        ...customComunicacao.filter(c => c.modelo.trim() !== '' && c.quantidade > 0).map(c => ({ budget_id: currentBudgetId, modelo: c.modelo, is_custom: true, quantidade: c.quantidade, valor_unit: c.valorUnit, diarias: c.diarias || 1 }))
      ];

      const movPayload = [
        ...movEquip.filter(m => m.quantidade > 0).map(m => ({ budget_id: currentBudgetId, modelo: m.modelo, tipo: 'Outros', is_custom: false, quantidade: m.quantidade, valor_unit: m.valorUnit, diarias: m.diarias || 1 })),
        ...customMovEquip.filter(m => m.modelo.trim() !== '' && m.quantidade > 0).map(m => ({ budget_id: currentBudgetId, modelo: m.modelo, tipo: 'Outros', is_custom: true, quantidade: m.quantidade, valor_unit: m.valorUnit, diarias: m.diarias || 1 })),
        ...gruas.filter(g => g.quantidade > 0).map(g => ({ budget_id: currentBudgetId, modelo: `Grua ${g.metragem}`, tipo: 'Grua', metragem: g.metragem, is_custom: false, quantidade: g.quantidade, valor_unit: g.valorUnit, diarias: g.diarias || 1 })),
        ...trilhos.filter(t => t.quantidade > 0).map(t => {
          const metragemFinal = t.metragem === 'Personalizado' ? (t.metragemCustom || t.metragem) : t.metragem;
          const tipoCarrinhoFinal = t.tipoCarrinho === 'Outro' ? (t.customCarrinho || t.tipoCarrinho) : t.tipoCarrinho;
          return { budget_id: currentBudgetId, modelo: `Trilho ${metragemFinal}`, tipo: 'Trilho', metragem: metragemFinal, tipo_carrinho: tipoCarrinhoFinal, is_custom: false, quantidade: t.quantidade, valor_unit: t.valorUnit, diarias: t.diarias || 1 };
        })
      ];

      // 4. PREPARA A EQUIPA
      const getSetor = (funcao) => {
        if (funcao.includes('Câmera') || funcao.includes('Video') || funcao.includes('Assistente') || funcao.includes('Diretor')) return 'Fotografia & Câmera';
        if (funcao.includes('Motorista')) return 'Logística & Transporte';
        if (funcao.includes('Coordenador') || funcao.includes('Sistemas')) return 'Engenharia & Sistemas';
        if (funcao.includes('Maquinista')) return 'Maquinária & Grip';
        return 'Geral';
      };

      const teamPayload = equipe.filter(e => e.qtd > 0).map(e => {
        const isDriver = e.funcao.startsWith('Motorista');
        return {
          budget_id: currentBudgetId,
          setor: getSetor(e.funcao),
          funcao: e.funcao,
          quantidade: e.qtd,
          valor_diaria: e.valorPessoa,
          quantidade_diarias: e.qtdDiarias,
          nomes: e.nomes || [],
          verba_alimentacao: isDriver ? verbaMotorista : verbaAlimentacao
        };
      });

      // 5. INSERE TODOS OS EQUIPAMENTOS (BULK INSERT)
      const insertPromises = [];
      if (camerasPayload.length > 0) insertPromises.push(supabase.from('budget_cameras').insert(camerasPayload));
      if (lensesPayload.length > 0) insertPromises.push(supabase.from('budget_lenses').insert(lensesPayload));
      if (dronesPayload.length > 0) insertPromises.push(supabase.from('budget_drones').insert(dronesPayload));
      if (commPayload.length > 0) insertPromises.push(supabase.from('budget_communication').insert(commPayload));
      if (movPayload.length > 0) insertPromises.push(supabase.from('budget_movement').insert(movPayload));
      if (teamPayload.length > 0) insertPromises.push(supabase.from('budget_team').insert(teamPayload));

      await Promise.all(insertPromises);

      if (shouldExit) {
        navigate('/');
      } else {
        if (!id) {
          // Se for um orçamento novo, atualiza a URL para modo edição silenciosamente
          navigate(`/orcamento/${currentBudgetId}?mode=edit`, { replace: true });
        }
      }
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
                {isCidadeDropdownOpen && cidadeSugestoes?.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: SURF, border: `1px solid ${OV}`, borderRadius: 8, marginTop: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 250, overflowY: 'auto' }}>
                    {cidadeSugestoes.map(c => {
                      // Optional chaining extremo para evitar qualquer quebra
                      const sigla = c?.microrregiao?.mesorregiao?.UF?.sigla || '';
                      const nomeCidade = c?.nome || 'Cidade Desconhecida';
                      const exibicao = sigla ? `${nomeCidade} - ${sigla}` : nomeCidade;

                      return (
                        <div
                          key={c?.id || Math.random()}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${OV}`, fontSize: 14, color: ONS }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            try {
                              setLogistica({ ...logistica, cidade: exibicao });
                              setIsCidadeDropdownOpen(false);
                            } catch (err) {
                              console.error('Erro ao selecionar cidade:', err);
                            }
                          }}
                        >
                          {exibicao}
                        </div>
                      );
                    })}
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
                  <FCurrencyInput disabled={isView} placeholder="0,00" value={logistica.valorKm} onChange={val => setLogistica({ ...logistica, valorKm: val })} />
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
                        <FCurrencyInput disabled={isView} placeholder="0,00" value={estruturas[key].valor || ''} onChange={val => setEstruturas({ ...estruturas, [key]: { ...estruturas[key], valor: val } })} />
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

              return (
                <>
                  {cameras.map((cam, i) => (
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
                          <div style={S.hTitle}>{cam.modelo}</div>
                          {cam.quantidade > 0 && cam.valorUnit > 0 && (
                            <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 2 }}>R$ {fmt(cam.quantidade * cam.valorUnit * (cam.diarias || 1))}</div>
                          )}
                        </div>
                        <Stepper disabled={isView} value={cam.quantidade} onChange={n => upd(cameras, setCameras, i, 'quantidade', n)} />
                      </div>
                      {cam.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={cam.valorUnit || ''} onChange={val => upd(cameras, setCameras, i, 'valorUnit', val)} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={cam.diarias || ''} onChange={e => upd(cameras, setCameras, i, 'diarias', parseInt(e.target.value) || 0)} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}
                    </Fragment>
                  ))}

                  {/* Câmeras Personalizadas */}
                  <h3 style={{ ...S.sectionTitle, fontSize: 14, marginTop: 24, marginBottom: 16 }}>Modelos de Câmeras Personalizadas</h3>
                  {customCameras.map((cam, i) => (
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
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ ...S.iconBox, width: 48, height: 48, background: cam.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 24, color: cam.quantidade > 0 ? P : OL }}>add_circle</span>
                        </div>
                        <div style={S.hBody}>
                          <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outra Câmera (modelo)</label>
                            <FInput
                              disabled={isView}
                              type="text"
                              placeholder="Digite o modelo da câmera..."
                              value={cam.modelo}
                              onChange={e => {
                                const val = e.target.value;
                                let newList = [...customCameras];
                                newList[i] = { ...newList[i], modelo: val };
                                if (i === newList.length - 1 && val.trim() !== '') {
                                  newList.push({ modelo: '', quantidade: 0, valorUnit: 0 });
                                }
                                const filtered = newList.filter((item, idx) => item.modelo.trim() !== '' || idx === newList.length - 1);
                                setCustomCameras(filtered);
                              }}
                              style={{ padding: '6px 10px', fontSize: 13 }}
                            />
                          </div>
                          {cam.quantidade > 0 && cam.valorUnit > 0 && (
                            <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 2 }}>R$ {fmt(cam.quantidade * cam.valorUnit * (cam.diarias || 1))}</div>
                          )}
                        </div>

                        {!isView && (customCameras.length > 1 || cam.modelo !== '') && (
                          <button
                            onClick={() => {
                              let newList = [...customCameras];
                              newList.splice(i, 1);
                              if (newList.length === 0) {
                                newList = [{ modelo: '', quantidade: 0, valorUnit: 0 }];
                              }
                              setCustomCameras(newList);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px',
                              color: '#ba1a1a',
                              opacity: 0.7,
                              transition: 'opacity 0.2s',
                              flexShrink: 0
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                            onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                            title="Excluir câmera"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                          </button>
                        )}

                        <Stepper disabled={isView} value={cam.quantidade} onChange={n => {
                          let newList = [...customCameras];
                          newList[i].quantidade = n;
                          setCustomCameras(newList);
                        }} />
                      </div>
                      {cam.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={cam.valorUnit || ''} onChange={val => {
                                  let newList = [...customCameras];
                                  newList[i].valorUnit = val;
                                  setCustomCameras(newList);
                                }} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={cam.diarias || ''} onChange={e => {
                                  let newList = [...customCameras];
                                  newList[i].diarias = parseInt(e.target.value) || 0;
                                  setCustomCameras(newList);
                                }} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}
                    </Fragment>
                  ))}
                </>
              );
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

            {/* Lentes Padrão */}
            {lentes
              .filter(l => l.modelo.toLowerCase().includes(lensSearch.toLowerCase()) || l.subTitle.toLowerCase().includes(lensSearch.toLowerCase()))
              .map((l, i) => {
                const originalIndex = lentes.findIndex(x => x.modelo === l.modelo);
                return (
                  <Fragment key={l.modelo}>
                    <div style={{
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
                      {(() => {
                        const match = l.modelo.match(/(\d+-\d+)/);
                        const num = match ? (match[1] === '25-150' ? '25-250' : match[1]) : null;
                        const imgSrc = num ? `/IMAGEM_${num}.jpeg` : null;

                        if (imgSrc) {
                          return (
                            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                              <img src={imgSrc} alt={l.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </div>
                          );
                        }
                        return (
                          <div style={{ ...S.iconBox, width: 48, height: 48, background: l.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22, color: l.quantidade > 0 ? P : OL }}>photo_camera</span>
                          </div>
                        );
                      })()}
                      <div style={S.hBody}>
                        <div style={S.hTitle}>{l.modelo}</div>
                        <div style={S.hDesc}>{l.subTitle}</div>
                        {l.quantidade > 0 && l.valorUnit > 0 && (
                          <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(l.quantidade * l.valorUnit * (l.diarias || 1))}</div>
                        )}
                      </div>
                      <Stepper disabled={isView} value={l.quantidade} onChange={n => upd(lentes, setLentes, originalIndex, 'quantidade', n)} />
                    </div>
                    {l.quantidade > 0 && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <Field label="Valor unitário (R$)">
                              <FCurrencyInput disabled={isView} placeholder="0,00" value={l.valorUnit || ''} onChange={val => upd(lentes, setLentes, originalIndex, 'valorUnit', val)} />
                            </Field>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Field label="Diárias">
                              <FInput type="number" disabled={isView} placeholder="1" value={l.diarias || ''} onChange={e => upd(lentes, setLentes, originalIndex, 'diarias', parseInt(e.target.value) || 0)} />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}

            {/* Lentes Personalizadas (Outras) */}
            <h3 style={{ ...S.sectionTitle, fontSize: 14, marginTop: 24, marginBottom: 16 }}>Modelos de Lentes Personalizadas</h3>
            {customLenses.map((l, i) => (
              <Fragment key={i}>
                <div style={{
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
                  <div style={{ ...S.iconBox, width: 48, height: 48, background: l.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: l.quantidade > 0 ? P : OL }}>add_circle</span>
                  </div>
                  <div style={S.hBody}>
                    <div style={{ marginBottom: 4 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outra Lente (modelo)</label>
                      <FInput
                        disabled={isView}
                        type="text"
                        placeholder="Digite o modelo da lente..."
                        value={l.modelo}
                        onChange={e => {
                          const val = e.target.value;
                          let newList = [...customLenses];
                          newList[i] = { ...newList[i], modelo: val };
                          if (i === newList.length - 1 && val.trim() !== '') {
                            newList.push({ modelo: '', quantidade: 0, valorUnit: 0 });
                          }
                          const filtered = newList.filter((item, idx) => item.modelo.trim() !== '' || idx === newList.length - 1);
                          setCustomLenses(filtered);
                        }}
                        style={{ padding: '6px 10px', fontSize: 13 }}
                      />
                    </div>
                    {l.quantidade > 0 && l.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(l.quantidade * l.valorUnit * (l.diarias || 1))}</div>
                    )}
                  </div>

                  {!isView && (customLenses.length > 1 || l.modelo !== '') && (
                    <button
                      onClick={() => {
                        let newList = [...customLenses];
                        newList.splice(i, 1);
                        if (newList.length === 0) {
                          newList = [{ modelo: '', quantidade: 0, valorUnit: 0 }];
                        }
                        setCustomLenses(newList);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        color: '#ba1a1a',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                      title="Excluir lente"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  )}

                  <Stepper disabled={isView} value={l.quantidade} onChange={n => {
                    let newList = [...customLenses];
                    newList[i].quantidade = n;
                    setCustomLenses(newList);
                  }} />
                </div>
                {l.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={l.valorUnit || ''} onChange={val => {
                            let newList = [...customLenses];
                            newList[i].valorUnit = val;
                            setCustomLenses(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={l.diarias || ''} onChange={e => {
                            let newList = [...customLenses];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomLenses(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            ))}

            <div style={S.infoBox}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: P, flexShrink: 0 }}>info</span>
              <p style={{ ...S.infoTxt, color: isDark ? '#FFFFFF' : '#000000' }}>As lentes incluem filtros de proteção e cases rígidos para transporte.</p>
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
                  {(() => {
                    const modelLower = d.modelo.toLowerCase();
                    const imgSrc = modelLower.includes('fpv') ? '/IMAGEM_DJIFPV.jpeg' :
                      modelLower.includes('inspire') ? '/IMAGEM_INSPAIRE.jpeg' : null;

                    if (imgSrc) {
                      return (
                        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                          <img src={imgSrc} alt={d.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      );
                    }
                    return (
                      <div style={{ ...S.iconBox, width: 48, height: 48, background: d.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: d.quantidade > 0 ? P : OL }}>drone</span>
                      </div>
                    );
                  })()}
                  <div style={S.hBody}>
                    <div style={S.hTitle}>{d.modelo}</div>
                    <div style={S.hDesc}>{d.subTitle}</div>
                    {d.quantidade > 0 && d.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(d.quantidade * d.valorUnit * (d.diarias || 1))}</div>
                    )}
                  </div>
                  <Stepper disabled={isView} value={d.quantidade} onChange={n => upd(drones, setDrones, i, 'quantidade', n)} />
                </div>
                {d.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={d.valorUnit || ''} onChange={val => upd(drones, setDrones, i, 'valorUnit', val)} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={d.diarias || ''} onChange={e => upd(drones, setDrones, i, 'diarias', parseInt(e.target.value) || 0)} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}
              </Fragment>
            ))}

            {/* Drones Personalizados */}
            <h3 style={{ ...S.sectionTitle, fontSize: 14, marginTop: 24, marginBottom: 16 }}>Modelos de Drones Personalizados</h3>
            {customDrones.map((d, i) => (
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
                  <div style={{ ...S.iconBox, width: 48, height: 48, background: d.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: d.quantidade > 0 ? P : OL }}>add_circle</span>
                  </div>
                  <div style={S.hBody}>
                    <div style={{ marginBottom: 4 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outro Drone (modelo)</label>
                      <FInput
                        disabled={isView}
                        type="text"
                        placeholder="Digite o modelo do drone..."
                        value={d.modelo}
                        onChange={e => {
                          const val = e.target.value;
                          let newList = [...customDrones];
                          newList[i] = { ...newList[i], modelo: val };
                          if (i === newList.length - 1 && val.trim() !== '') {
                            newList.push({ modelo: '', quantidade: 0, valorUnit: 0 });
                          }
                          const filtered = newList.filter((item, idx) => item.modelo.trim() !== '' || idx === newList.length - 1);
                          setCustomDrones(filtered);
                        }}
                        style={{ padding: '6px 10px', fontSize: 13 }}
                      />
                    </div>
                    {d.quantidade > 0 && d.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(d.quantidade * d.valorUnit * (d.diarias || 1))}</div>
                    )}
                  </div>

                  {!isView && (customDrones.length > 1 || d.modelo !== '') && (
                    <button
                      onClick={() => {
                        let newList = [...customDrones];
                        newList.splice(i, 1);
                        if (newList.length === 0) {
                          newList = [{ modelo: '', quantidade: 0, valorUnit: 0 }];
                        }
                        setCustomDrones(newList);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        color: '#ba1a1a',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                      title="Excluir drone"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  )}

                  <Stepper disabled={isView} value={d.quantidade} onChange={n => {
                    let newList = [...customDrones];
                    newList[i].quantidade = n;
                    setCustomDrones(newList);
                  }} />
                </div>
                {d.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={d.valorUnit || ''} onChange={val => {
                            let newList = [...customDrones];
                            newList[i].valorUnit = val;
                            setCustomDrones(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={d.diarias || ''} onChange={e => {
                            let newList = [...customDrones];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomDrones(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
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

            {comunicacao.map((c, i) => (
              <Fragment key={i}>
                <div style={{
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${c.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  {(() => {
                    const modelLower = c.modelo.toLowerCase();
                    const imgSrc = modelLower.includes('solidcom') ? '/IMAGEM_SOLIDCOMM1.jpeg' : null;

                    if (imgSrc) {
                      return (
                        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                          <img src={imgSrc} alt={c.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      );
                    }
                    return (
                      <div style={{ ...S.iconBox, width: 48, height: 48, background: c.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: c.quantidade > 0 ? P : OL }}>cell_tower</span>
                      </div>
                    );
                  })()}
                  <div style={S.hBody}>
                    <div style={S.hTitle}>{c.modelo}</div>
                    <div style={S.hDesc}>{c.subTitle}</div>
                    {c.quantidade > 0 && c.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(c.quantidade * c.valorUnit * (c.diarias || 1))}</div>
                    )}
                  </div>
                  <Stepper disabled={isView} value={c.quantidade} onChange={n => upd(comunicacao, setComunicacao, i, 'quantidade', n)} />
                </div>
                {c.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <Field label="Pontos (Rádios)">
                        <FInput disabled={isView} type="number" placeholder="0" value={c.pontos || ''} onChange={e => upd(comunicacao, setComunicacao, i, 'pontos', parseInt(e.target.value) || 0)} />
                      </Field>
                      <Field label="Valor Unitário (R$)">
                        <FCurrencyInput disabled={isView} placeholder="0,00" value={c.valorUnit || ''} onChange={val => upd(comunicacao, setComunicacao, i, 'valorUnit', val)} />
                      </Field>
                      <Field label="Diárias">
                        <FInput type="number" disabled={isView} placeholder="1" value={c.diarias || ''} onChange={e => upd(comunicacao, setComunicacao, i, 'diarias', parseInt(e.target.value) || 0)} />
                      </Field>
                    </div>
                  </div>
                )}
              </Fragment>
            ))}

            {/* Comunicação Personalizada */}
            <h3 style={{ ...S.sectionTitle, fontSize: 14, marginTop: 24, marginBottom: 16 }}>Modelos de Comunicação Personalizados</h3>
            {customComunicacao.map((c, i) => (
              <Fragment key={i}>
                <div style={{
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${c.quantidade > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ ...S.iconBox, width: 48, height: 48, background: c.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: c.quantidade > 0 ? P : OL }}>add_circle</span>
                  </div>
                  <div style={S.hBody}>
                    <div style={{ marginBottom: 4 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outro Kit (modelo)</label>
                      <FInput
                        disabled={isView}
                        type="text"
                        placeholder="Digite o modelo..."
                        value={c.modelo}
                        onChange={e => {
                          const val = e.target.value;
                          let newList = [...customComunicacao];
                          newList[i] = { ...newList[i], modelo: val };
                          if (i === newList.length - 1 && val.trim() !== '') {
                            newList.push({ modelo: '', quantidade: 0, pontos: 0, valorUnit: 0 });
                          }
                          const filtered = newList.filter((item, idx) => item.modelo.trim() !== '' || idx === newList.length - 1);
                          setCustomComunicacao(filtered);
                        }}
                        style={{ padding: '6px 10px', fontSize: 13 }}
                      />
                    </div>
                    {c.quantidade > 0 && c.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(c.quantidade * c.valorUnit * (c.diarias || 1))}</div>
                    )}
                  </div>

                  {!isView && (customComunicacao.length > 1 || c.modelo !== '') && (
                    <button
                      onClick={() => {
                        let newList = [...customComunicacao];
                        newList.splice(i, 1);
                        if (newList.length === 0) {
                          newList = [{ modelo: '', quantidade: 0, pontos: 0, valorUnit: 0 }];
                        }
                        setCustomComunicacao(newList);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        color: '#ba1a1a',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                      title="Excluir kit"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  )}

                  <Stepper disabled={isView} value={c.quantidade} onChange={n => {
                    let newList = [...customComunicacao];
                    newList[i].quantidade = n;
                    setCustomComunicacao(newList);
                  }} />
                </div>
                {c.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <Field label="Pontos (Rádios)">
                        <FInput disabled={isView} type="number" placeholder="0" value={c.pontos || ''} onChange={e => {
                          let newList = [...customComunicacao];
                          newList[i].pontos = parseInt(e.target.value) || 0;
                          setCustomComunicacao(newList);
                        }} />
                      </Field>
                      <Field label="Valor Unitário (R$)">
                        <FCurrencyInput disabled={isView} placeholder="0,00" value={c.valorUnit || ''} onChange={val => {
                          let newList = [...customComunicacao];
                          newList[i].valorUnit = val;
                          setCustomComunicacao(newList);
                        }} />
                      </Field>
                      <Field label="Diárias">
                        <FInput type="number" disabled={isView} placeholder="1" value={c.diarias || ''} onChange={e => {
                          let newList = [...customComunicacao];
                          newList[i].diarias = parseInt(e.target.value) || 0;
                          setCustomComunicacao(newList);
                        }} />
                      </Field>
                    </div>
                  </div>
                )}
              </Fragment>
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
                  {(() => {
                    let imgSrc = null;
                    if (m.modelo === 'Steady Cam') {
                      imgSrc = '/IMAGEM_STEDY.jpeg';
                    } else if (m.modelo === 'DJI Ronin 4D') {
                      imgSrc = '/imagem_ronin.jpeg';
                    }

                    if (imgSrc) {
                      return (
                        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                          <img src={imgSrc} alt={m.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      );
                    }
                    return (
                      <div style={{ ...S.iconBox, background: m.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: m.quantidade > 0 ? P : OL }}>switch_video</span>
                      </div>
                    );
                  })()}
                  <div style={S.hBody}>
                    <div style={S.hTitle}>{m.modelo}</div>
                    <div style={S.hDesc}>{m.subTitle}</div>
                    {m.quantidade > 0 && m.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(m.quantidade * m.valorUnit * (m.diarias || 1))}</div>
                    )}
                  </div>
                  <Stepper disabled={isView} value={m.quantidade} onChange={n => upd(movEquip, setMovEquip, i, 'quantidade', n)} />
                </div>
                {m.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={m.valorUnit || ''} onChange={val => upd(movEquip, setMovEquip, i, 'valorUnit', val)} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={m.diarias || ''} onChange={e => upd(movEquip, setMovEquip, i, 'diarias', parseInt(e.target.value) || 0)} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}
              </Fragment>
            ))}

            {/* Gruas */}
            <div style={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              border: `1px solid ${gruas.length > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '12px',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                  <img src="/imagem_cammate.jpeg" alt="Grua" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ ...S.hBody, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ONS }}>Gruas</div>
                </div>
                <Stepper disabled={isView} value={gruas.length} onChange={n => setLen(gruas, setGruas, n, () => ({ metragem: '7,50m', quantidade: 1, valorUnit: 0 }))} />
              </div>

              {gruas.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                  {gruas.map((g, i) => (
                    <div key={i} style={{ borderTop: i === 0 ? 'none' : `0.5px solid ${OV}`, paddingTop: i === 0 ? 0 : 12, marginTop: i === 0 ? 0 : 12 }}>
                      <p style={{ ...S.itemLabel, marginBottom: 10 }}>Grua {i + 1}</p>

                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 6 }}>Tamanho da Grua</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                        {['7,50m', '10m', '14m'].map(tamanho => (
                          <div
                            key={tamanho}
                            onClick={() => { if (!isView) { const ng = [...gruas]; ng[i].metragem = tamanho; setGruas(ng); } }}
                            style={{
                              padding: '8px',
                              textAlign: 'center',
                              borderRadius: '6px',
                              border: `1px solid ${g.metragem === tamanho ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
                              background: g.metragem === tamanho ? SCN : 'transparent',
                              color: g.metragem === tamanho ? P : ONS,
                              fontSize: 12,
                              fontWeight: g.metragem === tamanho ? 600 : 500,
                              cursor: isView ? 'default' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {tamanho}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <Field label="Quantidade">
                          <FInput disabled={isView} type="number" placeholder="1" value={g.quantidade || ''} onChange={e => { const ng = [...gruas]; ng[i] = { ...ng[i], quantidade: parseInt(e.target.value) || 0 }; setGruas(ng); }} />
                        </Field>
                        <Field label="Valor (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={g.valorUnit || ''} onChange={val => { const ng = [...gruas]; ng[i] = { ...ng[i], valorUnit: val }; setGruas(ng); }} />
                        </Field>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={g.diarias || ''} onChange={e => { const ng = [...gruas]; ng[i] = { ...ng[i], diarias: parseInt(e.target.value) || 0 }; setGruas(ng); }} />
                        </Field>
                      </div>
                      {g.quantidade > 0 && g.valorUnit > 0 && (
                        <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                          {g.quantidade}× R$ {fmt(g.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(g.quantidade * g.valorUnit * (g.diarias || 1))}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trilhos */}
            <div style={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              border: `1px solid ${trilhos.length > 0 ? P : (isDark ? '#3A3A3A' : '#E0E0E0')}`,
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '12px',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                  <img src="/IMAGEM_TRILHO.jpeg" alt="Trilho" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ ...S.hBody, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ONS }}>Trilhos</div>
                </div>
                <Stepper disabled={isView} value={trilhos.length} onChange={n => setLen(trilhos, setTrilhos, n, () => ({ metragem: '', tipoCarrinho: '', quantidade: 1, valorUnit: 0 }))} />
              </div>

              {trilhos.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
                  {trilhos.map((t, i) => (
                    <div key={i} style={{ borderTop: i === 0 ? 'none' : `0.5px solid ${OV}`, paddingTop: i === 0 ? 0 : 12, marginTop: i === 0 ? 0 : 12 }}>
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
                        {t.metragem === 'Personalizado' && (
                          <FInput
                            disabled={isView}
                            style={{ marginTop: 8, fontSize: 13 }}
                            placeholder="Especifique o tamanho..."
                            value={t.metragemCustom || ''}
                            onChange={e => {
                              const nt = [...trilhos];
                              nt[i] = { ...nt[i], metragemCustom: e.target.value };
                              setTrilhos(nt);
                            }}
                          />
                        )}
                      </Field>
                      <Field label="Tipo de Carrinho">
                        <FSelect disabled={isView} value={t.tipoCarrinho === 'Outro' ? 'Outro' : t.tipoCarrinho} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], tipoCarrinho: e.target.value }; setTrilhos(nt); }}>
                          <option value="">Selecione…</option>
                          <option value="Doorway Dolly">Doorway Dolly</option>
                          <option value="Dolly Standard">Dolly Standard</option>
                          <option value="Super Panther">Super Panther</option>
                          <option value="Fisher 10">Fisher 10</option>
                          <option value="Outro">Outro</option>
                        </FSelect>
                        {t.tipoCarrinho === 'Outro' && (
                          <FInput
                            disabled={isView}
                            style={{ marginTop: 8, fontSize: 13 }}
                            placeholder="Especifique o carrinho..."
                            value={t.customCarrinho || ''}
                            onChange={e => {
                              const nt = [...trilhos];
                              nt[i] = { ...nt[i], customCarrinho: e.target.value };
                              setTrilhos(nt);
                            }}
                          />
                        )}
                      </Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <Field label="Quantidade">
                          <FInput disabled={isView} type="number" placeholder="1" value={t.quantidade || ''} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], quantidade: parseInt(e.target.value) || 0 }; setTrilhos(nt); }} />
                        </Field>
                        <Field label="Valor (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={t.valorUnit || ''} onChange={val => { const nt = [...trilhos]; nt[i] = { ...nt[i], valorUnit: val }; setTrilhos(nt); }} />
                        </Field>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={t.diarias || ''} onChange={e => { const nt = [...trilhos]; nt[i] = { ...nt[i], diarias: parseInt(e.target.value) || 0 }; setTrilhos(nt); }} />
                        </Field>
                      </div>
                      {t.quantidade > 0 && t.valorUnit > 0 && (
                        <p style={{ fontSize: 12, color: ONSV, marginTop: 4 }}>
                          {t.quantidade}× R$ {fmt(t.valorUnit)} = <strong style={{ color: P }}>R$ {fmt(t.quantidade * t.valorUnit * (t.diarias || 1))}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipamentos de Movimento Personalizados */}
            <h3 style={{ ...S.sectionTitle, fontSize: 14, marginTop: 24, marginBottom: 16 }}>Modelos de Movimento Personalizados</h3>
            {customMovEquip.map((m, i) => (
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
                  <div style={{ ...S.iconBox, width: 48, height: 48, background: m.quantidade > 0 ? SCN : (isDark ? '#2A2A2A' : '#F5F5F5') }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: m.quantidade > 0 ? P : OL }}>add_circle</span>
                  </div>
                  <div style={S.hBody}>
                    <div style={{ marginBottom: 4 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--secondary)', marginBottom: 2 }}>Outro Equipamento (modelo)</label>
                      <FInput
                        disabled={isView}
                        type="text"
                        placeholder="Digite o equipamento..."
                        value={m.modelo}
                        onChange={e => {
                          const val = e.target.value;
                          let newList = [...customMovEquip];
                          newList[i] = { ...newList[i], modelo: val };
                          if (i === newList.length - 1 && val.trim() !== '') {
                            newList.push({ modelo: '', quantidade: 0, valorUnit: 0 });
                          }
                          const filtered = newList.filter((item, idx) => item.modelo.trim() !== '' || idx === newList.length - 1);
                          setCustomMovEquip(filtered);
                        }}
                        style={{ padding: '6px 10px', fontSize: 13 }}
                      />
                    </div>
                    {m.quantidade > 0 && m.valorUnit > 0 && (
                      <div style={{ fontSize: 12, color: P, fontWeight: 600, marginTop: 3 }}>R$ {fmt(m.quantidade * m.valorUnit * (m.diarias || 1))}</div>
                    )}
                  </div>

                  {!isView && (customMovEquip.length > 1 || m.modelo !== '') && (
                    <button
                      onClick={() => {
                        let newList = [...customMovEquip];
                        newList.splice(i, 1);
                        if (newList.length === 0) {
                          newList = [{ modelo: '', quantidade: 0, valorUnit: 0 }];
                        }
                        setCustomMovEquip(newList);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        color: '#ba1a1a',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                      title="Excluir equipamento"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  )}

                  <Stepper disabled={isView} value={m.quantidade} onChange={n => {
                    let newList = [...customMovEquip];
                    newList[i].quantidade = n;
                    setCustomMovEquip(newList);
                  }} />
                </div>
                {m.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={m.valorUnit || ''} onChange={val => {
                            let newList = [...customMovEquip];
                            newList[i].valorUnit = val;
                            setCustomMovEquip(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={m.diarias || ''} onChange={e => {
                            let newList = [...customMovEquip];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomMovEquip(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            ))}

          </div>
        </>
      );

      // ── 9. Equipe ──
      case 9: {
        const subtotalDiarias = equipe.reduce((a, e) => a + ((Number(e.qtd) || 0) * (Number(e.valorPessoa) || 0) * (Number(e.qtdDiarias) || 1)), 0);
        const subtotalAlimentacao = equipe.reduce((a, e) => {
          const verba = e.funcao.startsWith('Motorista') ? (Number(verbaMotorista) || 0) : (Number(verbaAlimentacao) || 0);
          return a + (verba * (Number(e.qtd) || 0) * (Number(e.qtdDiarias) || 1));
        }, 0);
        const totalStage9 = subtotalDiarias + subtotalAlimentacao;

        return (
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
                <Fragment key={i}>
                  {m.funcao === 'Operadores de Câmera' && (
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: P, marginTop: i > 0 ? 24 : 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Setor de Fotografia & Câmera
                    </h3>
                  )}
                  {m.funcao === 'Coordenadores' && (
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: P, marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Setor de Engenharia & Sistemas
                    </h3>
                  )}
                  {m.funcao === 'Maquinistas' && (
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: P, marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Setor de Maquinária & Grip
                    </h3>
                  )}
                  {m.funcao === 'Motorista - Carros' && (
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: P, marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Setor de Logística & Transporte
                    </h3>
                  )}
                  <div style={{
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`,
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: m.qtd > 0 ? 14 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {(() => {
                        const imageMap = {
                          'Operadores de Câmera': '/OPERADOR_DE CAMERA.jpeg',
                          'Assistentes': '/ASSISTENTE.jpeg',
                          'Técnicos de Câmeras': '/TECNICO DE CAMERAS.jpeg',
                          'Diretor de Imagens': '/VIDEO MAN.jpeg',
                          'Video Man': '/VIDEO MAN.jpeg',
                          'Coordenadores': '/COOREDENADOR.jpeg',
                          'Técnicos de Sistemas': '/TECNICO DE SISTEMAS.jpeg',
                          'Maquinistas': '/MAQUINISTA.jpeg',
                          'Motorista - Carros': '/MOTORISTA CARRO.jpeg',
                          'Motorista - Caminhão': '/MOTORISTA CAMINHAO.jpeg'
                        };
                        const imgSrc = imageMap[m.funcao];

                        if (imgSrc) {
                          return (
                            <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`, flexShrink: 0 }}>
                              <img src={imgSrc} alt={m.funcao} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          );
                        }
                        return (
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: SCN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 24, color: SEC }}>person</span>
                          </div>
                        );
                      })()}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <Field label="Valor da Diária (R$)">
                            <FCurrencyInput disabled={isView} placeholder="0,00" value={m.valorPessoa || ''} onChange={val => { const ne = [...equipe]; ne[i].valorPessoa = val; setEquipe(ne); }} />
                          </Field>
                          <Field label="Qtd. de Diárias">
                            <FInput disabled={isView} type="number" placeholder="1" value={m.qtdDiarias || ''} onChange={e => { const ne = [...equipe]; ne[i].qtdDiarias = parseInt(e.target.value) || 0; setEquipe(ne); }} />
                          </Field>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: SCLN, borderRadius: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: ONSV }}>Subtotal (Cachê)</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: P }}>R$ {fmt((Number(m.qtd) || 0) * (Number(m.valorPessoa) || 0) * (Number(m.qtdDiarias) || 1))}</span>
                        </div>
                        {m.nomes.map((nome, ni) => (
                          <FInput key={ni} disabled={isView} style={{ marginBottom: 6, fontSize: 13 }} type="text" placeholder={`Nome ${ni + 1} (opcional)`} value={nome} onChange={e => { const ne = [...equipe]; ne[i].nomes[ni] = e.target.value; setEquipe(ne); }} />
                        ))}
                      </div>
                    )}
                  </div>
                </Fragment>
              ))}

              <div style={{ ...S.itemCard, marginTop: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Verba Alimentação (R$/pessoa)">
                    <FCurrencyInput disabled={isView} value={verbaAlimentacao || ''} onChange={val => setVerbaAlimentacao(val)} />
                  </Field>
                  <Field label="Verba Motorista (R$/pessoa)">
                    <FCurrencyInput disabled={isView} value={verbaMotorista || ''} onChange={val => setVerbaMotorista(val)} />
                  </Field>
                </div>
                <p style={{ fontSize: 12, color: ONSV, marginTop: 8, fontStyle: 'italic', lineHeight: 1.4 }}>
                  *A alimentação total é somada ao orçamento automaticamente: <br />(Verba × Pessoas × Diárias)
                </p>
              </div>

              {/* Painel de Resumo da Etapa 9 */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA',
                border: `1px solid ${isDark ? '#444' : '#E9ECEF'}`,
                borderRadius: '12px',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: ONS, marginBottom: 16 }}>TOTAIS DE CACHÊ E VERBAS DE ALIMENTAÇÃO</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: ONSV }}>Total de Diárias (Cachês)</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>R$ {fmt(subtotalDiarias)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: `1px dashed ${OV}` }}>
                  <span style={{ fontSize: 13, color: ONSV }}>Total de Alimentação</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>R$ {fmt(subtotalAlimentacao)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: ONS }}>Custo Total da Equipe</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: P }}>R$ {fmt(totalStage9)}</span>
                </div>
              </div>
            </div>
          </>
        );
      }

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
                        <FCurrencyInput placeholder="0,00" value={Number(desconto.valor) || 0} onChange={val => setDesconto(d => ({ ...d, valor: val }))} />
                      )}
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

              {/* Imposto section */}
              {!isView && subtotal > 0 && (
                <div style={{ marginTop: 20, background: SCLO, border: `1px solid ${OV}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: P }}>receipt</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ONS }}>Imposto</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <FInput
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                        value={imposto}
                        onChange={e => setImposto(e.target.value)}
                      />
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: ONSV,
                      background: SCN, padding: '11px 14px',
                      borderRadius: 8, flexShrink: 0, minWidth: 36, textAlign: 'center'
                    }}>%</span>
                  </div>
                  {Number(imposto) > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: SCHN, borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: ONSV }}>Valor do imposto sobre total líquido</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ONS }}>R$ {fmt(impostoAmt)}</span>
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
                {impostoAmt > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: SCLO, borderTop: descontoAmt > 0 ? `1px solid ${OV}` : 'none' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: ONS }}>Total</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: ONS }}>R$ {fmt(baseAposDesconto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff5f0', borderTop: `0.5px solid ${OV}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c75000' }}>receipt</span>
                        <span style={{ fontSize: 13, color: '#c75000', fontWeight: 600 }}>Imposto ({imposto}%)</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#c75000' }}>+ R$ {fmt(impostoAmt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px', background: P }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Total com Imposto</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>R$ {fmt(grandTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px', background: P }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Total Estimado</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>R$ {fmt(grandTotal)}</span>
                  </div>
                )}
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
              <>
                {!isView && (
                  <button
                    style={{ ...S.btnSec, color: P, border: `1px solid ${P}`, width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 8 }}
                    onClick={() => handleSave(null, false)}
                    disabled={isSaving}
                    title="Salvar progresso"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {isSaving ? 'progress_activity' : 'save'}
                    </span>
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
                        style={{ ...S.btnPri, background: `${ERR}1A`, color: ERR }}
                        onClick={() => handleSave('rejected')}
                        disabled={isSaving}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                        Reprovar
                      </button>
                      <button
                        style={{ ...S.btnPri, background: `${SUC}1A`, color: SUC }}
                        onClick={() => handleSave('approved')}
                        disabled={isSaving}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
                        Aprovar
                      </button>
                    </>
                  )}
                  <button style={S.btnPri} onClick={() => handleSave(null, true)} disabled={isSaving}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isSaving ? 'progress_activity' : 'save'}</span>
                    {isSaving ? 'Salvando…' : 'Finalizar'}
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
