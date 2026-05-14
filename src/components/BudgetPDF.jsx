import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, PDFDownloadLink,
} from '@react-pdf/renderer';

// Design tokens
const P     = '#a5360d';
const ONS   = '#251915';
const ONSV  = '#58423b';
const SEC   = '#8b4e3b';
const OV    = '#e0c0b6';
const SCN   = '#ffe9e3';
const SURF  = '#fff8f6';
const WHITE = '#ffffff';

const fmt     = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const fmtDate = (d)  => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

const STATUS_LABEL = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Reprovado', completed: 'Concluído' };
const STATUS_COLOR = { pending: '#c75000', approved: '#16a34a', rejected: '#ba1a1a', completed: '#006482' };

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', backgroundColor: SURF, paddingBottom: 56 },

  // Header
  header:       { backgroundColor: ONS, paddingTop: 28, paddingBottom: 24, paddingLeft: 36, paddingRight: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandName:    { fontSize: 20, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 2 },
  brandSub:     { fontSize: 7, color: OV, letterSpacing: 1.5, marginTop: 4 },
  docLabel:     { fontSize: 7, color: OV, letterSpacing: 1.5, textAlign: 'right', marginBottom: 4 },
  docNum:       { fontSize: 13, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'right' },
  docDate:      { fontSize: 8, color: OV, textAlign: 'right', marginTop: 3 },
  accent:       { height: 3, backgroundColor: P },

  // Client block
  clientBlock:  { marginTop: 20, marginLeft: 36, marginRight: 36, paddingTop: 16, paddingBottom: 16, paddingLeft: 18, paddingRight: 18, backgroundColor: SCN, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  const active = items.filter(it => (Number(it.quantidade ?? it.qtd ?? 1)) > 0 && (Number(it.valorUnit ?? it.valorPessoa ?? it.valor ?? 0)) > 0);
  if (!active.length) return null;

  const total = active.reduce((a, it) => {
    const qty  = it.quantidade ?? it.qtd ?? 1;
    const unit = it.valorUnit  ?? it.valorPessoa ?? it.valor ?? 0;
    return a + (Number(qty) * Number(unit));
  }, 0);

  return (
    <View style={s.sectionWrap}>
      <View style={s.sectionHdr}>
        <Text style={s.sectionName}>{title.toUpperCase()}</Text>
        <Text style={s.sectionTot}>R$ {fmt(total)}</Text>
      </View>
      {active.map((it, i) => {
        const qty   = it.quantidade ?? it.qtd ?? null;
        const unit  = it.valorUnit  ?? it.valorPessoa ?? null;
        const valor = unit !== null ? Number(qty) * Number(unit) : Number(it.valor || 0);
        const label = it.modelo || it.funcao || it.tipo || `Item ${i + 1}`;
        const qtyTxt = (qty !== null && unit !== null) ? `${qty}× · R$ ${fmt(unit)} / un` : null;
        return (
          <View key={i} style={s.itemRow}>
            <View>
              <Text style={s.itemLabel}>{label}</Text>
              {qtyTxt && <Text style={s.itemQty}>{qtyTxt}</Text>}
            </View>
            <Text style={s.itemVal}>R$ {fmt(valor)}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── Main PDF Document ─────────────────────────────────────────────────────────
const BudgetPDFDoc = ({ budget, equipment, team, desconto }) => {
  const estruturas  = budget?.tipo_estrutura   || [];
  const cameras     = equipment?.cameras       || [];
  const lentes      = equipment?.lentes        || [];
  const aereo       = equipment?.aereo         || [];
  const comunicacao = equipment?.comunicacao   || [];
  const movimento   = equipment?.movimento     || [];
  const equipe      = team?.equipe             || [];
  const verba       = Number(team?.verba_alimentacao || 0);

  const totEst  = estruturas.reduce((a, e) => a + (Number(e.valor) || 0), 0);
  const totCam  = cameras.reduce((a, c) => a + (Number(c.quantidade) || 0) * (Number(c.valorUnit) || 0), 0);
  const totLen  = lentes.reduce((a, l) => a + (Number(l.quantidade) || 0) * (Number(l.valorUnit) || 0), 0);
  const totDrn  = aereo.reduce((a, d) => a + (Number(d.quantidade) || 0) * (Number(d.valorUnit) || 0), 0);
  const totCom  = comunicacao.reduce((a, c) => a + (Number(c.valor) || 0), 0);
  const totMov  = movimento.reduce((a, m) => a + (Number(m.quantidade) || 0) * (Number(m.valorUnit) || 0), 0);
  const totEqp  = equipe.reduce((a, e) => a + (Number(e.qtd) || 0) * (Number(e.valorPessoa) || 0), 0) + verba;
  const subtotal = totEst + totCam + totLen + totDrn + totCom + totMov + totEqp;

  // Discount calculation
  const descontoAmt = desconto?.modo === 'global'
    ? (desconto.tipo === 'percent'
        ? subtotal * (Number(desconto.valor) || 0) / 100
        : Number(desconto.valor) || 0)
    : (desconto?.itens
        ? Object.entries(desconto.itens).reduce((a, [key, v]) => {
            const base = { estrutura: totEst, cameras: totCam, lentes: totLen, aereo: totDrn, comunicacao: totCom, movimento: totMov, equipe: totEqp }[key] || 0;
            return a + base * (Number(v) || 0) / 100;
          }, 0)
        : 0);
  const grandTotal = subtotal - descontoAmt;

  const summaryLines = [
    { label: 'Estrutura',   value: totEst },
    { label: 'Câmeras',     value: totCam },
    { label: 'Lentes',      value: totLen },
    { label: 'Drones',      value: totDrn },
    { label: 'Comunicação', value: totCom },
    { label: 'Movimento',   value: totMov },
    { label: 'Equipe',      value: totEqp },
  ].filter(r => r.value > 0);

  const today       = new Date().toLocaleDateString('pt-BR');
  const statusColor = STATUS_COLOR[budget?.status] || STATUS_COLOR.pending;
  const statusLabel = STATUS_LABEL[budget?.status] || 'Pendente';

  return (
    <Document title={budget?.nome_projeto || 'Orçamento'} author="Checkmatte">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>CHECKMATTE</Text>
            <Text style={s.brandSub}>PRODUÇÃO & BROADCAST</Text>
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
          <View style={{ ...s.statusPill, backgroundColor: statusColor + '18', borderColor: statusColor + '55' }}>
            <Text style={{ ...s.statusTxt, color: statusColor }}>{statusLabel}</Text>
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

        {/* Equipment sections */}
        {totEst > 0 && <SectionBlock title="Estrutura"   items={estruturas.map(e => ({ modelo: e.tipo, valor: e.valor }))} />}
        <SectionBlock title="Câmeras"     items={cameras} />
        <SectionBlock title="Lentes"      items={lentes} />
        <SectionBlock title="Drones"      items={aereo} />
        <SectionBlock title="Comunicação" items={comunicacao.map(c => ({ modelo: c.modelo, valor: c.valor }))} />
        <SectionBlock title="Movimento"   items={movimento} />
        {(equipe.some(e => e.qtd > 0) || verba > 0) && (
          <SectionBlock title="Equipe" items={[
            ...equipe,
            ...(verba > 0 ? [{ modelo: 'Verba de Alimentação', valor: verba }] : []),
          ]} />
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
              <Text style={s.discLabel}>
                Desconto{desconto?.modo === 'global' && desconto?.tipo === 'percent' ? ` (${desconto.valor}%)` : ''}
              </Text>
              <Text style={s.discVal}>− R$ {fmt(descontoAmt)}</Text>
            </View>
          )}

          {/* Grand total */}
          <View style={s.totalRow}>
            <View>
              <Text style={s.totalLabel}>TOTAL ESTIMADO</Text>
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
export const DownloadPDFButton = ({ budget, equipment, team, desconto, isDark }) => (
  <PDFDownloadLink
    document={<BudgetPDFDoc budget={budget} equipment={equipment} team={team} desconto={desconto} />}
    fileName={`checkmatte-${(budget?.nome_projeto || 'proposta').toLowerCase().replace(/\s+/g, '-')}.pdf`}
    style={{ textDecoration: 'none', flex: 1 }}
  >
    {({ loading, error }) => (
      <button
        style={{
          width: '100%', height: 44, border: 'none', borderRadius: 10,
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: error ? '#ba1a1a' : loading ? '#8c7169' : (isDark ? '#FFFFFF' : '#0A0A0A'),
          color: isDark ? '#0A0A0A' : '#FFFFFF', transition: 'opacity .15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {error ? 'error' : loading ? 'progress_activity' : 'picture_as_pdf'}
        </span>
        {error ? 'Erro no PDF' : loading ? 'Gerando PDF…' : 'Exportar PDF'}
      </button>
    )}
  </PDFDownloadLink>
);

export default BudgetPDFDoc;
