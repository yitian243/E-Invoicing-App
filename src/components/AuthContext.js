import React, { createContext, useContext, useEffect, useState } from 'react';

// Create the authentication context
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authType, setAuthType] = useState(''); // 'persistent' or 'temporary'

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = () => {
      const authKey = localStorage.getItem('auth_type');
      if (authKey) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            setIsAuthenticated(true);
            setAuthType(authKey);
          } catch (e) {
            console.error('Error parsing user data', e);
            logout();
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password, rememberMe) => {
    // change to fetch from sql database
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userMatch = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!userMatch || userMatch.password !== password) {
      throw new Error('Invalid credentials');
    }

    const user = {
      name: userMatch.name,
      email: userMatch.email,
      role: userMatch.role,
      avatar: userMatch.avatar || 'https://i.pravatar.cc/150?img=68'
    };
    
    const authKey = rememberMe ? 'persistent' : 'temporary';
    localStorage.setItem('auth_type', authKey);
    localStorage.setItem('user', JSON.stringify(user));
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthType(authKey);
    return user;
  };

  // Register function
  const register = async (userData) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return newUser;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_type');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthType('');
  };

  // Update user profile
  const updateProfile = (userData) => {
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  // Check if auth is valid
  const isTokenValid = () => {
    const authKey = localStorage.getItem('auth_type');
    return !!authKey;
  };

  const value = {
    currentUser,
    isAuthenticated,
    authType,
    login,
    register,
    logout,
    updateProfile,
    isTokenValid
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;