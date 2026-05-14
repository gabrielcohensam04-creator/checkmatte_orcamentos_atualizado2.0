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

  // Exemplo de dados solicitados pelo usuário para o perfil
  const userDisplay = {
    name: userProfile?.nome || 'Douglas Da Silva',
    role: userProfile?.cargo || 'dono',
    photo: null // Pode ser expandido futuramente
  };

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

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Histórico', path: '/historico' },
    { name: 'Empresas', path: '/empresas' },
    { name: 'Usuários', path: '/usuarios' },
  ];

  return (
    <header className="sticky top-0 w-full bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 z-[100] px-6 py-4 flex items-center justify-between">
      {/* LOGO */}
      <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
        <Logo style={{ height: '32px' }} />
      </div>

      {/* NAVEGAÇÃO DESKTOP */}
      <nav className="hidden md:flex items-center gap-10 ml-auto mr-12">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/'}
            className={({ isActive }) => `relative py-2 text-sm font-medium transition-colors hover:text-slate-900 dark:hover:text-white ${
              isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            {({ isActive }) => (
              <>
                {link.name}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#E8193C] transition-all duration-300 ease-in-out ${
                    isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* USUÁRIO & TEMA DESKTOP */}
      <div className="hidden md:flex items-center gap-4 border-l border-slate-100 dark:border-zinc-800 pl-6">
        <div className="text-right">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
            {userDisplay.name}
          </p>
          <p className="text-[10px] font-bold text-[#E8193C] uppercase tracking-wider">
            {userDisplay.role}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>

      {/* MENU HAMBÚRGUER (MOBILE) */}
      <button 
        className="md:hidden p-2 text-slate-600 dark:text-zinc-300" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* DROPDOWN MOBILE */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-900 z-[200] shadow-2xl border-t border-slate-50 dark:border-zinc-800 flex flex-col md:hidden animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <NavLink 
                key={link.path} 
                to={link.path}
                end={link.path === '/'} 
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `text-lg font-medium transition-colors ${
                  isActive ? 'text-[#E8193C]' : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                {link.name}
              </NavLink>
            ))}
          </div>
          
          {/* PERFIL MOBILE NO RODAPÉ DO MENU */}
          <div className="mt-auto border-t border-slate-50 dark:border-zinc-800 p-6 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-slate-600 dark:text-zinc-300 overflow-hidden">
                {userDisplay.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                  {userDisplay.name}
                </p>
                <p className="text-xs font-bold text-[#E8193C] uppercase mt-1">
                  {userDisplay.role}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={toggle} className="p-2 text-slate-400">
                <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
              </button>
              <button onClick={handleLogout} className="p-2 text-red-400">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay mobile */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 top-[73px] bg-black/10 backdrop-blur-sm z-[150] md:hidden" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
