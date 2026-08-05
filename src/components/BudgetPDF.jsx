import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, PDFDownloadLink, Image,
} from '@react-pdf/renderer';
import logoUrl from '/logo_FUNDOPRETO.png';
import { light } from '../tokens';

// Design tokens — PDF is always rendered in the light palette (printed/downloaded document)
const { P, ONS, ONSV, SEC, OV, SURF } = light;
const WHITE = '#ffffff';

const fmt     = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d)  => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';


const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', backgroundColor: WHITE, paddingBottom: 56 },

  // Header
  header:       { backgroundColor: '#000000', paddingTop: 28, paddingBottom: 24, paddingLeft: 36, paddingRight: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandName:    { fontSize: 20, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 2 },
  brandSub:     { fontSize: 7, color: OV, letterSpacing: 1.5, marginTop: 4 },
  docLabel:     { fontSize: 7, color: OV, letterSpacing: 1.5, textAlign: 'right', marginBottom: 4 },
  docNum:       { fontSize: 13, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'right' },
  docDate:      { fontSize: 8, color: OV, textAlign: 'right', marginTop: 3 },
  accent:       { height: 3, backgroundColor: P },

  // Client block
  clientBlock:  { marginTop: 20, marginLeft: 36, marginRight: 36, paddingTop: 16, paddingBottom: 16, paddingLeft: 18, paddingRight: 18, backgroundColor: '#F0F0F0', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientLabel:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC, letterSpacing: 1.5, marginBottom: 5 },
  clientName:   { fontSize: 17, fontFamily: 'Helvetica-Bold', color: ONS },
  projectName:  { fontSize: 10, color: ONSV, marginTop: 4 },
  statusPill:   { paddingTop: 4, paddingBottom: 4, paddingLeft: 10, paddingRight: 10, borderRadius: 99, borderWidth: 0.5 },
  statusTxt:    { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },

  // Dates
  datesRow:     { marginTop: 14, marginLeft: 36, marginRight: 36, flexDirection: 'row' },
  dateBox:      { flex: 1, backgroundColor: WHITE, borderRadius: 6, paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, borderWidth: 0.5, borderColor: OV, marginRight: 6 },
  dateBoxLast:  { flex: 1, backgroundColor: WHITE, borderRadius: 6, paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, borderWidth: 0.5, borderColor: OV },
  dateLabel:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC, letterSpacing: 1.2, marginBottom: 5 },
  dateVal:      { fontSize: 10, fontFamily: 'Helvetica-Bold', color: ONS },

  // Description
  descBlock:    { marginTop: 12, marginLeft: 36, marginRight: 36, paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14, backgroundColor: WHITE, borderRadius: 6, borderWidth: 0.5, borderColor: OV },
  descText:     { fontSize: 9, color: ONSV, lineHeight: 1.6 },

  // Divider
  divider:      { marginTop: 20, marginLeft: 36, marginRight: 36, height: 0.5, backgroundColor: OV },

  // Section
  sectionWrap:  { marginTop: 16, marginLeft: 36, marginRight: 36 },
  sectionHdr:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionName:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC, letterSpacing: 1.5 },
  sectionTot:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: P },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 7, paddingBottom: 7, paddingLeft: 12, paddingRight: 12, backgroundColor: WHITE, marginBottom: 1, borderRadius: 4 },
  itemLabel:    { fontSize: 9, color: ONS },
  itemQty:      { fontSize: 7, color: ONSV, marginTop: 2 },
  itemVal:      { fontSize: 9, fontFamily: 'Helvetica-Bold', color: ONS },

  // Summary table
  summaryWrap:  { marginTop: 24, marginLeft: 36, marginRight: 36 },
  summaryTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC, letterSpacing: 1.5, marginBottom: 8 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, paddingBottom: 9, paddingLeft: 14, paddingRight: 14, borderBottomWidth: 0.5, borderBottomColor: OV, backgroundColor: WHITE },
  summaryLabel: { fontSize: 9, color: ONSV },
  summaryVal:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: ONS },

  // Discount row
  discRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, paddingBottom: 9, paddingLeft: 14, paddingRight: 14, borderBottomWidth: 0.5, borderBottomColor: OV, backgroundColor: '#fff5f0' },
  discLabel:    { fontSize: 9, color: '#c75000' },
  discVal:      { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#c75000' },

  // Subtotal row
  subRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, paddingBottom: 9, paddingLeft: 14, paddingRight: 14, borderBottomWidth: 0.5, borderBottomColor: OV, backgroundColor: WHITE },
  subLabel:     { fontSize: 9, color: ONSV },
  subVal:       { fontSize: 9, fontFamily: 'Helvetica-Bold', color: ONSV },

  // Total row
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 16, backgroundColor: ONS, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  totalLabel:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.5 },
  totalSub:     { fontSize: 7, color: OV, marginTop: 3 },
  totalVal:     { fontSize: 20, fontFamily: 'Helvetica-Bold', color: WHITE },

  // Footer
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 10, paddingBottom: 10, paddingLeft: 36, paddingRight: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: OV, backgroundColor: SURF },
  footerLeft:   { fontSize: 7, color: ONSV },
  footerBrand:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC },
  footerPage:   { fontSize: 7, color: ONSV, textAlign: 'right', marginTop: 2 },
});

// ── Section block ─────────────────────────────────────────────────────────────
const SectionBlock = ({ title, items }) => {
  // Filtra itens ativos: precisam ter qty > 0 E (valorUnit ou valorPessoa ou valor) > 0
  const active = items.filter(it => {
    const qty  = Number(it.quantidade ?? it.qtd ?? 0);
    const unit = Number(it.valorUnit ?? it.valorPessoa ?? it.valor ?? 0);
    return qty > 0 && unit > 0;
  });
  if (!active.length) return null;

  // Total correto: qty × unit × diarias (ou qtdDiarias para equipe)
  const total = active.reduce((a, it) => {
    const qty     = Number(it.quantidade ?? it.qtd ?? 1);
    const unit    = Number(it.valorUnit ?? it.valorPessoa ?? it.valor ?? 0);
    const diarias = Number(it.diarias ?? it.qtdDiarias ?? 1);
    return a + (qty * unit * diarias);
  }, 0);

  return (
    <View style={s.sectionWrap}>
      <View style={s.sectionHdr}>
        <Text style={s.sectionName}>{title.toUpperCase()}</Text>
        <Text style={s.sectionTot}>R$ {fmt(total)}</Text>
      </View>
      {active.map((it, i) => {
        const qty     = Number(it.quantidade ?? it.qtd ?? 0);
        const unit    = Number(it.valorUnit ?? it.valorPessoa ?? 0);
        const diarias = Number(it.diarias ?? it.qtdDiarias ?? 1);
        // Se tem qty+unit, calcula; senao usa .valor fixo
        const valor = (it.valorUnit != null || it.valorPessoa != null)
          ? qty * unit * diarias
          : Number(it.valor || 0);
        const label = it.modelo || it.funcao || it.tipo || `Item ${i + 1}`;
        // Exibe detalhe de quantidade/diarias
        let qtyTxt = null;
        if (it.valorUnit != null || it.valorPessoa != null) {
          qtyTxt = diarias > 1
            ? `${qty}× · ${diarias} diárias · R$ ${fmt(unit)}/dia`
            : `${qty}× · R$ ${fmt(unit)}/un`;
        }
        const nomesStr = Array.isArray(it.nomes) && it.nomes.length
          ? it.nomes.filter(n => n).join(', ')
          : '';

        return (
          <View key={i} style={s.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemLabel}>{label}</Text>
              {qtyTxt && <Text style={s.itemQty}>{qtyTxt}</Text>}
              {nomesStr && (
                <Text style={{ fontSize: 7, color: ONSV, marginTop: 2 }}>
                  {nomesStr}
                </Text>
              )}
            </View>
            <Text style={s.itemVal}>R$ {fmt(valor)}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── Main PDF Document ─────────────────────────────────────────────────────────
const BudgetPDFDoc = ({ budget, equipment, team }) => {
  const estruturas  = budget?.tipo_estrutura   || [];
  const cameras     = equipment?.cameras       || [];
  const lentes      = equipment?.lentes        || [];
  const aereo       = equipment?.aereo         || [];
  const comunicacao = equipment?.comunicacao   || [];
  const movimento   = equipment?.movimento     || [];
  const equipe      = team?.equipe             || [];
  // totais por categoria
  const totEst  = estruturas.reduce((a, e) => a + (Number(e.valor) || 0), 0);
  const totCam  = cameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0);
  const totLen  = lentes.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0) * (Number(l.diarias) || 1), 0);
  const totDrn  = aereo.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0) * (Number(d.diarias) || 1), 0);
  // BUG2 FIX: comunicacao usa valorUnit × quantidade × diarias (campo .valor nao existe no banco)
  const totCom  = comunicacao.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0) * (Number(c.diarias) || 1), 0);
  const totMov  = movimento.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0) * (Number(m.diarias) || 1), 0);
  const totEqp  = equipe.reduce((a, e) => {
    const qtd     = Number(e.qtd || 0);
    const diarias = Number(e.qtdDiarias || 1);
    const valor   = Number(e.valorPessoa || 0);
    const verbaM  = Number(e.verba_alimentacao || 0);
    return a + (qtd * diarias * valor) + (verbaM * qtd * diarias);
  }, 0);
  // BUG3 FIX: frete incluido no total
  const totFrete = (Number(budget?.distancia_km) || 0) * (Number(budget?.valor_km) || 0);
  const subtotal = totEst + totCam + totLen + totDrn + totCom + totMov + totEqp + totFrete;

  // Usa o total salvo como verdade absoluta
  const grandTotal  = Number(budget?.total || 0);
  const impostoP    = Number(budget?.imposto_percentual || 0);

  // Faz engenharia reversa para achar a base antes do imposto
  const baseAposDesconto = grandTotal / (1 + impostoP / 100);
  const impostoAmt       = grandTotal - baseAposDesconto;
  const descontoAmt      = subtotal > baseAposDesconto ? subtotal - baseAposDesconto : 0;

  const summaryLines = [
    { label: 'Frete',       value: totFrete },
    { label: 'Estrutura',   value: totEst },
    { label: 'Câmeras',     value: totCam },
    { label: 'Lentes',      value: totLen },
    { label: 'Drones',      value: totDrn },
    { label: 'Comunicação', value: totCom },
    { label: 'Movimento',   value: totMov },
    { label: 'Equipe',      value: totEqp },
  ].filter(r => r.value > 0);

  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <Document title={budget?.nome_projeto || 'Orçamento'} author="Checkmatte">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Image src={logoUrl} style={{ width: 140, height: 'auto' }} />
          </View>
          <View>
            <Text style={s.docLabel}>PROPOSTA COMERCIAL</Text>
            <Text style={s.docNum}>#{String(budget?.id || '').slice(0, 8).toUpperCase()}</Text>
            <Text style={s.docDate}>Emitido em {today}</Text>
          </View>
        </View>
        <View style={s.accent} />

        {/* Client */}
        <View style={s.clientBlock}>
          <View>
            <Text style={s.clientLabel}>PARA</Text>
            <Text style={s.clientName}>{budget?.cliente || budget?.companies?.nome || '—'}</Text>
            {!!budget?.companies?.responsavel && (
              <Text style={{ fontSize: 9, color: ONSV, marginTop: 2 }}>A/C: {budget.companies.responsavel}</Text>
            )}
            <Text style={s.projectName}>{budget?.nome_projeto || 'Projeto sem nome'}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={s.datesRow}>
          {[
            { label: 'VIAGEM',   date: budget?.data_viagem },
            { label: 'MONTAGEM', date: budget?.data_montagem },
            { label: 'GRAVAÇÃO', date: budget?.data_gravacao },
            { label: 'RETORNO',  date: budget?.data_volta },
          ].map(({ label, date }, i, arr) => (
            <View key={label} style={i === arr.length - 1 ? s.dateBoxLast : s.dateBox}>
              <Text style={s.dateLabel}>{label}</Text>
              <Text style={s.dateVal}>{fmtDate(date)}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {!!budget?.descricao && (
          <View style={s.descBlock}>
            <Text style={s.descText}>{budget.descricao}</Text>
          </View>
        )}

        <View style={s.divider} />

        {/* BUG3 FIX: Frete como secao separada quando presente */}
        {totFrete > 0 && (
          <SectionBlock title="Frete" items={[{ modelo: `${budget?.distancia_km || 0} km × R$ ${fmt(budget?.valor_km || 0)}/km`, valor: totFrete }]} />
        )}
        {/* Equipment sections */}
        {totEst > 0 && <SectionBlock title="Estrutura" items={estruturas.map(e => ({ modelo: e.tipo, valor: e.valor }))} />}
        <SectionBlock title="Câmeras"     items={cameras} />
        <SectionBlock title="Lentes"      items={lentes} />
        <SectionBlock title="Drones"      items={aereo} />
        {/* BUG2 FIX: comunicacao passada diretamente — tem valorUnit, quantidade, diarias */}
        <SectionBlock title="Comunicação" items={comunicacao} />
        <SectionBlock title="Movimento"   items={movimento} />
        {/* BUG4 FIX: equipe renderizada com secao propria mostrando cache + alimentacao por membro */}
        {equipe.some(e => Number(e.qtd) > 0) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionHdr}>
              <Text style={s.sectionName}>EQUIPE</Text>
              <Text style={s.sectionTot}>R$ {fmt(totEqp)}</Text>
            </View>
            {equipe.filter(e => Number(e.qtd) > 0).map((e, i) => {
              const qtd      = Number(e.qtd || 0);
              const diarias  = Number(e.qtdDiarias || 1);
              const cache    = qtd * Number(e.valorPessoa || 0) * diarias;
              const verbaM   = Number(e.verba_alimentacao || 0);
              const alim     = verbaM * qtd * diarias;
              const subtotal = cache + alim;
              const nomesStr = Array.isArray(e.nomes) && e.nomes.filter(n => n).length
                ? e.nomes.filter(n => n).join(', ') : '';
              return (
                <View key={i} style={s.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemLabel}>{e.funcao}</Text>
                    <Text style={s.itemQty}>
                      {qtd}× · {diarias} diária{diarias !== 1 ? 's' : ''} · R$ {fmt(e.valorPessoa)}/d{alim > 0 ? ` + R$ ${fmt(verbaM)}/alim` : ''}
                    </Text>
                    {nomesStr ? <Text style={{ fontSize: 7, color: ONSV, marginTop: 2 }}>{nomesStr}</Text> : null}
                  </View>
                  <Text style={s.itemVal}>R$ {fmt(subtotal)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Financial summary */}
        <View style={s.summaryWrap}>
          <Text style={s.summaryTitle}>RESUMO FINANCEIRO</Text>

          {/* Category rows */}
          {summaryLines.map((r) => (
            <View key={r.label} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{r.label}</Text>
              <Text style={s.summaryVal}>R$ {fmt(r.value)}</Text>
            </View>
          ))}

          {/* Subtotal (shown only when discount exists) */}
          {descontoAmt > 0 && (
            <View style={s.subRow}>
              <Text style={s.subLabel}>Subtotal</Text>
              <Text style={s.subVal}>R$ {fmt(subtotal)}</Text>
            </View>
          )}

          {/* Discount row */}
          {descontoAmt > 0 && (
            <View style={s.discRow}>
              <Text style={s.discLabel}>Desconto</Text>
              <Text style={s.discVal}>− R$ {fmt(descontoAmt)}</Text>
            </View>
          )}

          {/* Liquid Total before tax (if tax exists) */}
          {impostoAmt > 0 && (
            <View style={[s.subRow, { backgroundColor: '#fdfdfd' }]}>
              <Text style={[s.subLabel, { color: ONS, fontWeight: 'bold' }]}>Total Líquido</Text>
              <Text style={[s.subVal, { color: ONS }]}>R$ {fmt(baseAposDesconto)}</Text>
            </View>
          )}

          {/* Tax row */}
          {impostoAmt > 0 && (
            <View style={[s.discRow, { backgroundColor: '#fff5f0' }]}>
              <Text style={s.discLabel}>Imposto ({impostoP}%)</Text>
              <Text style={s.discVal}>+ R$ {fmt(impostoAmt)}</Text>
            </View>
          )}

          {/* Grand total */}
          <View style={s.totalRow}>
            <View>
              <Text style={s.totalLabel}>{impostoAmt > 0 ? 'TOTAL COM IMPOSTO' : 'TOTAL ESTIMADO'}</Text>
              <Text style={s.totalSub}>Valores sujeitos a alteração conforme negociação</Text>
            </View>
            <Text style={s.totalVal}>R$ {fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>Documento confidencial · exclusivo para o destinatário</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.footerBrand}>CHECKMATTE</Text>
            <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </View>

      </Page>
    </Document>
  );
};

// ── Download button ───────────────────────────────────────────────────────────
export const DownloadPDFButton = ({ budget, equipment, team, desconto }) => (
  <PDFDownloadLink
    document={<BudgetPDFDoc budget={budget} equipment={equipment} team={team} desconto={desconto} />}
    fileName={`checkmatte-${(budget?.nome_projeto || 'proposta').toLowerCase().replace(/\s+/g, '-')}.pdf`}
    style={{ textDecoration: 'none', flex: 1 }}
  >
    {({ loading, error }) => (
      <button
        style={{
          width: '100%', height: 36, border: '1px solid #1E293B', borderRadius: 8,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '6px 20px', whiteSpace: 'nowrap',
          background: error ? '#ba1a1a' : loading ? '#475569' : '#1E293B',
          color: '#F8FAFC', transition: 'opacity .15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          {error ? 'error' : loading ? 'progress_activity' : 'picture_as_pdf'}
        </span>
        {error ? 'Erro no PDF' : loading ? 'Gerando PDF…' : 'PDF Geral'}
      </button>
    )}
  </PDFDownloadLink>
);

// ── Team PDF styles ───────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', backgroundColor: WHITE, paddingBottom: 60 },

  // Header
  header:      { backgroundColor: '#000000', paddingTop: 26, paddingBottom: 22, paddingLeft: 36, paddingRight: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  accent:      { height: 3, backgroundColor: P },
  docLabel:    { fontSize: 7, color: OV, letterSpacing: 1.5, textAlign: 'right', marginBottom: 4 },
  docNum:      { fontSize: 13, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'right' },
  docDate:     { fontSize: 8, color: OV, textAlign: 'right', marginTop: 3 },

  // Info block
  infoBlock:   { marginTop: 18, marginLeft: 36, marginRight: 36, paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 16, backgroundColor: '#F0F0F0', borderRadius: 8 },
  infoLabel:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC, letterSpacing: 1.5, marginBottom: 4 },
  infoProject: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: ONS },
  infoClient:  { fontSize: 10, color: ONSV, marginTop: 3 },
  infoDesc:    { fontSize: 9, color: ONSV, marginTop: 8, lineHeight: 1.6 },

  // Section title
  secTitle:    { marginTop: 22, marginLeft: 36, marginRight: 36, fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC, letterSpacing: 1.5, marginBottom: 8 },

  // Table
  tableWrap:   { marginLeft: 36, marginRight: 36 },
  theadRow:    { flexDirection: 'row', backgroundColor: ONS, paddingTop: 7, paddingBottom: 7, paddingLeft: 10, paddingRight: 10, borderRadius: 4 },
  tbodyRow:    { flexDirection: 'row', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, borderBottomWidth: 0.5, borderBottomColor: OV, backgroundColor: WHITE },
  tbodyRowAlt: { flexDirection: 'row', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, borderBottomWidth: 0.5, borderBottomColor: OV, backgroundColor: SURF },

  // Column widths
  colFuncao:   { flex: 4.7 },
  colQtd:      { flex: 0.7, textAlign: 'center' },
  colDiarias:  { flex: 0.9, textAlign: 'center' },
  colValor:    { flex: 1.4, textAlign: 'right' },
  colSub:      { flex: 1.4, textAlign: 'right' },

  thTxt:       { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.8 },
  tdTxt:       { fontSize: 8, color: ONS },
  tdMuted:     { fontSize: 7, color: ONSV, marginTop: 2 },
  tdBold:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ONS },

  // Total strip
  totalWrap:   { marginTop: 0, marginLeft: 36, marginRight: 36 },
  verbRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 9, paddingBottom: 9, paddingLeft: 14, paddingRight: 14, backgroundColor: WHITE, borderBottomWidth: 0.5, borderBottomColor: OV },
  verbLabel:   { fontSize: 9, color: ONSV },
  verbVal:     { fontSize: 9, fontFamily: 'Helvetica-Bold', color: ONS },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 16, backgroundColor: ONS, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  totalLabel:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.5 },
  totalSub:    { fontSize: 7, color: OV, marginTop: 3 },
  totalVal:    { fontSize: 18, fontFamily: 'Helvetica-Bold', color: WHITE },

  // Footer
  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 10, paddingBottom: 10, paddingLeft: 36, paddingRight: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: OV, backgroundColor: SURF },
  footerLeft:  { fontSize: 7, color: ONSV },
  footerBrand: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SEC },
  footerPage:  { fontSize: 7, color: ONSV, textAlign: 'right', marginTop: 2 },
});

// ── Team PDF Document ─────────────────────────────────────────────────────────
const TeamPDFDocument = ({ budget, team }) => {
  const equipe = team?.equipe || [];
  const today  = new Date().toLocaleDateString('pt-BR');

  // BUG5 FIX: totalCaches e totalAlimentacao calculados por membro com diarias
  const activeEquipe = equipe.filter(m => Number(m.qtd) > 0);

  const totalCaches = activeEquipe.reduce((acc, m) => {
    const qtd     = Number(m.qtd || 0);
    const diarias = Number(m.qtdDiarias || 1);
    const valor   = Number(m.valorPessoa || 0);
    return acc + qtd * diarias * valor;
  }, 0);

  const totalAlimentacao = activeEquipe.reduce((acc, m) => {
    const qtd     = Number(m.qtd || 0);
    const diarias = Number(m.qtdDiarias || 1);
    const verbaM  = Number(m.verba_alimentacao || 0);
    return acc + verbaM * qtd * diarias;
  }, 0);

  const totalGeral = totalCaches + totalAlimentacao;

  // BUG6 FIX: colunas agora incluem ALIM./DIA
  const COLS = [
    { label: 'FUNÇÃO',       style: ts.colFuncao },
    { label: 'QTD',          style: ts.colQtd },
    { label: 'DIÁRIAS',      style: ts.colDiarias },
    { label: 'VALOR/DIA',    style: ts.colValor },
    { label: 'ALIM./DIA',    style: ts.colValor },
    { label: 'SUBTOTAL',     style: ts.colSub },
  ];

  return (
    <Document title={`Equipe – ${budget?.nome_projeto || 'Orçamento'}`} author="Checkmatte">
      <Page size="A4" style={ts.page}>

        {/* Header */}
        <View style={ts.header}>
          <View>
            <Image src={logoUrl} style={{ width: 130, height: 'auto' }} />
          </View>
          <View>
            <Text style={ts.docLabel}>RELATÓRIO DE EQUIPE</Text>
            <Text style={ts.docNum}>#{String(budget?.id || '').slice(0, 8).toUpperCase()}</Text>
            <Text style={ts.docDate}>Emitido em {today}</Text>
          </View>
        </View>
        <View style={ts.accent} />

        {/* Project info */}
        <View style={ts.infoBlock}>
          <Text style={ts.infoLabel}>PROJETO</Text>
          <Text style={ts.infoProject}>{budget?.nome_projeto || 'Projeto sem nome'}</Text>
          <Text style={ts.infoClient}>{budget?.cliente || budget?.companies?.nome || '—'}</Text>
          {!!budget?.descricao && (
            <Text style={ts.infoDesc}>{budget.descricao}</Text>
          )}
        </View>

        {/* Team table */}
        <Text style={ts.secTitle}>DETALHAMENTO DA EQUIPE</Text>
        <View style={ts.tableWrap}>
          {/* Header row */}
          <View style={ts.theadRow}>
            {COLS.map(({ label, style }) => (
              <Text key={label} style={[ts.thTxt, style]}>{label}</Text>
            ))}
          </View>

          {/* Body rows — BUG6 FIX: mostra cache, alim/dia e subtotal correto */}
          {activeEquipe.map((m, i) => {
            const qtd      = Number(m.qtd || 0);
            const diarias  = Number(m.qtdDiarias || 1);
            const valor    = Number(m.valorPessoa || 0);
            const verbaM   = Number(m.verba_alimentacao || 0);
            const subtotal = qtd * diarias * valor + verbaM * qtd * diarias;
            const nomesStr = Array.isArray(m.nomes) && m.nomes.length
              ? m.nomes.filter(n => n).join(', ')
              : '—';
            const rowStyle = i % 2 === 0 ? ts.tbodyRow : ts.tbodyRowAlt;

            return (
              <View key={i} style={rowStyle}>
                <View style={ts.colFuncao}>
                  <Text style={ts.tdTxt}>{m.funcao || `Função ${i + 1}`}</Text>
                  {nomesStr && nomesStr !== '—' && (
                    <Text style={[ts.tdMuted, { fontSize: 7, color: '#64748B', marginTop: 2 }]}>
                      {nomesStr}
                    </Text>
                  )}
                </View>
                <Text style={[ts.tdTxt, ts.colQtd, { textAlign: 'center' }]}>{qtd}</Text>
                <Text style={[ts.tdTxt, ts.colDiarias, { textAlign: 'center' }]}>{diarias}</Text>
                <Text style={[ts.tdTxt, ts.colValor, { textAlign: 'right' }]}>R$ {fmt(valor)}</Text>
                <Text style={[ts.tdTxt, ts.colValor, { textAlign: 'right' }]}>{verbaM > 0 ? `R$ ${fmt(verbaM)}` : '—'}</Text>
                <Text style={[ts.tdBold, ts.colSub, { textAlign: 'right' }]}>R$ {fmt(subtotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* BUG5+6 FIX: Totals por categoria */}
        <View style={ts.totalWrap}>
          <View style={ts.verbRow}>
            <Text style={ts.verbLabel}>Total de Cachês</Text>
            <Text style={ts.verbVal}>R$ {fmt(totalCaches)}</Text>
          </View>
          {totalAlimentacao > 0 && (
            <View style={ts.verbRow}>
              <Text style={ts.verbLabel}>Total de Alimentação</Text>
              <Text style={ts.verbVal}>R$ {fmt(totalAlimentacao)}</Text>
            </View>
          )}
          <View style={ts.totalRow}>
            <View>
              <Text style={ts.totalLabel}>TOTAL EQUIPE (RH)</Text>
              <Text style={ts.totalSub}>Cachês + Alimentação</Text>
            </View>
            <Text style={ts.totalVal}>R$ {fmt(totalGeral)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={ts.footer} fixed>
          <Text style={ts.footerLeft}>Documento confidencial · exclusivo para o destinatário</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={ts.footerBrand}>CHECKMATTE</Text>
            <Text style={ts.footerPage} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </View>

      </Page>
    </Document>
  );
};

// ── Team Download Button ──────────────────────────────────────────────────────
export const DownloadTeamPDFButton = ({ budget, team }) => (
  <PDFDownloadLink
    document={<TeamPDFDocument budget={budget} team={team} />}
    fileName={`checkmatte-equipe-${(budget?.nome_projeto || 'projeto').toLowerCase().replace(/\s+/g, '-')}.pdf`}
    style={{ textDecoration: 'none', flex: 1 }}
  >
    {({ loading, error }) => (
      <button
        style={{
          width: '100%', height: 36, border: '1px solid #E2E8F0', borderRadius: 8,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '6px 20px', whiteSpace: 'nowrap',
          background: error ? '#ba1a1a' : loading ? '#F1F5F9' : '#FFFFFF',
          color: error ? '#fff' : '#475569',
          transition: 'opacity .15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          {error ? 'error' : loading ? 'progress_activity' : 'group'}
        </span>
        {error ? 'Erro no PDF' : loading ? 'Gerando PDF…' : 'PDF Equipe'}
      </button>
    )}
  </PDFDownloadLink>
);

export default BudgetPDFDoc;
