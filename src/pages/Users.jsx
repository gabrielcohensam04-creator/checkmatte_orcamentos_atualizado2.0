import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useUserContext } from '../context/UserContext';
import { light, dark } from '../tokens';

const Users = () => {
  const { isDark } = useTheme();
  const { sessionUser, updateProfileState } = useUserContext();
  const { SCLO, OV, ONS, ONSV, SEC, P, ERR } = isDark ? dark : light;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', cargo: '', role: 'Usuário' });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (user = null) => {
    setAvatarFile(null);
    if (user) {
      setEditingUser(user);
      setFormData({ nome: user.nome || '', email: user.email || '', cargo: user.cargo || '', role: user.role || 'Usuário' });
    } else {
      setEditingUser(null);
      setFormData({ nome: '', email: '', cargo: '', role: 'Usuário' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) return;

    try {
      const emailNormalizado = formData.email.toLowerCase().trim();
      let avatar_url = undefined;

      if (avatarFile && editingUser) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${editingUser.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = publicUrl;
      }

      if (editingUser) {
        const payload = { nome: formData.nome, cargo: formData.cargo, role: formData.role };
        if (avatar_url) payload.avatar_url = avatar_url;
        const { error: profileError } = await supabase.from('users').update(payload).eq('id', editingUser.id);
        if (profileError) throw profileError;
        if (sessionUser?.id === editingUser.id) { updateProfileState(payload); }
      } else {
        const { error: rpcError } = await supabase.rpc('criar_usuario_com_senha_padrao', {
          user_email: emailNormalizado,
          user_nome: formData.nome,
          user_cargo: formData.cargo,
          user_role: formData.role
        });
        if (rpcError) throw rpcError;
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Erro completo:", error);
      alert('Erro: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir usuário permanentemente?')) return;
    try {
      await supabase.from('users').delete().eq('id', id);
      fetchUsers();
    } catch (e) { alert('Erro ao excluir'); }
  };

  const UserCard = ({ user }) => (
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
        <p style={{ fontSize: 15, fontWeight: 600, color: ONS, marginBottom: 8 }}>{user.nome}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONSV, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>mail</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ONSV, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>work</span>
            <span>{user.cargo || '—'}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: ONSV, border: `1px solid ${OV}` }}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => handleOpenModal(user)}
          style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: '#93C5FD', color: '#1E3A8A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Editar
        </button>
        <button
          onClick={() => handleDelete(user.id)}
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
        <h2 className="column-header" style={{ margin: 0, border: 'none', padding: 0 }}>Usuários — {users.length}</h2>
        <button
          onClick={() => handleOpenModal()}
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#FFFFFF', color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
          title="Novo Usuário"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', color: ONSV, fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
          Carregando usuários…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {users.map(u => <UserCard key={u.id} user={u} />)}
          {users.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '48px 16px', textAlign: 'center', background: SCLO, border: `1px dashed ${OV}`, borderRadius: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: OV, display: 'block', marginBottom: 8 }}>group</span>
              <p style={{ fontSize: 14, color: ONSV }}>Nenhum usuário cadastrado.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDark ? '#1A1A1A' : '#fff', padding: 32, borderRadius: 16, width: '100%', maxWidth: 420, border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: ONS, marginBottom: 24 }}>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Nome</label>
                <input required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={editingUser !== null} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: editingUser ? 'rgba(0,0,0,0.05)' : 'transparent', color: ONS, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Cargo</label>
                <input value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: 'transparent', color: ONS, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Nível de Acesso</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${OV}`, background: isDark ? '#1A1A1A' : '#fff', color: ONS, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
                  <option value="Admin">Admin</option>
                  <option value="Usuário">Usuário</option>
                </select>
              </div>
              {editingUser && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ONSV, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Foto de Perfil</label>
                  <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ width: '100%', color: ONS, fontSize: 13 }} />
                </div>
              )}
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

export default Users;
