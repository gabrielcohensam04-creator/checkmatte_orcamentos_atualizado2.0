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
      setFormData({ 
        nome: company.nome || '', 
        cnpj: company.cnpj || '', 
        contato: company.contato || '', 
        responsavel: company.responsavel || '' 
      });
    } else {
      setEditingCompany(null);
      setFormData({ nome: '', cnpj: '', contato: '', responsavel: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome) return;
    const payload = { 
      nome: formData.nome, 
      cnpj: formData.cnpj || null, 
      contato: formData.contato || null, 
      responsavel: formData.responsavel || null 
    };
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
        borderRadius: 8, 
        padding: 16, 
        transition: 'border-color .2s ease, background .15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#0A0A0A'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#3A3A3A' : '#D1D5DB'; }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: ONS, marginBottom: 4 }}>{company.nome}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 12, color: ONSV }}>CNPJ: {company.cnpj || '—'}</p>
          <p style={{ fontSize: 12, color: ONSV }}>Contato: {company.contato || '—'}</p>
          <p style={{ fontSize: 12, color: ONSV }}>Responsável: {company.responsavel || '—'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => handleOpenModal(company)}
          style={{ flex: 1, height: 32, border: 'none', borderRadius: 6, background: '#93C5FD', color: '#1E3A8A', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Editar
        </button>
        <button
          onClick={() => handleDelete(company.id)}
          style={{ flex: 1, height: 32, border: 'none', borderRadius: 6, background: '#FCA5A5', color: '#991B1B', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity .15s' }}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: `1px solid ${isDark ? '#2A2A2A' : '#E0E0E0'}`, paddingBottom: 10 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Empresas — {companies.length}
        </h2>
        <button
          onClick={() => handleOpenModal()}
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#FFFFFF', color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {companies.map(c => <CompanyCard key={c.id} company={c} />)}
        {companies.length === 0 && !loading && (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: ONSV }}>
            Nenhuma empresa cadastrada.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDark ? '#1A1A1A' : '#fff', padding: 32, borderRadius: 16, width: '100%', maxWidth: 400, border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: ONS, marginBottom: 24 }}>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', marginBottom: 6 }}>Razão Social *</label>
                <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', marginBottom: 6 }}>CNPJ</label>
                <input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', marginBottom: 6 }}>Contato</label>
                <input value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: SEC, textTransform: 'uppercase', marginBottom: 6 }}>Responsável</label>
                <input value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONSV, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: P, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
