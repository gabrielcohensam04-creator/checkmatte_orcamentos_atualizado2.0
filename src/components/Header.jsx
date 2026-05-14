import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUserContext } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const { userProfile, loadingProfile } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Fecha o menu ao mudar de rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login'); 
    } catch (error) {
      console.error('Erro ao sair:', error.message);
    }
  };

  return (
    <header 
      className="relative w-full bg-[var(--surface-header)] border-b border-[var(--outline-variant)] z-[100]"
      style={{ 
        padding: '12px 16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}
    >
      {/* LINHA 1: Logo | Ícones */}
      <div className="flex items-center justify-between w-full">
        {/* LOGO */}
        <div className="shrink-0">
          <Logo style={{ height: '36px' }} />
        </div>

        {/* ÍCONES AGROUPADOS (Tema + Logout + Menu) */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={toggle}
            className="p-1.5 text-[var(--on-surface-variant)] bg-transparent border-none outline-none hover:bg-[rgba(0,0,0,0.05)] rounded transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="p-1.5 text-[var(--on-surface-variant)] bg-transparent border-none outline-none hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          </button>

          <button 
            className="p-1.5 text-[var(--on-surface)] bg-transparent border-none outline-none hover:bg-[rgba(0,0,0,0.05)] rounded flex sm:hidden items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* LINHA 2 (Mobile) / Nav Desktop */}
      <div className="flex flex-row items-center justify-between sm:justify-end">
        {/* Desktop Nav - Oculto no mobile */}
        <nav className="hidden sm:flex items-center gap-8 mr-auto">
          <NavLink to="/" end className={({ isActive }) => `text-[14px] font-medium transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'}`}>Dashboard</NavLink>
          <NavLink to="/historico" className={({ isActive }) => `text-[14px] font-medium transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'}`}>Histórico</NavLink>
          <NavLink to="/empresas" className={({ isActive }) => `text-[14px] font-medium transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'}`}>Empresas</NavLink>
          <NavLink to="/usuarios" className={({ isActive }) => `text-[14px] font-medium transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'}`}>Usuários</NavLink>
        </nav>

        {/* NOME E CARGO (Alinhados à direita no mobile) */}
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#888888' : '#6B6B6B' }}>
            {loadingProfile ? 'Carregando...' : userProfile?.nome || 'Usuário'}
          </div>
          <div style={{ fontSize: '11px', color: isDark ? '#666666' : '#999999', opacity: 0.8 }}>
            {userProfile?.cargo || userProfile?.role || ''}
          </div>
        </div>
      </div>

      {/* MENU DROPDOWN MOBILE */}
      {isMenuOpen && (
        <div 
          className="absolute top-[100%] left-0 w-full bg-[var(--surface-header)] border-t border-[var(--outline-variant)] shadow-xl z-[200] sm:hidden py-2"
        >
          <NavLink to="/" end className="flex px-6 py-4 text-[16px] font-medium text-[var(--on-surface)] hover:bg-[rgba(0,0,0,0.05)] border-b border-[var(--outline-variant)] last:border-0">Dashboard</NavLink>
          <NavLink to="/historico" className="flex px-6 py-4 text-[16px] font-medium text-[var(--on-surface)] hover:bg-[rgba(0,0,0,0.05)] border-b border-[var(--outline-variant)] last:border-0">Histórico</NavLink>
          <NavLink to="/empresas" className="flex px-6 py-4 text-[16px] font-medium text-[var(--on-surface)] hover:bg-[rgba(0,0,0,0.05)] border-b border-[var(--outline-variant)] last:border-0">Empresas</NavLink>
          <NavLink to="/usuarios" className="flex px-6 py-4 text-[16px] font-medium text-[var(--on-surface)] hover:bg-[rgba(0,0,0,0.05)] border-b border-[var(--outline-variant)] last:border-0">Usuários</NavLink>
        </div>
      )}

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-[190] sm:hidden" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
