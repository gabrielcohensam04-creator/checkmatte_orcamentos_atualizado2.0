import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUserContext } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const { userProfile } = useUserContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="global-header">
      <div className="header-left">
        <Logo />
      </div>

      <div className="header-center">
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/historico" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Histórico
          </NavLink>
          <NavLink to="/metricas" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Métricas
          </NavLink>
          <NavLink to="/empresas" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Empresas
          </NavLink>
          <NavLink to="/usuarios" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Usuários
          </NavLink>
        </nav>
      </div>

      <div className="header-right">
        <div className="user-info">
          <span className="user-name">{userProfile?.nome || '—'}</span>
          <span className="user-role">{userProfile?.cargo || '—'}</span>
        </div>
        <button onClick={toggle} title={isDark ? 'Modo claro' : 'Modo escuro'} className="icon-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button onClick={handleLogout} title="Sair" className="icon-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>logout</span>
        </button>
        <button className="hamburger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
