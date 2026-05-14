import React from 'react';

const ONSV = '#58423b';
const SEC  = '#8b4e3b';
const OV   = '#e0c0b6';
const SCLO = '#ffffff';
const ERR  = '#ba1a1a';
const WARN = '#c75000';

const RejectedBudgets = () => (
  <div className="dashboard-container">
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">Reprovados</h1>
        <p style={{ fontSize: 13, color: ONSV, marginTop: 2 }}>Orçamentos que não foram aprovados</p>
      </div>
    </div>

    <div style={{ background: SCLO, border: `0.5px solid rgba(224,192,182,.6)`, borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fff8f6' }}>
            {['Projeto', 'Cliente', 'Data Reprovação', 'Status', 'Ações'].map((h, i) => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SEC, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `0.5px solid ${OV}`, ...(i === 4 ? { width: 80 } : {}) }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#251915', borderBottom: `0.5px solid rgba(224,192,182,.4)` }}>Projeto Gamma</td>
            <td style={{ padding: '12px 16px', fontSize: 14, color: ONSV, borderBottom: `0.5px solid rgba(224,192,182,.4)` }}>SBT</td>
            <td style={{ padding: '12px 16px', fontSize: 14, color: ONSV, borderBottom: `0.5px solid rgba(224,192,182,.4)` }}>05/05/2026</td>
            <td style={{ padding: '12px 16px', borderBottom: `0.5px solid rgba(224,192,182,.4)` }}>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: `rgba(186,26,26,.08)`, color: ERR, border: `0.5px solid rgba(186,26,26,.2)` }}>Reprovado</span>
            </td>
            <td style={{ padding: '12px 16px', borderBottom: `0.5px solid rgba(224,192,182,.4)` }}>
              <button style={{ width: 32, height: 32, border: `0.5px solid rgba(186,26,26,.3)`, borderRadius: 8, background: `rgba(186,26,26,.06)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ERR }}
                onMouseEnter={e => { e.currentTarget.style.background = ERR; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `rgba(186,26,26,.06)`; e.currentTarget.style.color = ERR; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default RejectedBudgets;
