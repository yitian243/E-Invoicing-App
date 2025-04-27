import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import '../styles/Profile.css';
import Sidebar from './Sidebar';
import { BACKEND_URL } from './config';

function Profile() {
  const { currentUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    phone: '',
    role: 'User',
    address: ''
  });
  const [businessInfo, setBusinessInfo] = useState(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load user data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.id && token) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/profile/${currentUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.error('Failed to fetch profile data');
            return;
          }

          const result = await response.json();
          
          if (result.success && result.data) {
            setFormData({
              name: result.data.name || '',
              email: result.data.email || '',
              avatar: result.data.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
              phone: result.data.phone || '',
              role: result.data.role || 'User',
              address: result.data.address || ''
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      } else if (currentUser) {
        // Fallback to using currentUser if available
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          avatar: currentUser.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
          phone: currentUser.phone || '',
          role: currentUser.role || 'User',
          address: currentUser.address || ''
        });
      }
    };

    fetchUserProfile();
  }, [currentUser, token]);

  // Load business info from backend
  useEffect(() => {
    const loadBusinessInfo = async () => {
      if (currentUser?.id && token) {
        setBusinessLoading(true);
        try {
          const response = await fetch(`${BACKEND_URL}/api/business/user/${currentUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const businesses = await response.json();
            if (businesses && businesses.length > 0) {
              // If the user belongs to multiple businesses, use the first one
              setBusinessInfo(businesses[0]);
            }
          } else {
            // If no business found in backend, check localStorage as fallback
            try {
              const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');
              const userBusiness = businesses.find(b => 
                b.members.some(m => m.email === currentUser.email)
              );
              
              if (userBusiness) {
                setBusinessInfo(userBusiness);
              }
            } catch (err) {
              console.error('Failed to load business info from localStorage:', err);
            }
          }
        } catch (err) {
          console.error('Failed to load business info from API:', err);
        } finally {
          setBusinessLoading(false);
        }
      }
    };

    loadBusinessInfo();
  }, [currentUser, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent role from being changed
    if (name === 'role') {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAvatarClick = () => {
    // Trigger file input click when avatar upload button is clicked
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Check file size (max 5kB)
    if (file.size > 5 * 1024) {
      setError('Image size must be less than 5kB');
      return;
    }

    try {
      setImageUploading(true);
      setError('');

      // For now, we'll use a simple Base64 encoding to preview the image
      // In a production app, you would upload to a server/cloud storage
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Update formData with the new avatar URL (Base64 string)
        setFormData({
          ...formData, 
          avatar: reader.result
        });
        setImageUploading(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read the image file');
        setImageUploading(false);
      };
      
      reader.readAsDataURL(file);
      
      // In a real application, you would upload the image to your server:
      /*
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`${BACKEND_URL}/api/profile/${currentUser.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const result = await response.json();
      setFormData({
        ...formData,
        avatar: result.avatarUrl
      });
      */
      
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.id || !token) {
      setError('User not logged in or token missing');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a copy of formData without role to ensure it can't be sent
      const dataToSubmit = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        phone: formData.phone,
        address: formData.address
        // role is intentionally omitted
      };
      
      const url = `${BACKEND_URL}/api/profile/${currentUser.id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error (${response.status})`);
      }
      
      const result = await response.json();
      console.log('Profile updated successfully:', result);
      
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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
          {error && <div className="error-message">{error}</div>}
          
          <div className="profile-header">
            <div className="profile-avatar-container">
              {imageUploading ? (
                <div className="avatar-loading">Loading...</div>
              ) : (
                <img src={formData.avatar} alt="Profile avatar" className="profile-avatar" />
              )}
              
              {isEditing && (
                <>
                  {/* Hidden file input */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }} 
                    accept="image/jpeg, image/png, image/gif"
                    onChange={handleImageChange}
                  />
                  
                  {/* Avatar upload button */}
                  <div className="avatar-upload" onClick={handleAvatarClick}>
                    <i className="fas fa-camera"></i>
                    <span>Change</span>
                  </div>
                </>
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
                  <label htmlFor="role">Role</label>
                  <input 
                    type="text" 
                    id="role" 
                    name="role" 
                    value={formData.role} 
                    readOnly 
                    disabled
                    className="input-disabled"
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
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading || imageUploading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
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
                  <div className="detail-value">{formData.phone || 'Not provided'}</div>
                </div>
                
                <div className="detail-item full-width">
                  <div className="detail-label">
                    <i className="fas fa-map-marker-alt"></i> Address
                  </div>
                  <div className="detail-value">{formData.address || 'Not provided'}</div>
                </div>
              </div>
              
              {businessLoading ? (
                <div className="business-section">
                  <h3>Business Information</h3>
                  <p>Loading business data...</p>
                </div>
              ) : businessInfo ? (
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
                      <div className="detail-value">{businessInfo.email || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              ) : null}
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