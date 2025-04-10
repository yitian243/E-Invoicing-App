import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authType, setAuthType] = useState('');
  const [token, setToken] = useState(null);

  // Helper function to get storage based on auth type
  const getStorage = useCallback((type) => {
    return type === 'persistent' ? localStorage : sessionStorage;
  }, []);

  // Clear auth state function with server-side logout
  const logout = useCallback(async () => {
    const authKey = localStorage.getItem('auth_type');
    const storage = authKey ? getStorage(authKey) : null;
    const currentToken = storage ? storage.getItem('token') : null;
    
    // Call API to invalidate token on the server
    if (currentToken) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          }
        });
        
        if (!response.ok) {
          await response.json().catch(() => null);
        }
      } catch (error) {
        // logout regardless of server response
      }
    }
    
    localStorage.removeItem('auth_type');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setAuthType('');
    
    console.log('Client-side logout completed');
  }, [getStorage]);

  // Token validation
  const isTokenValid = useCallback(async (tokenToValidate) => {
    if (!tokenToValidate) return false;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/validate-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  // Check authentication on load and validate token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authKey = localStorage.getItem('auth_type');
        if (!authKey) {
          setLoading(false);
          return;
        }
        
        const storage = getStorage(authKey);
        const storedToken = storage.getItem('token');
        
        if (!storedToken) {
          setLoading(false);
          return;
        }
        
        // Validate the token with the server
        const valid = await isTokenValid(storedToken);
        
        if (!valid) {
          await logout();
          setLoading(false);
          return;
        }
        
        // Token is valid, load user data
        const userStr = storage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            setToken(storedToken);
            setIsAuthenticated(true);
            setAuthType(authKey);
          } catch (e) {
            await logout();
          }
        } else {
          await logout();
        }
      } catch (error) {
        await logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [logout, getStorage, isTokenValid]);

  const updateAuthState = useCallback((user, newToken, authKey = 'temporary') => {
    localStorage.setItem('auth_type', authKey);
    const storage = getStorage(authKey);
    
    storage.setItem('token', newToken);
    storage.setItem('user', JSON.stringify(user));
    
    setCurrentUser(user);
    setToken(newToken);
    setIsAuthenticated(true);
    setAuthType(authKey);
    
    return user;
  }, [getStorage]);

  const value = {
    currentUser,
    isAuthenticated,
    authType,
    token,
    loading,
    logout,
    updateAuthState,
    isTokenValid,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}