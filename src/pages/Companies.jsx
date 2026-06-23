import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const Companies = () => {
  const { isDark } = useTheme();
  const { SCLO, OV, ONS, ONSV, SEC, P, ERR } = isDark ? dark : light;

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ nome: '', cnpj: '', contato: '', responsavel: '' });

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('companies').select('*').order('nome', { ascending: true });
      if (error) throw error;
      setCompanies(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({ nome: company.nome || '', cnpj: company.cnpj || '', contato: company.contato || '', responsavel: company.responsavel || '' });
    } else {
      setEditingCompany(null);
      setFormData({ nome: '', cnpj: '', contato: '', responsavel: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome) return;
    const payload = { nome: formData.nome, cnpj: formData.cnpj || null, contato: formData.contato || null, responsavel: formData.responsavel || null };
    try {
      if (editingCompany) {
        const { error } = await supabase.from('companies').update(payload).eq('id', editingCompany.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('companies').insert(payload);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      alert('Erro ao salvar: ' + (e.message || e));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir empresa permanentemente?')) return;
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      fetchCompanies();
    } catch (e) { alert('Erro ao excluir: ' + (e.message || e)); }
  };

  const CompanyCard = ({ company }) => (
    <div
      style={{
        background: SCLO,
        border: `1px solid ${isDark ? '#3A3A3A' : '#D1D5DB'}`,
        borderRadius: 12,
        padding: 20,
        transition: 'all .2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 12px rgba(255, 0, 0, 0.15)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#0A0A0A';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 0, 0, 0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDark ? '#3A3A3A' : '#D1D5DB';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.15)';
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: ONS, marginBottom: 8 }}>{company.nome}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONSV, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>badge</span>
            <span>CNPJ: {company.cnpj || '—'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONSV, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>call</span>
            <span>Contato: {company.contato || '—'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONSV, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
            <span>Responsável: {company.responsavel || '—'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => handleOpenModal(company)}
          style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: '#93C5FD', color: '#1E3A8A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Editar
        </button>
        <button
          onClick={() => handleDelete(company.id)}
          style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: '#FCA5A5', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          Excluir
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="column-header" style={{ margin: 0, border: 'none', padding: 0 }}>Empresas — {companies.length}</h2>
        <button
          onClick={() => handleOpenModal()}
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#FFFFFF', color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
          title="Nova Empresa"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', color: ONSV, fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
          Carregando empresas…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {companies.map(c => <CompanyCard key={c.id} company={c} />)}
          {companies.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '48px 16px', textAlign: 'center', background: SCLO, border: `1px dashed ${OV}`, borderRadius: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: OV, display: 'block', marginBottom: 8 }}>business</span>
              <p style={{ fontSize: 14, color: ONSV }}>Nenhuma empresa cadastrada.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDark ? '#1A1A1A' : '#fff', padding: 32, borderRadius: 16, width: '100%', maxWidth: 420, border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: ONS, marginBottom: 24 }}>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Razão Social *', key: 'nome', required: true },
                { label: 'CNPJ', key: 'cnpj' },
                { label: 'Contato', key: 'contato' },
                { label: 'Responsável', key: 'responsavel' },
              ].map(({ label, key, required }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                  <input
                    required={required}
                    value={formData[key]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONSV, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: P, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
