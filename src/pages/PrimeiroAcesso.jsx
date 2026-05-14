import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const PrimeiroAcesso = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  // Utilizando as cores do tema padrão
  const { SCLO, ONS, ONSV, SEC, P, OV } = isDark ? dark : light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFirstAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const emailNormalizado = email.toLowerCase().trim();

      // 1. Verifica se o admin cadastrou o perfil
      const { data: profile, error: profileSelectError } = await supabase.from('users').select('email').ilike('email', emailNormalizado).maybeSingle();
      
      if (!profile) {
        throw new Error('Este e-mail não foi cadastrado pelo administrador.');
      }

      // 2. Cria a conta no Auth
      const { data, error: signUpError } = await supabase.auth.signUp({ email: emailNormalizado, password });
      if (signUpError) throw signUpError;

      // Sucesso! O App.jsx já vai detectar a sessão e redirecionar
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: isDark ? '#0A0A0A' : '#F9FAFB',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: SCLO,
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '420px',
        border: `1px solid ${isDark ? '#3A3A3A' : '#E5E7EB'}`,
        boxSizing: 'border-box'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Fallback de logo baseando-se no que vimos na public folder */}
          <img 
            src={isDark ? "/logo_FUNDOPRETO.png" : "/logo_FUNDOBRANCO.png"} 
            alt="CheckMatte" 
            style={{ height: '56px', objectFit: 'contain', marginBottom: '16px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1 style={{ display: 'none', fontSize: '24px', fontWeight: 800, color: ONS, letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
            CheckMatte
          </h1>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: SEC, margin: 0 }}>
            Primeiro Acesso
          </h2>
          <p style={{ fontSize: '13px', color: ONSV, marginTop: '8px', lineHeight: 1.4 }}>
            Crie sua senha para acessar o sistema. O e-mail deve ter sido previamente cadastrado pelo administrador.
          </p>
        </div>

        <form onSubmit={handleFirstAccess} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
              color: '#EF4444',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'center',
              border: `1px solid rgba(239, 68, 68, 0.2)`
            }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: SEC, textTransform: 'uppercase', marginBottom: '8px' }}>
              E-mail
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px',
                borderRadius: '8px',
                border: `1px solid ${OV}`,
                backgroundColor: 'transparent',
                color: ONS,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = P}
              onBlur={(e) => e.target.style.borderColor = OV}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: SEC, textTransform: 'uppercase', marginBottom: '8px' }}>
              Nova Senha
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px',
                borderRadius: '8px',
                border: `1px solid ${OV}`,
                backgroundColor: 'transparent',
                color: ONS,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = P}
              onBlur={(e) => e.target.style.borderColor = OV}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading ? '#FCA5A5' : P,
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Criando conta...' : 'Criar Senha'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 13, color: ONSV, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = P} onMouseLeave={e => e.target.style.color = ONSV}>
            Voltar para o Login
          </a>
        </div>

      </div>
    </div>
  );
};

export default PrimeiroAcesso;
