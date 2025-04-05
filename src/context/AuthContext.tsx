import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserChatHistory } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadChatHistory: () => Promise<any[]>;
};

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    session: null,
    loading: true,
    error: null,
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setState({ session, loading: false, error: error?.message || null });
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, loading: false, error: null });
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setState({ ...state, loading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setState({ ...state, loading: false, error: error.message });
      }
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
    }
  };

  const signIn = async (email: string, password: string) => {
    setState({ ...state, loading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setState({ ...state, loading: false, error: error.message });
      }
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
    }
  };

  const signOut = async () => {
    setState({ ...state, loading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setState({ ...state, loading: false, error: error.message });
      }
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
    }
  };

  const loadChatHistory = async () => {
    if (!user) return [];
    return await getUserChatHistory(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: state.session,
        loading: state.loading,
        error: state.error,
        signUp,
        signIn,
        signOut,
        loadChatHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 