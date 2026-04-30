import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, refreshToken } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Verify token is still valid by fetching user profile
          await getUserProfile();
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Auto refresh token before it expires
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user
        logout();
      }
    }, 6 * 60 * 60 * 1000); // Refresh every 6 hours (tokens expire in 7 days)

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};