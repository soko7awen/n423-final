import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined: loading; null: signed out

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined, signOut: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
