import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Logo = ({ style, className }) => {
  const { isDark, isTransitioning } = useTheme();

  return (
    <div style={{ display: 'inline-block', overflow: 'hidden' }}>
      {/* Dark logo */}
      <img
        src="/logo_FUNDOPRETO.png"
        alt="Checkmatte"
        style={{
          height: '48px',
          width: 'auto',
          display: 'block',
          position: isDark ? 'static' : 'absolute',
          opacity: isDark ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isDark ? 'auto' : 'none',
          ...style
        }}
        className={className}
      />
      {/* Light logo */}
      <img
        src="/logo_FUNDOBRANCO.png"
        alt="Checkmatte"
        style={{
          height: '48px',
          width: 'auto',
          display: 'block',
          position: isDark ? 'absolute' : 'static',
          opacity: isDark ? 0 : 1,
          transition: 'opacity 0.3s ease',
          pointerEvents: isDark ? 'none' : 'auto',
          ...style
        }}
        className={className}
      />
    </div>
  );
};

export default Logo;
