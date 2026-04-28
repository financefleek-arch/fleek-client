// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'fleek_auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);   // null = loading, false = logged out
  const [loading, setLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setToken(parsed.token);
          setAuth(parsed);
        } else {
          setAuth(false);
        }
      } catch {
        setAuth(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (data) => {
    const session = {
      token:               data.token,
      role:                data.role,
      name:                data.name,
      familyId:            data.family_id,
      memberId:            data.member_id,
      allowPasswordChange: data.allow_password_change !== false,
    };
    setToken(session.token);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
    setAuth(session);
  };

  const signOut = async () => {
    setToken(null);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setAuth(false);
  };

  return (
    <AuthContext.Provider value={{ auth, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
