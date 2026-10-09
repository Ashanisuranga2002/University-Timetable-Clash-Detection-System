import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const CoordinatorAuthContext = createContext(null);

export function CoordinatorAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('current_admin_user');
    await AsyncStorage.removeItem('saved_user_id');
    await AsyncStorage.removeItem('saved_password');
    router.replace('/');
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('current_admin_user').then(userData => {
      if (!active) return;
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    setMessage('Sign in from the main login screen.');
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    message,
    clearMessage: () => setMessage(''),
    signIn,
    signOut
  }), [user, loading, message, signIn, signOut]);

  return <CoordinatorAuthContext.Provider value={value}>{children}</CoordinatorAuthContext.Provider>;
}

export function useCoordinatorAuth() {
  const context = useContext(CoordinatorAuthContext);
  if (!context) throw new Error('useCoordinatorAuth must be used inside CoordinatorAuthProvider.');
  return context;
}
