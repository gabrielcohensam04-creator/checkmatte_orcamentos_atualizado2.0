import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (session) => {
      try {
        if (mounted) setLoadingProfile(true);
        if (!session?.user) {
          if (mounted) {
            setSessionUser(null);
            setUserProfile(null);
            setLoadingProfile(false);
          }
          return;
        }

        if (mounted) setSessionUser(session.user);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('email', session.user.email)
          .maybeSingle();
          
        if (error) throw error;
        if (mounted) setUserProfile(data || null);

      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingProfile(false);
        }
      }
    };

    // 1. Busca a sessão atual quando a página carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session);
    });

    // 2. Fica ouvindo se o usuário logou ou deslogou
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateProfileState = (newData) => {
    setUserProfile((prev) => ({ ...prev, ...newData }));
  };

  return (
    <UserContext.Provider value={{ sessionUser, userProfile, loading, loadingProfile, updateProfileState }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
