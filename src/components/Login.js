import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './../Login.css';
import { useAuth } from './AuthContext';

function Login() {
  // State to control which form is displayed (login or register)
  const [activeForm, setActiveForm] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Login form state
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    role: 'admin', // Default role
    agreeToTerms: false
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Handle login form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle register form input changes
  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterData({
      ...registerData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  // Validate login form
  const validateLoginForm = () => {
    if (!credentials.email) {
      setError('Email is required');
      return false;
    }
    if (!credentials.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  // Validate register form
  const validateRegisterForm = () => {
    if (!registerData.name) {
      setError('Full name is required');
      return false;
    }
    if (!registerData.email) {
      setError('Email is required');
      return false;
    }
    if (!registerData.password) {
      setError('Password is required');
      return false;
    }
    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!registerData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setLoading(true);
    
    try {
      await login(credentials.email, credentials.password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle register form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    
    try {
      await register({
        name: registerData.name,
        email: registerData.email,
        company: registerData.company,
        password: registerData.password,
        role: registerData.role
      });
      
      // Auto login after registration
      await login(registerData.email, registerData.password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. This email may already be in use.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and register forms
  const showLoginForm = () => setActiveForm('login');
  const showRegisterForm = () => setActiveForm('register');

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <h1>SmartInvoice</h1>
          <p>The smarter way to manage your invoices</p>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-container">
          <h2>{activeForm === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <p className="login-intro">
            {activeForm === 'login'
              ? 'Welcome back! Please login to your account.'
              : 'Join SmartInvoice to streamline your invoicing process.'}
          </p>
          
          {error && <div className="error-message">{error}</div>}
          
          {activeForm === 'login' ? (
            // Login Form
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={handleLoginChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <div className="password-label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                </div>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleLoginChange}
                  />
                </div>
              </div>
              
              <div className="remember-me">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMe}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
              </div>
              
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <div className="login-footer">
                <p>Don't have an account? <button type="button" onClick={showRegisterForm} className="toggle-form-btn">Sign up</button></p>
                <p className="demo-credentials">
                  <small>For demo: Email: demo@example.com, Password: password</small>
                </p>
              </div>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegisterSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="register-name">Full Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    placeholder="Enter your full name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="register-company">Company Name (Optional)</label>
                <div className="input-with-icon">
                  <i className="fas fa-building"></i>
                  <input
                    type="text"
                    id="register-company"
                    name="company"
                    placeholder="Enter your company name"
                    value={registerData.company}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    id="register-password"
                    name="password"
                    placeholder="Create a password (min. 8 characters)"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="register-confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    id="register-confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="register-role">Your Role</label>
                <div className="select-with-icon">
                  <i className="fas fa-user-tag"></i>
                  <select
                    id="register-role"
                    name="role"
                    value={registerData.role}
                    onChange={handleRegisterChange}
                    style={{textIndent: '25px'}} // Inline style for extra indent
                  >
                    <option value="admin">&nbsp;&nbsp;&nbsp;Business Owner/Admin</option>
                    <option value="accountant">&nbsp;&nbsp;&nbsp;Accountant</option>
                    <option value="staff">&nbsp;&nbsp;&nbsp;Staff Member</option>
                  </select>
                </div>
              </div>
              
              <div className="terms-agreement">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={registerData.agreeToTerms}
                    onChange={handleRegisterChange}
                  />
                  <span className="checkmark"></span>
                  I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                </label>
              </div>
              
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              
              <div className="login-footer">
                <p>Already have an account? <button type="button" onClick={showLoginForm} className="toggle-form-btn">Sign in</button></p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;