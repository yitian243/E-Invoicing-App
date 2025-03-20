import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './../Signup.css';

function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    company: '',
    businessPassword: '',
    agreeToTerms: false
  });

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.company && !formData.businessPassword) {
      setError('Business password is required when joining a company');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleBusinessCreation = async (newUser) => {
    const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');
    
    if (formData.company) {
      const businessExists = businesses.some(b => b.name === formData.company);
      
      if (businessExists) {
        if (formData.role === 'admin') {
          throw new Error('A business with this name already exists');
        }
        
        // Join existing business
        const business = businesses.find(b => b.name === formData.company);
        if (!business.password) {
          throw new Error('Business requires a password to join');
        }
        if (formData.businessPassword !== business.password) {
          throw new Error('Invalid business password');
        }
        
        business.members.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: formData.role,
          joined_at: new Date().toISOString()
        });
        
        localStorage.setItem('businesses', JSON.stringify(
          businesses.map(b => b.name === formData.company ? business : b)
        ));
      } else {
        if (formData.role !== 'admin') {
          throw new Error('Business does not exist. Only admins can create new businesses.');
        }
        
        // Create new business
        const newBusiness = {
          id: `business_${Date.now()}`,
          name: formData.company,
          password: formData.businessPassword || '',
          email: newUser.email,
          tax_id: '',
          address: '',
          default_currency: 'AUD',
          admin_id: newUser.id,
          members: [{
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: 'admin',
            joined_at: new Date().toISOString()
          }]
        };
        
        businesses.push(newBusiness);
        localStorage.setItem('businesses', JSON.stringify(businesses));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) return;
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // Improved email check
      const emailExists = users.some(user => {
        const existingEmail = user.email.toLowerCase().trim();
        const newEmail = formData.email.toLowerCase().trim();
        return existingEmail === newEmail;
      });

      if (emailExists) {
        setError('Email already registered');
        return;
      }

      console.log('Email check passed - proceeding with registration');
      setLoading(true);

      const newUser = await register({
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role
      });

      if (formData.company) {
        await handleBusinessCreation(newUser);
      }

      // Auto login after registration
      await login(formData.email, formData.password, true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="login-brand">
          <h1>SmartInvoice</h1>
          <p>The smarter way to manage your invoices</p>
        </div>
      </div>
      
      <div className="signup-right">
        <div className="signup-form-container">
          <h2>Create Account</h2>
          <p className="signup-intro">Join SmartInvoice to streamline your invoicing process.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInput}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInput}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInput}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInput}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInput}
                required
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="company">Company (Optional)</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInput}
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessPassword">Business Password</label>
              <input
                type="password"
                id="businessPassword"
                name="businessPassword"
                value={formData.businessPassword}
                onChange={handleInput}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInput}
                  required
                />
                I agree to the terms and conditions
              </label>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;