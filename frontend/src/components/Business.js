import React, { useEffect, useState } from 'react';
import '../styles/Business.css';
import { useAuth } from './AuthContext';
import { BACKEND_URL } from './config';
import Sidebar from './Sidebar';

function Business() {
  const [isEditing, setIsEditing] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser, token } = useAuth();
  
  // State for all businesses the user is a member of
  const [userBusinesses, setUserBusinesses] = useState([]);
  // State for the currently selected business
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  
  // State for handling member actions
  const [isEditingMember, setIsEditingMember] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
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

    // Load business details including members
    const loadBusinessDetails = React.useCallback(async (businessId) => {
      try {
        setLoading(true);
        
        // Get business details
        const businessResponse = await fetch(`${BACKEND_URL}/api/business/${businessId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!businessResponse.ok) {
          const errorData = await businessResponse.json();
          throw new Error(errorData.error || 'Failed to load business details');
        }
  
        const businessDetails = await businessResponse.json();
        
        // Get business members
        const membersResponse = await fetch(`${BACKEND_URL}/api/business/${businessId}/members`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!membersResponse.ok) {
          const errorData = await membersResponse.json();
          throw new Error(errorData.error || 'Failed to load business members');
        }
  
        const members = await membersResponse.json();
        
        // Combine business details with members
        setBusinessData({
          ...businessDetails,
          members: members || []
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading business details:', err);
        setError('Failed to load business details: ' + (err && err.message ? err.message : 'Unknown error'));
        setLoading(false);
      }
    }, [token]);
  


  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true);
        
        // Get all businesses the user is a member of
        const response = await fetch(`${BACKEND_URL}/api/business/user/${currentUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status !== 404) {
            // Only show error if it's not a "not found" error
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load business data');
          }
          setLoading(false);
          return;
        }

        const businesses = await response.json();
        
        if (businesses && businesses.length > 0) {
          setUserBusinesses(businesses);
          
          // Set the first business as selected by default
          const firstBusinessId = businesses[0].id;
          setSelectedBusinessId(firstBusinessId);
          
          // Load the selected business data
          await loadBusinessDetails(firstBusinessId);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading business:', err);
        setError('Failed to load business data: ' || 'Unknown error');
        setLoading(false);
      }
    };

    if (currentUser?.id && token) {
      loadBusinessData();
    } else {
      setLoading(false);
    }
  }, [currentUser, token, loadBusinessDetails]);
  
  
  // Function to handle business selection
  const handleBusinessSelect = async (businessId) => {
    setSelectedBusinessId(businessId);
    await loadBusinessDetails(businessId);
  };

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

      setLoading(true);
      
      let response;
      
      if (businessData.id) {
        // Update existing business
        response = await fetch(`${BACKEND_URL}/api/business/${businessData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: businessData.name,
            tax_id: businessData.tax_id,
            email: businessData.email,
            address: businessData.address,
            default_currency: businessData.default_currency,
            password: businessData.password,
            user_id: currentUser.id
          })
        });
      } else {
        // Create new business
        response = await fetch(`${BACKEND_URL}/api/business`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: businessData.name,
            tax_id: businessData.tax_id,
            email: businessData.email,
            address: businessData.address,
            default_currency: businessData.default_currency,
            password: businessData.password,
            admin_id: currentUser.id,
            admin_name: currentUser.name,
            admin_email: currentUser.email
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save business');
      }

      const result = await response.json();
      
      // Reload business details to get updated members list
      await loadBusinessDetails(result.id);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving business:', err);
      setError('Failed to save business: ' + (err && err.message ? err.message : 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/business/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: joinData.businessName,
          password: joinData.password,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join business');
      }

      const result = await response.json();
      
      // Refresh user businesses and select the newly joined one
      const businessesResponse = await fetch(`${BACKEND_URL}/api/business/user/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (businessesResponse.ok) {
        const businesses = await businessesResponse.json();
        setUserBusinesses(businesses);
      }
      
      await loadBusinessDetails(result.id);
      setSelectedBusinessId(result.id);
      setShowJoinForm(false);
    } catch (err) {
      console.error('Error joining business:', err);
      setError('Failed to join business: ' + (err && err.message ? err.message : 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle member role change
  const handleChangeRole = async (memberId, newRole) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/business/${businessData.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: newRole,
          user_id: currentUser.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member role');
      }
      
      // Reload business details to get updated members list
      await loadBusinessDetails(businessData.id);
      setIsEditingMember(null);
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('Failed to update role: ' + (err && err.message ? err.message : 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle member removal
  const handleRemoveMember = async (memberId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/business/${businessData.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: currentUser.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }
      
      // Reload business details to get updated members list
      await loadBusinessDetails(businessData.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member: ' + (err && err.message ? err.message : 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const renderBusinessMembers = () => {
    if (!businessData.members || businessData.members.length === 0) {
      return <p>No members yet</p>;
    }
    
    const adminView = isAdmin();
    
    return (
      <div className="business-members">
        <h3>Business Members</h3>
        <ul className="members-list">
          {businessData.members.map(member => (
            <li 
              key={member.id || `${member.user_id}-${member.joined_at}`} 
              className="member-item"
            >
              <span className="member-name">{member.name}</span>
              <span className="member-email">{member.email}</span>
              
              {isEditingMember === member.id ? (
                <div className="role-container">
                  <select 
                    className="role-select"
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                  <button 
                    className="btn-link"
                    onClick={() => setIsEditingMember(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : confirmDelete === member.id ? (
                <div className="role-container">
                  <button 
                    className="btn-danger"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Confirm
                  </button>
                  <button 
                    className="btn-link"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="member-actions">
                  <span className="member-role">{member.role}</span>
                  {adminView && currentUser.id !== member.user_id && (
                    <div className="member-buttons">
                      <button 
                        className="btn-link"
                        onClick={() => setIsEditingMember(member.id)}
                        title="Change role"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-link text-danger"
                        onClick={() => setConfirmDelete(member.id)}
                        title="Remove member"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Determine if user is admin
  const isAdmin = () => {
    if (!currentUser || !businessData.id) return false;
    
    // Check if user is business admin
    const userMember = businessData.members?.find(
      member => member.user_id === currentUser.id
    );
    
    return userMember?.role === 'admin' || currentUser.role === 'admin';
  };

  if (loading) {
    return (
      <div className="business-container">
        <Sidebar />
        <main className="main-content">
          <div className="loading-spinner">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="business-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="business-header">
          <h1>Business Profile</h1>
          {businessData.id && isAdmin() && !isEditing && (
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
        
        {/* Business Selector */}
        {userBusinesses.length > 0 && (
          <div className="business-selector">
            <label htmlFor="business-select">Select Business:</label>
            <select 
              id="business-select"
              value={selectedBusinessId}
              onChange={(e) => handleBusinessSelect(e.target.value)}
              disabled={loading || isEditing}
            >
              {userBusinesses.map(business => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* No Business State */}
        {!businessData.id && !showJoinForm && (
          <div className="no-business">
            <i className="fas fa-building"></i>
            <h2>No Business Profile</h2>
            {currentUser?.role === 'admin' ? (
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="default_currency">Default Currency</label>
                  <select
                    id="default_currency"
                    name="default_currency"
                    value={businessData.default_currency}
                    onChange={handleInputChange}
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="business-actions">
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
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="business-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowJoinForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Business'}
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