import React, { createContext, useContext, useEffect, useState } from 'react';

// Create the authentication context
const AuthContext = createContext();

const API_URL = 'http://localhost:4000/api/auth';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authType, setAuthType] = useState('');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const authKey = localStorage.getItem('auth_type');
      const storedToken = localStorage.getItem('token');
      
      if (authKey && storedToken) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            setToken(storedToken);
            setIsAuthenticated(true);
            setAuthType(authKey);
          } catch (e) {
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
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      throw new Error('Invalid response from server');
    }

    const { token: newToken, user } = responseData.data;
    
    // Store authentication data
    const authKey = rememberMe ? 'persistent' : 'temporary';
    localStorage.setItem('auth_type', authKey);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    setCurrentUser(user);
    setToken(newToken);
    setIsAuthenticated(true);
    setAuthType(authKey);
    return user;
  } catch (error) {
    throw error;
  }
};

// Register function
const register = async (userData) => {
  try {
    // Call the backend signup API
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: userData.role,
        avatar: userData.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
      })
    });


    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      throw new Error('Invalid response from server');
    }

    return responseData.data;
  } catch (error) {
    throw error;
  }
};

// Logout function
  const logout = () => {
    localStorage.removeItem('auth_type');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setAuthType('');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      // Call the backend to update the profile (assuming the endpoint exists)
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const responseData = await response.json();
      
      // Update local storage and state
      const updatedUser = { ...currentUser, ...responseData.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      return updatedUser;
    }
  };

  const isTokenValid = async () => {
    // If there's no token, return false
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/validate-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If response is ok, token is valid
      return response.ok;
    } catch (error) {
      
      // Fallback to checking if token exists in localStorage
      return !!localStorage.getItem('token');
    }
  };

  // Function to get the auth header for API requests
  const getAuthHeader = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    currentUser,
    isAuthenticated,
    authType,
    token,
    login,
    register,
    logout,
    updateProfile,
    isTokenValid,
    getAuthHeader
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;