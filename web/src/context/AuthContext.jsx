import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    console.log("Initial stored user data:", storedUser);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
  });

  useEffect(() => {
    const verifySession = async () => {
      try {
        console.log("Starting session verification...");
        const response = await axiosInstance.get('/auth');
        console.log("Raw auth response:", response);
        console.log("Auth verification data:", response.data);
        
        if (response.status === 200) {
          const storedUser = JSON.parse(localStorage.getItem('user')) || {};
          const verifiedUserData = {
            ...storedUser,           
            ...response.data,        
          };
          
          console.log("Setting verified user data:", verifiedUserData);
          setUser(verifiedUserData);
          localStorage.setItem('user', JSON.stringify(verifiedUserData));
          
          console.log("Verification completed. Checking localStorage:", 
            JSON.parse(localStorage.getItem('user'))
          );
        } else {
          console.log("Verification failed with status:", response.status);
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error("Verification error details:", error);
        if (error.response) {
          console.error("Error response:", error.response);
        }
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
  }, []); 

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
