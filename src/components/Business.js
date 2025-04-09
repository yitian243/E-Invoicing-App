import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../styles/Business.css';

function Business() {
  const [isEditing, setIsEditing] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [error, setError] = useState('');
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  
  const [businessData, setBusinessData] = useState({
    id: '',
    name: '',
    tax_id: '',
    address: '',
    email: '',
    default_currency: 'AUD',
    invoice_template: 'default',
    admin_id: '',
    members: [],
    password: ''
  });

  const [joinData, setJoinData] = useState({
    businessName: '',
    password: ''
  });

  useEffect(() => {
    const loadBusinessData = () => {
      try {
        const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');

        // Find business where user is a member
        const userBusiness = businesses.find(b =>
          b.members.some(m => m.email.toLowerCase() === user?.email.toLowerCase())
        );

        if (userBusiness) {
          setBusinessData(userBusiness);
        }
      } catch (err) {
        setError('Failed to load business data');
      }
    };

    if (user?.email) {
      loadBusinessData();
    }
  }, [user]);

  // dynamically updates the business data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJoinInputChange = (e) => {
    const { name, value } = e.target;
    setJoinData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!businessData.password) {
        setError('Business password is required');
        return;
      }

      // Get existing businesses
      const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');

      if (businessData.id) {
        // Update existing business
        const updatedBusinesses = businesses.map(business => 
          business.id === businessData.id ? {
            ...business,
            name: businessData.name,
            tax_id: businessData.tax_id,
            email: businessData.email,
            address: businessData.address,
            default_currency: businessData.default_currency,
            password: businessData.password,
            updated_at: new Date().toISOString()
          } : business
        );

        localStorage.setItem('businesses', JSON.stringify(updatedBusinesses));
        setIsEditing(false);
      } else {
        // Create new business
        const newBusinessId = `business_${Date.now()}`;
        
        const newBusiness = {
          ...businessData,
          id: newBusinessId,
          admin_id: user.id,
          created_at: new Date().toISOString(),
          members: [{
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'admin',
            joined_at: new Date().toISOString()
          }]
        };

        // Add new business to array
        businesses.push(newBusiness);
        localStorage.setItem('businesses', JSON.stringify(businesses));

        // Update users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map(u => {
          if (u.email.toLowerCase() === user.email.toLowerCase()) {
            return {
              ...u,
              company: newBusiness.name,
              businessRole: 'admin'
            };
          }
          return u;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        setBusinessData(newBusiness);
        setIsEditing(false);
      }
    } catch (err) {
      setError('Failed to save business. Please try again.');
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');
      const businessToJoin = businesses.find(b => 
        b.name.toLowerCase() === joinData.businessName.toLowerCase()
      );
      
      if (!businessToJoin) {
        setError('Business not found');
        return;
      }

      if (businessToJoin.password !== joinData.password) {
        setError('Invalid password');
        return;
      }

      // Add user as staff member
      const updatedBusiness = {
        ...businessToJoin,
        members: [
          ...businessToJoin.members,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'staff',
            joined_at: new Date().toISOString()
          }
        ]
      };

      // Update businesses array
      const updatedBusinesses = businesses.map(b => 
        b.id === businessToJoin.id ? updatedBusiness : b
      );
      localStorage.setItem('businesses', JSON.stringify(updatedBusinesses));

      // Update users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === user.email.toLowerCase()) {
          return {
            ...u,
            company: businessToJoin.name
          };
        }
        return u;
      });
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      setBusinessData(updatedBusiness);
      setShowJoinForm(false);
    } catch (err) {
      setError('Failed to join business. Please try again.');
    }
  };

  const renderBusinessMembers = () => {
    if (!businessData.members || businessData.members.length === 0) {
      return <p>No members yet</p>;
    }
  
    return (
      <div className="business-members">
        <h3>Business Members</h3>
        <ul className="members-list">
          {businessData.members.map(member => (
            <li 
              key={`${member.id}-${member.joined_at}`} 
              className="member-item"
            >
              <span className="member-name">{member.name}</span>
              <span className="member-email">{member.email}</span>
              <span className="member-role">{member.role}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="business-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="business-header">
          <h1>Business Profile</h1>
          {businessData.id && (user?.businessRole === 'admin' || user?.role === 'admin') && !isEditing && (
            <button 
              className="btn-edit" 
              onClick={() => setIsEditing(true)}
              title="Edit Business Information"
            >
              <i className="fas fa-edit"></i>
              <span>Edit Business</span>
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* No Business State */}
        {!businessData.id && !showJoinForm && (
          <div className="no-business">
            <i className="fas fa-building"></i>
            <h2>No Business Profile</h2>
            {user?.role === 'admin' ? ( // Changed from 'Admin' to 'admin'
              <>
                <p>Create or join a business to get started</p>
                <div className="business-actions">
                  <button className="btn-primary" onClick={() => setIsEditing(true)}>
                    Create Business
                  </button>
                  <button className="btn-secondary" onClick={() => setShowJoinForm(true)}>
                    Join Business
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Join an existing business to get started</p>
                <button className="btn-primary" onClick={() => setShowJoinForm(true)}>
                  Join Business
                </button>
              </>
            )}
          </div>
        )}

        {/* Business Information Display */}
        {businessData.id && !isEditing && (
          <div className="business-card">
            <div className="business-info">
              <h2>{businessData.name}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Tax ID:</label>
                  <span>{businessData.tax_id}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{businessData.email}</span>
                </div>
                <div className="info-item">
                  <label>Default Currency:</label>
                  <span>{businessData.default_currency}</span>
                </div>
                <div className="info-item full-width">
                  <label>Address:</label>
                  <span>{businessData.address}</span>
                </div>
              </div>
              {renderBusinessMembers()}
            </div>
          </div>
        )}

        {/* Business Creation/Edit Form */}
        {isEditing && (
          <div className="business-card">
            <form onSubmit={handleSubmit}>
              <div className="business-form">
                <div className="form-group">
                  <label htmlFor="name">Business Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={businessData.name}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tax_id">Tax ID</label>
                  <input
                    type="text"
                    id="tax_id"
                    name="tax_id"
                    value={businessData.tax_id}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Business Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={businessData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="default_currency">Default Currency</label>
                  <select
                    id="default_currency"
                    name="default_currency"
                    value={businessData.default_currency}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  >
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Business Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={businessData.address}
                    onChange={handleInputChange}
                    rows="3"
                    disabled={!isEditing}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Business Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={businessData.password}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="business-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join Business Form */}
        {showJoinForm && (
          <div className="business-card join-business-section">
            <h2>Join a Business</h2>
            <form onSubmit={handleJoinSubmit}>
              <div className="business-form">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={joinData.businessName}
                    onChange={handleJoinInputChange}
                    placeholder="Enter the business name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Business Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={joinData.password}
                    onChange={handleJoinInputChange}
                    placeholder="Enter the business password"
                    required
                  />
                </div>
              </div>

              <div className="business-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowJoinForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Join Business
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default Business;