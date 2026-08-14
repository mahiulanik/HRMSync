import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      api.get('/session')
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role_type) => {
    const { data } = await api.post('/login', {
      email,
      password,
      role_type
    });

    // Only access token is stored in localStorage
    // Refresh token is stored by backend as HttpOnly cookie
    localStorage.setItem('accessToken', data.accessToken);

    const session = await api.get('/session');

    setUser(session.data.user);

    return session.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {}

    // Only remove access token
    // Refresh token is cleared by backend /logout
    localStorage.removeItem('accessToken');

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);