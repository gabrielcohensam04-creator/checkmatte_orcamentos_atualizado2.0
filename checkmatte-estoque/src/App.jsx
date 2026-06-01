import { useState } from 'react'
import OrcamentosAprovados from './pages/OrcamentosAprovados'
import './App.css'

const TABS = [
  { id: 'estoque',   label: '📦 Estoque' },
  { id: 'orcamentos', label: '✅ Orçamentos Aprovados' },
];

function App() {
  const [activeTab, setActiveTab] = useState('estoque')

  return (
    <div className="app-shell">
      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="nav-logo">CM</span>
          <span className="nav-name">Checkmatte</span>
        </div>
        <div className="nav-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <main className="app-content">
        {activeTab === 'estoque' && (
          <div className="placeholder-estoque">
            <span>📦</span>
            <h2>Controle de Estoque</h2>
            <p>Em desenvolvimento</p>
          </div>
        )}
        {activeTab === 'orcamentos' && <OrcamentosAprovados />}
      </main>
    </div>
  )
}

export default App
