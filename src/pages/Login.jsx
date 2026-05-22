import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const Login = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  // Mantemos o P para o botão primário
  const { P } = isDark ? dark : light;

  // Cores dinâmicas com alto contraste baseadas no fundo da logo
  const pageBg = isDark ? '#000000' : '#FFFFFF';
  const cardBg = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const mutedText = isDark ? '#A1A1AA' : '#52525B';
  const borderColor = isDark ? '#27272A' : '#E4E4E7';
  const inputBg = isDark ? '#000000' : '#FAFAFA';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const emailNormalizado = email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password
      });

      if (error) {
        throw error;
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg('E-mail ou senha incorretos. Tente novamente.');
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
      backgroundColor: '#000000',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: cardBg,
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.0)' : '0 10px 25px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '420px',
        border: `1px solid ${borderColor}`,
        boxSizing: 'border-box'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src={isDark ? "/logo_FUNDOPRETO.png" : "/logo_FUNDOBRANCO.png"}
            alt="CheckMatte"
            style={{ height: '56px', objectFit: 'contain', marginBottom: '16px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1 style={{ display: 'none', fontSize: '24px', fontWeight: 800, color: textColor, letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
            CheckMatte
          </h1>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: mutedText, margin: 0 }}>
            Acesse sua conta
          </h2>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, textTransform: 'uppercase', marginBottom: '8px' }}>
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
                border: `1px solid ${borderColor}`,
                backgroundColor: inputBg,
                color: textColor,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = P}
              onBlur={(e) => e.target.style.borderColor = borderColor}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, textTransform: 'uppercase', marginBottom: '8px' }}>
              Senha
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
                border: `1px solid ${borderColor}`,
                backgroundColor: inputBg,
                color: textColor,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = P}
              onBlur={(e) => e.target.style.borderColor = borderColor}
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/primeiro-acesso" style={{ fontSize: 13, color: '#E8193C', textDecoration: 'none', fontWeight: 500 }}>
            Primeiro acesso? Crie sua senha aqui
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;
