import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const RejectedBudgets = () => {
  const { isDark } = useTheme();
  const { SCLO, OV, ONS, ONSV, ERR } = isDark ? dark : light;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Reprovados</h1>
          <p style={{ fontSize: 13, color: ONSV, marginTop: 2 }}>Orçamentos que não foram aprovados</p>
        </div>
      </div>

      <div style={{ background: SCLO, border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: isDark ? '#0f0f0f' : '#FAFAFA' }}>
              {['Projeto', 'Cliente', 'Data Reprovação', 'Status', 'Ações'].map((h, i) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${OV}`, ...(i === 4 ? { width: 80 } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: ONS, borderBottom: `1px solid ${OV}` }}>Projeto Gamma</td>
              <td style={{ padding: '12px 16px', fontSize: 14, color: ONSV, borderBottom: `1px solid ${OV}` }}>SBT</td>
              <td style={{ padding: '12px 16px', fontSize: 14, color: ONSV, borderBottom: `1px solid ${OV}` }}>05/05/2026</td>
              <td style={{ padding: '12px 16px', borderBottom: `1px solid ${OV}` }}>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: `${ERR}1A`, color: ERR, border: `1px solid ${ERR}40` }}>Reprovado</span>
              </td>
              <td style={{ padding: '12px 16px', borderBottom: `1px solid ${OV}` }}>
                <button style={{ width: 32, height: 32, border: `1px solid ${ERR}4D`, borderRadius: 8, background: `${ERR}1A`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ERR, transition: 'background .15s, color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = ERR; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${ERR}1A`; e.currentTarget.style.color = ERR; }}
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
};

export default RejectedBudgets;
