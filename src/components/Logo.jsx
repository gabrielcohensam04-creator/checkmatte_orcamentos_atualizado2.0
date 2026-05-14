import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Logo = ({ style, className }) => {
  const { isDark } = useTheme();
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentIsDark, setCurrentIsDark] = useState(isDark);

  useEffect(() => {
    if (isDark !== currentIsDark) {
      setIsSwitching(true);
      const timer = setTimeout(() => {
        setCurrentIsDark(isDark);
        setIsSwitching(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isDark, currentIsDark]);

  return (
    <div style={{ backgroundColor: currentIsDark ? '#000000' : '#FFFFFF', display: 'inline-block' }}>
      <img 
        src={currentIsDark 
          ? "/logo_FUNDOPRETO.png"
          : "/logo_FUNDOBRANCO.png"
        }
        alt="Checkmatte"
        className={`logo ${isSwitching ? 'switching' : ''} ${className || ''}`}
        style={{ 
          height: '48px', 
          width: 'auto', 
          display: 'block',
          transition: 'opacity 0.4s ease',
          opacity: isSwitching ? 0 : 1,
          ...style 
        }}
      />
    </div>
  );
};

export default Logo;
