import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080', 
    withCredentials: true, // Include cookies in requests
  });

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await axiosInstance.get('/auth'); 
        if (response.status === 200) {
          setUser(response.data); // Set the user based on the session data
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, [user, axiosInstance]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
