import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { light, dark } from '../tokens';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  
  const { P } = isDark ? dark : light;

  // Cores dinâmicas combinando exatamente com o design invisível do login
  const pageBg = isDark ? '#000000' : '#FFFFFF';
  const cardBg = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const mutedText = isDark ? '#A1A1AA' : '#52525B';
  const borderColor = isDark ? '#27272A' : '#E4E4E7';
  const inputBg = isDark ? '#000000' : '#FAFAFA';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // O Supabase retorna os erros no hash da URL quando há problemas no fluxo de redefinição
    // Ex: #error=access_denied&error_code=otp_expired...
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');

    if (error) {
      if (errorCode === 'otp_expired') {
        setErrorMsg('O link expirou ou é inválido. Solicite um novo.');
      } else {
        setErrorMsg(errorDescription || 'Ocorreu um erro ao validar seu link. Tente novamente.');
      }
    }
  }, [location]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Atualiza a senha do usuário atualmente autenticado pela sessão de redefinição
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMsg('Senha atualizada com sucesso! Redirecionando...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      if (err.message === 'Auth session missing!') {
        setErrorMsg('O link expirou ou é inválido. Solicite um novo.');
      } else {
        setErrorMsg(err.message || 'Erro ao atualizar a senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: pageBg,
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
            Redefinir Senha
          </h2>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          {successMsg && (
            <div style={{
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#DCFCE7',
              color: '#22C55E',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'center',
              border: `1px solid rgba(34, 197, 94, 0.2)`
            }}>
              {successMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, textTransform: 'uppercase', marginBottom: '8px' }}>
              Nova Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                disabled={!!successMsg || !!errorMsg.includes('expirou')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 44px 0 16px',
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
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 'none', background: 'transparent', color: mutedText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, textTransform: 'uppercase', marginBottom: '8px' }}>
              Confirmar Nova Senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={!!successMsg || !!errorMsg.includes('expirou')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={loading || !!successMsg || !!errorMsg.includes('expirou')}
            style={{
              marginTop: '8px',
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: (loading || !!successMsg) ? '#FCA5A5' : P,
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: (loading || !!successMsg || !!errorMsg.includes('expirou')) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 13, color: '#E8193C', textDecoration: 'none', fontWeight: 500 }}>
            Voltar para o Login
          </a>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
