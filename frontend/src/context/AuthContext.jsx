import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockConfig } from '../lib/supabase';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('researchly_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase user with backend MongoDB
  const syncWithBackend = async (supabaseUser, authToken) => {
    try {
      localStorage.setItem('researchly_token', authToken);
      setToken(authToken);

      const res = await authApi.sync({
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
        institution: supabaseUser.user_metadata?.institution || 'Academic Faculty / Researcher'
      });

      if (res.data && res.data.user) {
        setMongoUser(res.data.user);
      }
    } catch (err) {
      console.warn('Backend user sync warning:', err.message);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedDemo = localStorage.getItem('researchly_demo_user');
        const storedToken = localStorage.getItem('researchly_token');

        if (storedDemo && storedToken) {
          const parsed = JSON.parse(storedDemo);
          setUser(parsed);
          try {
            const meRes = await authApi.getMe();
            if (meRes.data?.user) setMongoUser(meRes.data.user);
          } catch (e) {
            console.warn('Fetch me fallback:', e.message);
          }
          setLoading(false);
          return;
        }

        if (!isMockConfig && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await syncWithBackend(session.user, session.access_token);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
              if (session?.user) {
                setUser(session.user);
                await syncWithBackend(session.user, session.access_token);
              } else {
                setUser(null);
                setMongoUser(null);
                setToken(null);
                localStorage.removeItem('researchly_token');
              }
            }
          );

          return () => subscription?.unsubscribe();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Standard Supabase Email/Password Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isMockConfig) {
        return loginAsDemo(email);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setUser(data.user);
        await syncWithBackend(data.user, data.session.access_token);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Standard Supabase Email/Password Registration
  const register = async (email, password, fullName, institution) => {
    setLoading(true);
    try {
      if (isMockConfig) {
        return loginAsDemo(email, fullName, institution);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            institution: institution || 'Stanford AI Institute'
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        setUser(data.user);
        await syncWithBackend(data.user, data.session.access_token);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Academic Login
  const loginAsDemo = async (email = 'elena.rostova@stanford.edu', name = 'Dr. Elena Rostova', institution = 'Stanford AI & NLP Lab') => {
    setLoading(true);
    try {
      const demoToken = `demo-token-${encodeURIComponent(email)}-${Date.now()}`;
      const demoUserObj = {
        id: `demo-${email.replace(/[@.]/g, '_')}`,
        email,
        user_metadata: {
          full_name: name,
          institution
        }
      };

      localStorage.setItem('researchly_token', demoToken);
      localStorage.setItem('researchly_demo_user', JSON.stringify(demoUserObj));
      setToken(demoToken);
      setUser(demoUserObj);

      await syncWithBackend(demoUserObj, demoToken);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (!isMockConfig && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      localStorage.removeItem('researchly_token');
      localStorage.removeItem('researchly_demo_user');
      setUser(null);
      setMongoUser(null);
      setToken(null);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const res = await authApi.updatePreferences(newPrefs);
      if (res.data?.user) {
        setMongoUser(res.data.user);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mongoUser,
        token,
        loading,
        login,
        register,
        loginAsDemo,
        logout,
        updatePreferences,
        isAuthenticated: !!user || !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
