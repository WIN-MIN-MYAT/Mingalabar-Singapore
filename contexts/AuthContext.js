import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  getProfile,
  updateProfile,
} from '../services/authService';
import supabaseClient from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const subscriptionRef = useRef(null);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        try {
          const userProfile = await getProfile(currentUser.id);
          setProfile(userProfile);
        } catch (err) {
          console.error('Failed to load profile:', err);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      await loadUser();
    };

    initAuth();

    try {
      const { data } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          console.log('Auth state changed:', event, !!session);

          if (event === 'TOKEN_REFRESHED' && !session) {
            await supabaseClient.auth.signOut();
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }

          if (session?.user) {
            setUser(session.user);
            setIsAuthenticated(true);
            try {
              const userProfile = await getProfile(session.user.id);
              setProfile(userProfile);
            } catch (err) {
              console.error('Failed to load profile:', err);
            }
          } else {
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
          }
          setLoading(false);
        }
      );
      subscriptionRef.current = data.subscription;
    } catch (error) {
      console.error('Auth subscription error:', error);
    }

    return () => {
      mounted = false;
      if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (error) {
          console.error('Unsubscribe error:', error);
        }
      }
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await signIn(email, password);
    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      try {
        const userProfile = await getProfile(data.user.id);
        setProfile(userProfile);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    return data;
  }, []);

  const register = useCallback(async (email, password, username, fullName) => {
    const data = await signUp(email, password, username, fullName);
    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      try {
        const userProfile = await getProfile(data.user.id);
        setProfile(userProfile);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    const updated = await updateProfile(user.id, updates);
    setProfile(updated);
    return updated;
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    userId: user?.id,
    login,
    register,
    logout,
    updateUserProfile,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;