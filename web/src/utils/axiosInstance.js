import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const useAxios = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080', // Backend base URL
    withCredentials: true, // Include cookies in requests
  });

  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // Handle session expiration
        if (auth && auth.setUser) {
          auth.setUser(null);
          localStorage.removeItem('user');
        }
        navigate('/login', {
          state: {
            from: location,
            message: 'Your session has expired. Please log in again.',
          },
        });
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
