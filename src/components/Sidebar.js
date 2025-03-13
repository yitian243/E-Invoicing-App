import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './../Dashboard.css';
import { useAuth } from './AuthContext';

function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get current user from auth context
  const { currentUser, logout } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine active item from the URL path
  const currentPath = location.pathname;
  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    return currentPath === path;
  };

  return (
    <>
      <nav className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="logo">SmartInvoice</div>
        
        {/* Account section */}
        <div className="account-section">
          <div className="account-info" onClick={toggleDropdown}>
            <img 
              src={currentUser?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
              alt="User avatar" 
              className="account-avatar" 
            />
            <div className="account-details">
              <span className="account-name">{currentUser?.name || 'User'}</span>
              <span className="account-role">{currentUser?.role || 'Guest'}</span>
            </div>
            <i className={`fas ${dropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} account-dropdown-icon`}></i>
          </div>
          
          {/* Account dropdown */}
          {dropdownOpen && (
            <div className="account-dropdown">
              <Link to="/profile" className="dropdown-item">
                <i className="fas fa-user"></i> My Profile
              </Link>
              <Link to="/account-settings" className="dropdown-item">
                <i className="fas fa-cog"></i> Account Settings
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          )}
        </div>
        
        <ul className="nav-menu">
          <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <Link to="/">
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive('/invoicehistory') ? 'active' : ''}`}>
            <Link to="/invoicehistory">
              <i className="fas fa-file-invoice-dollar"></i>
              <span>Invoice History</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive('/contacts') ? 'active' : ''}`}>
            <Link to="/contacts">
              <i className="fas fa-users"></i>
              <span>Contacts</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive('/reports') ? 'active' : ''}`}>
            <Link to="/reports">
              <i className="fas fa-chart-line"></i>
              <span>Reports</span>
            </Link>
          </li>
          <li className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <Link to="/settings">
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="menu-toggle" onClick={toggleSidebar}>
        <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </div>
    </>
  );
}

export default Sidebar;