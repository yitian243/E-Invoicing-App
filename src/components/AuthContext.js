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

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (token) {
        // Get user from storage
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            setIsAuthenticated(true);
          } catch (e) {
            console.error('Error parsing user data', e);
            logout(); // Clear invalid data
          }
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password, rememberMe) => {
    // In a real app, you would make an API call here and get a token
    // This is just a simple implementation for demo purposes
    
    // For demo - simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Demo credentials check
        if (email === 'demo@example.com' && password === 'password') {
          const user = {
            name: 'John Doe',
            email: email,
            role: 'Admin',
            avatar: 'https://i.pravatar.cc/150?img=68'
          };

          const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
          
          // Store in appropriate storage based on remember me
          if (rememberMe) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            sessionStorage.setItem('auth_token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
          }
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          resolve(user);
        } else {
          // Check if this user exists in our "users" localStorage collection
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const userMatch = users.find(u => u.email === email);
          
          if (userMatch && userMatch.password === password) {
            // Create user session
            const user = {
              name: userMatch.name,
              email: userMatch.email,
              role: userMatch.role,
              company: userMatch.company,
              avatar: userMatch.avatar || 'https://i.pravatar.cc/150?img=68'
            };
            
            const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
            
            // Store in appropriate storage based on remember me
            if (rememberMe) {
              localStorage.setItem('auth_token', token);
              localStorage.setItem('user', JSON.stringify(user));
            } else {
              sessionStorage.setItem('auth_token', token);
              sessionStorage.setItem('user', JSON.stringify(user));
            }
            
            setCurrentUser(user);
            setIsAuthenticated(true);
            resolve(user);
          } else {
            reject(new Error('Invalid email or password'));
          }
        }
      }, 1000);
    });
  };

  // Register function
  const register = async (userData) => {
    // In a real app, you would make an API call to register the user
    
    // For demo - simulate API call and store in localStorage
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Get existing users
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          // Check if email already exists
          const existingUser = users.find(user => user.email === userData.email);
          if (existingUser) {
            reject(new Error('Email already in use'));
            return;
          }
          
          // Create new user with ID
          const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            password: userData.password, // In a real app, this would be hashed on the server
            role: userData.role || 'Admin',
            company: userData.company || '',
            avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            createdAt: new Date().toISOString()
          };
          
          // Add to users array
          users.push(newUser);
          
          // Save to localStorage
          localStorage.setItem('users', JSON.stringify(users));
          
          // Generate token for immediate login if needed
          const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
          
          // Return user without password
          const { password, ...userWithoutPassword } = newUser;
          resolve(userWithoutPassword);
        } catch (error) {
          console.error('Registration error:', error);
          reject(error);
        }
      }, 1500);
    });
  };

  // Logout function
  const logout = () => {
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = (userData) => {
    const updatedUser = { ...currentUser, ...userData };
    
    // Update storage
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    setCurrentUser(updatedUser);
  };

  // Check if auth token has expired (in a real app, you would verify JWT expiration)
  const isTokenValid = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return !!token; // For demo purposes, just check if token exists
  };

  const value = {
    currentUser,
    isAuthenticated,
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