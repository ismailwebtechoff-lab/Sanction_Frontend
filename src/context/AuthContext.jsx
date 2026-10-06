import { createContext, useContext, useState, useEffect } from 'react';
import API from '../axios/axios';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { userId, role }
  const [loading, setLoading] = useState(true);
 

  const fetchUser = async () => {
    try {
      const res = await API.get('/user/check', { withCredentials: true }); // adjust path if needed
      setUser(res.data); // { userId, role }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (userData) => {
    setUser(userData); // optional manual login update
  };

  const logout = async () => {
    await API.post('/user/logout', {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy use
export const useAuth = () => useContext(AuthContext);