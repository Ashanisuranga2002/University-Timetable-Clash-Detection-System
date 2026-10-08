import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken, setUnauthorizedHandler } from './api';
import { clearSession, readSession } from './sessionStorage';
const CoordinatorAuthContext = createContext(null);
export function CoordinatorAuthProvider({
  children
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const signOut = useCallback(async () => {
    setAccessToken(undefined);
    setUser(null);
    await clearSession();
  }, []);
  useEffect(() => {
    let active = true;
    void readSession().then(session => {
      if (!active) return;
      if (session) {
        setAccessToken(session.token);
        setUser(session.user);
      }
      setLoading(false);
    });
    setUnauthorizedHandler(() => {
      setMessage('Your coordinator session expired. Please sign in again.');
      void signOut();
    });
    return () => {
      active = false;
      setUnauthorizedHandler(undefined);
    };
  }, [signOut]);
  const signIn = useCallback(async (studentId, password, persist = true) => {
    const result = await api.login(studentId, password, persist);
    setUser(result.user);
    setMessage('');
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
