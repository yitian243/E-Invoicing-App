import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import '../styles/Profile.css';
import Sidebar from './Sidebar';

function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    phone: currentUser?.phone || '',
    role: currentUser?.role || 'User',
    address: currentUser?.address || ''
    // Removed company field
  });
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const loadBusinessInfo = () => {
      if (currentUser?.email) {
        try {
          const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');
          const userBusiness = businesses.find(b => 
            b.members.some(m => m.email === currentUser.email)
          );
          
          if (userBusiness) {
            setBusinessInfo(userBusiness);
          }
        } catch (err) {
          console.error('Failed to load business info:', err);
        }
      }
    };

    loadBusinessInfo();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>My Profile</h1>
          {!isEditing && (
            <button className="btn-primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
        
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar-container">
              <img src={formData.avatar} alt="Profile avatar" className="profile-avatar" />
              {isEditing && (
                <div className="avatar-upload">
                  <i className="fas fa-camera"></i>
                  <span>Change</span>
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2>{formData.name}</h2>
              <p className="profile-role">
                <i className="fas fa-user-tag"></i>
                {formData.role}
              </p>
            </div>
          </div>
          
          {isEditing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input 
                    type="text" 
                    id="company" 
                    name="company" 
                    value={formData.company} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="address">Address</label>
                  <textarea 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-buttons">
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-envelope"></i> Email
                  </div>
                  <div className="detail-value">{formData.email}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-phone"></i> Phone
                  </div>
                  <div className="detail-value">{formData.phone}</div>
                </div>
                
                <div className="detail-item full-width">
                  <div className="detail-label">
                    <i className="fas fa-map-marker-alt"></i> Address
                  </div>
                  <div className="detail-value">{formData.address}</div>
                </div>
              </div>
              {businessInfo && (
                <div className="business-section">
                  <h3>Business Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-label">
                        <i className="fas fa-building"></i> Business Name
                      </div>
                      <div className="detail-value">{businessInfo.name}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <i className="fas fa-user-tag"></i> Role
                      </div>
                      <div className="detail-value">{formData.role}</div>
                    </div>
                    
                    {formData.role === 'admin' && (
                      <div className="detail-item">
                        <div className="detail-label">
                          <i className="fas fa-id-card"></i> Business ID
                        </div>
                        <div className="detail-value">{businessInfo.id}</div>
                      </div>
                    )}
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <i className="fas fa-envelope"></i> Business Email
                      </div>
                      <div className="detail-value">{businessInfo.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="profile-security">
            <h3>Security Settings</h3>
            <div className="security-options">
              <button className="btn-outline">
                <i className="fas fa-lock"></i> Change Password
              </button>
              <button className="btn-outline">
                <i className="fas fa-shield-alt"></i> Two-Factor Authentication
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;